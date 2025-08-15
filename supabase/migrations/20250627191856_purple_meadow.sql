/*
  # Premium System Implementation

  1. New Tables
    - `coupon_codes` - Coupon management system
    - `user_premium_status` - User premium status and trial tracking
    - `larry_usage_logs` - Track Larry AI coach usage

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data

  3. Features
    - Free trial logic (3 uses of Larry)
    - Whitelisted premium email support
    - Coupon code system (free access, percentage discounts)
    - Usage tracking and limits
*/

-- Create coupon_codes table
CREATE TABLE IF NOT EXISTS coupon_codes (
  code text PRIMARY KEY,
  discount_type text NOT NULL CHECK (discount_type IN ('free', 'percentage')),
  discount_value integer NOT NULL, -- percentage for 'percentage' type, days for 'free' type
  expires_at timestamptz,
  usage_limit integer,
  used_by uuid[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create user_premium_status table
CREATE TABLE IF NOT EXISTS user_premium_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_premium boolean DEFAULT false,
  premium_type text, -- 'monthly', 'yearly', 'lifetime', 'trial'
  premium_expiry timestamptz,
  larry_uses_count integer DEFAULT 0,
  larry_uses_limit integer DEFAULT 3, -- Free trial limit
  coupon_used text, -- Last coupon code used
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create larry_usage_logs table
CREATE TABLE IF NOT EXISTS larry_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  was_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_premium_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE larry_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies for coupon_codes (read-only for authenticated users)
CREATE POLICY "Anyone can read active coupon codes"
  ON coupon_codes
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policies for user_premium_status
CREATE POLICY "Users can read own premium status"
  ON user_premium_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own premium status"
  ON user_premium_status
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own premium status"
  ON user_premium_status
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for larry_usage_logs
CREATE POLICY "Users can read own larry usage logs"
  ON larry_usage_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own larry usage logs"
  ON larry_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own larry usage logs"
  ON larry_usage_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_premium_status_user_id_idx ON user_premium_status(user_id);
CREATE INDEX IF NOT EXISTS larry_usage_logs_user_id_idx ON larry_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS larry_usage_logs_started_at_idx ON larry_usage_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS coupon_codes_active_idx ON coupon_codes(is_active) WHERE is_active = true;

-- Create trigger for updating updated_at on user_premium_status
CREATE TRIGGER update_user_premium_status_updated_at
  BEFORE UPDATE ON user_premium_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample coupon codes
INSERT INTO coupon_codes (code, discount_type, discount_value, expires_at, usage_limit, is_active) VALUES
('FREETRIAL', 'free', 7, NOW() + INTERVAL '1 year', 1000, true), -- 7 days free trial
('SAVE30', 'percentage', 30, NOW() + INTERVAL '6 months', 500, true), -- 30% discount
('SAVE50', 'percentage', 50, NOW() + INTERVAL '3 months', 100, true), -- 50% discount
('WELCOME25', 'percentage', 25, NOW() + INTERVAL '1 year', 1000, true), -- 25% discount for new users
('LIFETIME50', 'percentage', 50, NOW() + INTERVAL '1 month', 50, true); -- Limited time 50% off

-- Function to check if user has premium access
CREATE OR REPLACE FUNCTION check_user_premium_access(user_email text, user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  premium_status record;
  is_whitelisted boolean := false;
BEGIN
  -- Check if user is whitelisted (eyemdheeraj436@gmail.com)
  IF user_email = 'eyemdheeraj436@gmail.com' THEN
    is_whitelisted := true;
  END IF;
  
  -- Get user premium status
  SELECT * INTO premium_status 
  FROM user_premium_status 
  WHERE user_id = user_id_param;
  
  -- If no record exists, create one
  IF premium_status IS NULL THEN
    INSERT INTO user_premium_status (user_id, is_premium, larry_uses_count, larry_uses_limit)
    VALUES (user_id_param, is_whitelisted, 0, 3)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN is_whitelisted;
  END IF;
  
  -- Check if user is whitelisted
  IF is_whitelisted THEN
    RETURN true;
  END IF;
  
  -- Check if user has active premium subscription
  IF premium_status.is_premium AND (premium_status.premium_expiry IS NULL OR premium_status.premium_expiry > NOW()) THEN
    RETURN true;
  END IF;
  
  -- Check if user has free trial uses remaining
  IF premium_status.larry_uses_count < premium_status.larry_uses_limit THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log Larry usage
CREATE OR REPLACE FUNCTION log_larry_usage(user_id_param uuid, conversation_id_param text)
RETURNS boolean AS $$
DECLARE
  premium_status record;
  user_email text;
  has_access boolean;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
  
  -- Check if user has access
  SELECT check_user_premium_access(user_email, user_id_param) INTO has_access;
  
  IF NOT has_access THEN
    RETURN false;
  END IF;
  
  -- Get current premium status
  SELECT * INTO premium_status FROM user_premium_status WHERE user_id = user_id_param;
  
  -- Log the usage
  INSERT INTO larry_usage_logs (user_id, conversation_id, was_premium)
  VALUES (user_id_param, conversation_id_param, premium_status.is_premium);
  
  -- Increment usage count if not premium and not whitelisted
  IF user_email != 'eyemdheeraj436@gmail.com' AND NOT premium_status.is_premium THEN
    UPDATE user_premium_status 
    SET larry_uses_count = larry_uses_count + 1,
        updated_at = NOW()
    WHERE user_id = user_id_param;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;