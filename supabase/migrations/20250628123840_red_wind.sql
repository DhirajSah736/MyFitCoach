/*
  # Premium System Implementation

  1. New Tables
    - `user_subscriptions` - Track user subscription status
    - `stripe_customers` - Map users to Stripe customers
    - `coupon_codes` - Manage discount codes

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data

  3. Features
    - Subscription status tracking
    - Coupon code system
    - Whitelisted email support
*/

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_type text CHECK (plan_type IN ('free', 'monthly', 'yearly')),
  status text CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  is_whitelisted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stripe_customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create coupon_codes table
CREATE TABLE IF NOT EXISTS coupon_codes (
  code text PRIMARY KEY,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'amount')),
  discount_value integer NOT NULL,
  is_active boolean DEFAULT true,
  usage_limit integer,
  used_count integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;

-- Policies for user_subscriptions
CREATE POLICY "Users can read own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for stripe_customers
CREATE POLICY "Users can read own stripe customer"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stripe customer"
  ON stripe_customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for coupon_codes (read-only for authenticated users)
CREATE POLICY "Anyone can read active coupon codes"
  ON coupon_codes
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS stripe_customers_user_id_idx ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS stripe_customers_stripe_id_idx ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS coupon_codes_active_idx ON coupon_codes(is_active) WHERE is_active = true;

-- Create trigger for updating updated_at on user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample coupon codes
INSERT INTO coupon_codes (code, discount_type, discount_value, is_active, usage_limit, expires_at) VALUES
('FREE100', 'percentage', 100, true, 1000, NOW() + INTERVAL '1 year'),
('HALFOFF', 'percentage', 50, true, 500, NOW() + INTERVAL '6 months'),
('SAVE30', 'percentage', 30, true, 1000, NOW() + INTERVAL '1 year');

-- Function to check if user has premium access
CREATE OR REPLACE FUNCTION check_user_premium_access(user_email text, user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  subscription_record record;
  is_whitelisted boolean := false;
BEGIN
  -- Check if user is whitelisted
  IF user_email = 'eyemdheeraj436@gmail.com' THEN
    is_whitelisted := true;
  END IF;
  
  -- Get user subscription
  SELECT * INTO subscription_record 
  FROM user_subscriptions 
  WHERE user_id = user_id_param;
  
  -- If no record exists, create one
  IF subscription_record IS NULL THEN
    INSERT INTO user_subscriptions (user_id, plan_type, status, is_whitelisted)
    VALUES (user_id_param, 'free', 'active', is_whitelisted)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN is_whitelisted;
  END IF;
  
  -- Check if user is whitelisted
  IF subscription_record.is_whitelisted OR is_whitelisted THEN
    -- Update whitelist status if needed
    IF NOT subscription_record.is_whitelisted AND is_whitelisted THEN
      UPDATE user_subscriptions 
      SET is_whitelisted = true, updated_at = NOW()
      WHERE user_id = user_id_param;
    END IF;
    RETURN true;
  END IF;
  
  -- Check if user has active premium subscription
  IF subscription_record.plan_type IN ('monthly', 'yearly') 
     AND subscription_record.status = 'active' 
     AND (subscription_record.current_period_end IS NULL OR subscription_record.current_period_end > NOW()) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription details
CREATE OR REPLACE FUNCTION get_user_subscription_details(user_id_param uuid)
RETURNS TABLE (
  plan_type text,
  status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  is_whitelisted boolean,
  has_premium_access boolean
) AS $$
DECLARE
  user_email text;
  subscription_record record;
  has_access boolean;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
  
  -- Get subscription record
  SELECT * INTO subscription_record FROM user_subscriptions WHERE user_id = user_id_param;
  
  -- If no record exists, create one
  IF subscription_record IS NULL THEN
    INSERT INTO user_subscriptions (user_id, plan_type, status, is_whitelisted)
    VALUES (user_id_param, 'free', 'active', user_email = 'eyemdheeraj436@gmail.com')
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT * INTO subscription_record FROM user_subscriptions WHERE user_id = user_id_param;
  END IF;
  
  -- Check premium access
  SELECT check_user_premium_access(user_email, user_id_param) INTO has_access;
  
  RETURN QUERY SELECT 
    subscription_record.plan_type,
    subscription_record.status,
    subscription_record.current_period_end,
    subscription_record.cancel_at_period_end,
    subscription_record.is_whitelisted,
    has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;