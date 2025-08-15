/*
  # Add template_used column to user_workout_logs

  1. Changes
    - Add `template_used` column to `user_workout_logs` table
    - Column will store the name of the workout template that was used (if any)
    - Column is nullable since not all workouts may use a template

  2. Security
    - No RLS changes needed as the column inherits existing policies
*/

-- Add template_used column to user_workout_logs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_workout_logs' AND column_name = 'template_used'
  ) THEN
    ALTER TABLE user_workout_logs ADD COLUMN template_used text;
  END IF;
END $$;