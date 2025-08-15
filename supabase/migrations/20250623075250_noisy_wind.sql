/*
  # Create nutrition_logs table

  1. New Tables
    - `nutrition_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `date` (date, not null)
      - `meal_type` (text, not null)
      - `food_name` (text, not null)
      - `calories` (integer, not null)
      - `protein` (integer, nullable)
      - `carbs` (integer, nullable)
      - `fat` (integer, nullable)
      - `portion` (text, not null)
      - `time` (text, not null)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `nutrition_logs` table
    - Add policies for users to manage their own nutrition logs
*/

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  meal_type text NOT NULL,
  food_name text NOT NULL,
  calories integer NOT NULL,
  protein integer,
  carbs integer,
  fat integer,
  portion text NOT NULL,
  time text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own nutrition logs"
  ON nutrition_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition logs"
  ON nutrition_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition logs"
  ON nutrition_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition logs"
  ON nutrition_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS nutrition_logs_user_date_idx ON nutrition_logs(user_id, date);