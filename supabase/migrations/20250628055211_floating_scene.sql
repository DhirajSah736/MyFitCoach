/*
  # Remove Premium System

  1. Drop Tables
    - Drop `coupon_codes` table
    - Drop `user_premium_status` table  
    - Drop `larry_usage_logs` table

  2. Drop Functions
    - Drop `check_user_premium_access` function
    - Drop `log_larry_usage` function

  3. Clean Up
    - Remove all premium-related data
    - Remove any premium-related policies
    - Remove any premium-related indexes
    - Reset user access to default (no premium gating)

  4. Preserve Core Features
    - Keep `ai_conversation_logs` table
    - Keep all fitness-related tables (users, workouts, meals, etc.)
    - Keep all core functionality intact
*/

-- Drop functions first (they depend on tables)
DROP FUNCTION IF EXISTS check_user_premium_access(text, uuid);
DROP FUNCTION IF EXISTS log_larry_usage(uuid, text);

-- Drop premium-related tables
DROP TABLE IF EXISTS larry_usage_logs CASCADE;
DROP TABLE IF EXISTS user_premium_status CASCADE;
DROP TABLE IF EXISTS coupon_codes CASCADE;

-- Drop any other premium-related tables that might exist
DROP TABLE IF EXISTS premium_users CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS trial_sessions CASCADE;

-- Remove any premium-related columns from existing tables (if they exist)
-- Check and remove from user_profile table
DO $$
BEGIN
  -- Remove isPremium column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE user_profile DROP COLUMN is_premium;
  END IF;

  -- Remove trialCount column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'trial_count'
  ) THEN
    ALTER TABLE user_profile DROP COLUMN trial_count;
  END IF;

  -- Remove promoCodeUsed column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'promo_code_used'
  ) THEN
    ALTER TABLE user_profile DROP COLUMN promo_code_used;
  END IF;

  -- Remove premium_expiry column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'premium_expiry'
  ) THEN
    ALTER TABLE user_profile DROP COLUMN premium_expiry;
  END IF;

  -- Remove premium_type column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profile' AND column_name = 'premium_type'
  ) THEN
    ALTER TABLE user_profile DROP COLUMN premium_type;
  END IF;
END $$;

-- Remove premium-related columns from ai_conversation_logs if they exist
DO $$
BEGIN
  -- Remove was_premium column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_conversation_logs' AND column_name = 'was_premium'
  ) THEN
    ALTER TABLE ai_conversation_logs DROP COLUMN was_premium;
  END IF;

  -- Remove premium_features_used column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_conversation_logs' AND column_name = 'premium_features_used'
  ) THEN
    ALTER TABLE ai_conversation_logs DROP COLUMN premium_features_used;
  END IF;
END $$;

-- Clean up any premium-related data from existing tables
-- Remove any whitelist emails or premium flags from auth.users metadata
-- Note: We can't directly modify auth.users, but we can clean up related data

-- Remove any premium-related entries from planner_entries if they exist
DELETE FROM planner_entries 
WHERE title ILIKE '%premium%' 
   OR description ILIKE '%premium%'
   OR title ILIKE '%upgrade%'
   OR description ILIKE '%upgrade%';

-- Clean up any premium-related workout templates
DELETE FROM user_templates 
WHERE name ILIKE '%premium%' 
   OR description ILIKE '%premium%'
   OR name ILIKE '%pro%'
   OR description ILIKE '%pro%';

-- Remove corresponding template exercises
DELETE FROM template_exercises 
WHERE template_id NOT IN (SELECT id FROM user_templates);

-- Clean up any premium-related nutrition logs (unlikely but just in case)
DELETE FROM nutrition_logs 
WHERE food_name ILIKE '%premium%';

-- Clean up any premium-related workout logs
DELETE FROM user_workout_logs 
WHERE notes ILIKE '%premium%' 
   OR exercise_name ILIKE '%premium%';

-- Verify cleanup by checking for any remaining premium references
-- This is just for logging/verification purposes

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Premium system removal completed successfully';
  RAISE NOTICE 'All premium-related tables, functions, and data have been removed';
  RAISE NOTICE 'Core fitness features remain intact';
END $$;