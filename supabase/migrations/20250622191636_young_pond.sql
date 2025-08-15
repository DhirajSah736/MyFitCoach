/*
  # Create user_profile table

  1. New Tables
    - `user_profile`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, unique)
      - `gender` (text, not null)
      - `age` (integer, not null)
      - `height_cm` (integer, not null)
      - `weight_kg` (real, not null)
      - `activity_level` (text, not null)
      - `goal` (text, not null)
      - `preferred_diet` (text, not null)
      - `health_notes` (text, nullable)
      - `workout_days_per_week` (integer, not null)
      - `bmr` (integer, not null)
      - `tdee` (integer, not null)
      - `calorie_goal` (integer, not null)
      - `protein_grams` (integer, not null)
      - `carbs_grams` (integer, not null)
      - `fat_grams` (integer, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `user_profile` table
    - Add policy for users to read their own profile
    - Add policy for users to insert their own profile
    - Add policy for users to update their own profile
*/

CREATE TABLE IF NOT EXISTS user_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gender text NOT NULL,
  age integer NOT NULL,
  height_cm integer NOT NULL,
  weight_kg real NOT NULL,
  activity_level text NOT NULL,
  goal text NOT NULL,
  preferred_diet text NOT NULL,
  health_notes text,
  workout_days_per_week integer NOT NULL,
  bmr integer NOT NULL,
  tdee integer NOT NULL,
  calorie_goal integer NOT NULL,
  protein_grams integer NOT NULL,
  carbs_grams integer NOT NULL,
  fat_grams integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profile
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profile
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profile
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_user_profile_updated_at
  BEFORE UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();