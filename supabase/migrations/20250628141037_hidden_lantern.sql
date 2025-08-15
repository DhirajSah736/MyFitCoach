/*
  # Enhanced Premium System with Usage Tracking

  1. New Tables
    - `ai_session_usage` - Track monthly AI session usage for free users

  2. Enhanced Functions
    - Drop and recreate existing functions with proper return types
    - Add usage tracking and premium access logic
    - Add membership management functions

  3. Security
    - Enable RLS on new tables
    - Add policies for user data access
*/

-- Create AI session usage tracking table
CREATE TABLE IF NOT EXISTS ai_session_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year text NOT NULL, -- Format: 'YYYY-MM'
  sessions_used integer DEFAULT 0,
  last_session_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE ai_session_usage ENABLE ROW LEVEL SECURITY;

-- Policies for ai_session_usage
CREATE POLICY "Users can read own session usage"
  ON ai_session_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session usage"
  ON ai_session_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session usage"
  ON ai_session_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS ai_session_usage_user_id_idx ON ai_session_usage(user_id);
CREATE INDEX IF NOT EXISTS ai_session_usage_month_year_idx ON ai_session_usage(month_year);

-- Create trigger for updating updated_at
CREATE TRIGGER update_ai_session_usage_updated_at
  BEFORE UPDATE ON ai_session_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Drop existing functions that need to be recreated with new signatures
DROP FUNCTION IF EXISTS get_user_subscription_details(uuid);
DROP FUNCTION IF EXISTS check_user_premium_access_with_usage(text, uuid);
DROP FUNCTION IF EXISTS track_ai_session_usage(uuid);
DROP FUNCTION IF EXISTS cancel_user_membership(uuid);
DROP FUNCTION IF EXISTS reactivate_user_membership(uuid);

-- Enhanced function to check premium access with usage tracking
CREATE OR REPLACE FUNCTION check_user_premium_access_with_usage(user_email text, user_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  subscription_record record;
  usage_record record;
  current_month text;
  is_whitelisted boolean := false;
  has_premium boolean := false;
  sessions_used integer := 0;
  sessions_remaining integer := 3;
BEGIN
  -- Check if user is whitelisted
  IF user_email = 'eyemdheeraj436@gmail.com' THEN
    is_whitelisted := true;
  END IF;
  
  -- Get current month in YYYY-MM format
  current_month := to_char(NOW(), 'YYYY-MM');
  
  -- Get user subscription
  SELECT * INTO subscription_record 
  FROM user_subscriptions 
  WHERE user_id = user_id_param;
  
  -- If no subscription record exists, create one
  IF subscription_record IS NULL THEN
    INSERT INTO user_subscriptions (user_id, plan_type, status, is_whitelisted)
    VALUES (user_id_param, 'free', 'active', is_whitelisted)
    ON CONFLICT (user_id) DO UPDATE SET
      is_whitelisted = EXCLUDED.is_whitelisted,
      updated_at = NOW();
    
    SELECT * INTO subscription_record 
    FROM user_subscriptions 
    WHERE user_id = user_id_param;
  END IF;
  
  -- Update whitelist status if needed
  IF is_whitelisted AND NOT subscription_record.is_whitelisted THEN
    UPDATE user_subscriptions 
    SET is_whitelisted = true, updated_at = NOW()
    WHERE user_id = user_id_param;
    subscription_record.is_whitelisted := true;
  END IF;
  
  -- Check if user is whitelisted (unlimited access)
  IF subscription_record.is_whitelisted THEN
    has_premium := true;
  -- Check if user has active premium subscription
  ELSIF subscription_record.plan_type IN ('monthly', 'yearly') 
     AND subscription_record.status = 'active' 
     AND (subscription_record.current_period_end IS NULL OR subscription_record.current_period_end > NOW()) THEN
    has_premium := true;
  ELSE
    -- For free users, check monthly usage
    SELECT * INTO usage_record 
    FROM ai_session_usage 
    WHERE user_id = user_id_param AND month_year = current_month;
    
    IF usage_record IS NOT NULL THEN
      sessions_used := usage_record.sessions_used;
    END IF;
    
    sessions_remaining := GREATEST(0, 3 - sessions_used);
    has_premium := sessions_remaining > 0;
  END IF;
  
  RETURN jsonb_build_object(
    'hasPremiumAccess', has_premium,
    'planType', subscription_record.plan_type,
    'status', subscription_record.status,
    'isWhitelisted', subscription_record.is_whitelisted,
    'sessionsUsed', sessions_used,
    'sessionsRemaining', sessions_remaining,
    'currentPeriodEnd', subscription_record.current_period_end,
    'cancelAtPeriodEnd', subscription_record.cancel_at_period_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track AI session usage
CREATE OR REPLACE FUNCTION track_ai_session_usage(user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  current_month text;
  user_email text;
  access_info jsonb;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
  
  -- Check if user has access
  SELECT check_user_premium_access_with_usage(user_email, user_id_param) INTO access_info;
  
  -- If user doesn't have access, return false
  IF NOT (access_info->>'hasPremiumAccess')::boolean THEN
    RETURN false;
  END IF;
  
  -- If user is whitelisted or premium, don't track usage
  IF (access_info->>'isWhitelisted')::boolean OR (access_info->>'planType') IN ('monthly', 'yearly') THEN
    RETURN true;
  END IF;
  
  -- For free users, increment usage
  current_month := to_char(NOW(), 'YYYY-MM');
  
  INSERT INTO ai_session_usage (user_id, month_year, sessions_used, last_session_date)
  VALUES (user_id_param, current_month, 1, CURRENT_DATE)
  ON CONFLICT (user_id, month_year) 
  DO UPDATE SET 
    sessions_used = ai_session_usage.sessions_used + 1,
    last_session_date = CURRENT_DATE,
    updated_at = NOW();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel membership
CREATE OR REPLACE FUNCTION cancel_user_membership(user_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  subscription_record record;
  user_email text;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
  
  -- Get current subscription
  SELECT * INTO subscription_record 
  FROM user_subscriptions 
  WHERE user_id = user_id_param;
  
  IF subscription_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No subscription found');
  END IF;
  
  -- Don't allow canceling whitelisted accounts
  IF subscription_record.is_whitelisted THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel whitelisted account');
  END IF;
  
  -- Update subscription to cancel at period end
  UPDATE user_subscriptions 
  SET 
    cancel_at_period_end = true,
    updated_at = NOW()
  WHERE user_id = user_id_param;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Membership will be canceled at the end of current billing period',
    'currentPeriodEnd', subscription_record.current_period_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reactivate canceled membership
CREATE OR REPLACE FUNCTION reactivate_user_membership(user_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  subscription_record record;
BEGIN
  -- Get current subscription
  SELECT * INTO subscription_record 
  FROM user_subscriptions 
  WHERE user_id = user_id_param;
  
  IF subscription_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No subscription found');
  END IF;
  
  -- Update subscription to not cancel at period end
  UPDATE user_subscriptions 
  SET 
    cancel_at_period_end = false,
    updated_at = NOW()
  WHERE user_id = user_id_param;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Membership reactivated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the get_user_subscription_details function with new return type
CREATE OR REPLACE FUNCTION get_user_subscription_details(user_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  user_email text;
  access_info jsonb;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
  
  -- Get comprehensive access information
  SELECT check_user_premium_access_with_usage(user_email, user_id_param) INTO access_info;
  
  RETURN access_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;