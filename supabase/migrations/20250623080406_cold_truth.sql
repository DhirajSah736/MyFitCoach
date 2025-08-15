/*
  # Create workout system tables

  1. New Tables
    - `workout_plans`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, not null)
      - `goal` (text, not null)
      - `duration_weeks` (integer, not null)
      - `intensity` (text, not null)
      - `estimated_time` (integer, not null)
      - `equipment` (text array)
      - `created_at` (timestamptz, default now())
    
    - `workout_exercises`
      - `id` (uuid, primary key)
      - `plan_id` (uuid, foreign key)
      - `day` (integer, not null)
      - `week` (integer, not null)
      - `name` (text, not null)
      - `sets` (integer, not null)
      - `reps` (text, not null)
      - `rest_time` (integer, not null)
      - `instructions` (text)
      - `muscle_groups` (text array)
      - `order_index` (integer, not null)
    
    - `user_workout_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `plan_id` (uuid, foreign key)
      - `start_date` (date, not null)
      - `current_day` (integer, default 1)
      - `current_week` (integer, default 1)
      - `completed_workouts` (integer array, default '{}')
      - `progress_percentage` (integer, default 0)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create workout_plans table
CREATE TABLE IF NOT EXISTS workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  goal text NOT NULL CHECK (goal IN ('weight_loss', 'muscle_building', 'endurance', 'strength')),
  duration_weeks integer NOT NULL,
  intensity text NOT NULL CHECK (intensity IN ('beginner', 'intermediate', 'advanced')),
  estimated_time integer NOT NULL,
  equipment text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create workout_exercises table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day integer NOT NULL,
  week integer NOT NULL,
  name text NOT NULL,
  sets integer NOT NULL,
  reps text NOT NULL,
  rest_time integer NOT NULL,
  instructions text,
  muscle_groups text[] DEFAULT '{}',
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_workout_progress table
CREATE TABLE IF NOT EXISTS user_workout_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  current_day integer DEFAULT 1,
  current_week integer DEFAULT 1,
  completed_workouts integer[] DEFAULT '{}',
  progress_percentage integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plan_id, is_active) -- Only one active plan per user per plan
);

-- Enable RLS
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workout_progress ENABLE ROW LEVEL SECURITY;

-- Policies for workout_plans (public read)
CREATE POLICY "Anyone can read workout plans"
  ON workout_plans
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for workout_exercises (public read)
CREATE POLICY "Anyone can read workout exercises"
  ON workout_exercises
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_workout_progress
CREATE POLICY "Users can read own workout progress"
  ON user_workout_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout progress"
  ON user_workout_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout progress"
  ON user_workout_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout progress"
  ON user_workout_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS workout_exercises_plan_id_idx ON workout_exercises(plan_id);
CREATE INDEX IF NOT EXISTS workout_exercises_day_week_idx ON workout_exercises(day, week);
CREATE INDEX IF NOT EXISTS user_workout_progress_user_id_idx ON user_workout_progress(user_id);
CREATE INDEX IF NOT EXISTS user_workout_progress_active_idx ON user_workout_progress(user_id, is_active);

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_workout_progress_updated_at
  BEFORE UPDATE ON user_workout_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample workout plans
INSERT INTO workout_plans (title, description, goal, duration_weeks, intensity, estimated_time, equipment) VALUES
('Full Body Strength Builder', 'Build lean muscle with compound movements and progressive overload', 'muscle_building', 8, 'intermediate', 45, ARRAY['Dumbbells', 'Barbell', 'Bench']),
('HIIT Fat Burner', 'High-intensity workouts for maximum calorie burn and fat loss', 'weight_loss', 6, 'advanced', 30, ARRAY['Bodyweight', 'Kettlebell']),
('Beginner Fitness Journey', 'Perfect starting point for fitness newcomers with basic movements', 'endurance', 12, 'beginner', 35, ARRAY['Bodyweight', 'Resistance Bands']),
('Powerlifting Foundation', 'Master the big three lifts: squat, bench press, and deadlift', 'strength', 10, 'advanced', 60, ARRAY['Barbell', 'Squat Rack', 'Bench']);

-- Insert sample exercises for the first plan (Full Body Strength Builder)
DO $$
DECLARE
  plan_id uuid;
BEGIN
  SELECT id INTO plan_id FROM workout_plans WHERE title = 'Full Body Strength Builder' LIMIT 1;
  
  -- Week 1, Day 1
  INSERT INTO workout_exercises (plan_id, day, week, name, sets, reps, rest_time, instructions, muscle_groups, order_index) VALUES
  (plan_id, 1, 1, 'Barbell Squat', 3, '8-10', 90, 'Keep your chest up and core tight. Descend until thighs are parallel to floor.', ARRAY['Quadriceps', 'Glutes', 'Core'], 1),
  (plan_id, 1, 1, 'Bench Press', 3, '8-10', 90, 'Lower the bar to your chest with control, then press up explosively.', ARRAY['Chest', 'Triceps', 'Shoulders'], 2),
  (plan_id, 1, 1, 'Bent-Over Row', 3, '8-10', 90, 'Pull the bar to your lower chest, squeezing your shoulder blades together.', ARRAY['Back', 'Biceps'], 3),
  (plan_id, 1, 1, 'Overhead Press', 3, '8-10', 90, 'Press the bar straight up, keeping your core engaged throughout.', ARRAY['Shoulders', 'Triceps', 'Core'], 4),
  (plan_id, 1, 1, 'Plank', 3, '30-45 sec', 60, 'Hold a straight line from head to heels, engaging your core.', ARRAY['Core', 'Shoulders'], 5);
  
  -- Week 1, Day 2
  INSERT INTO workout_exercises (plan_id, day, week, name, sets, reps, rest_time, instructions, muscle_groups, order_index) VALUES
  (plan_id, 2, 1, 'Deadlift', 3, '6-8', 120, 'Keep the bar close to your body and drive through your heels.', ARRAY['Hamstrings', 'Glutes', 'Back'], 1),
  (plan_id, 2, 1, 'Incline Dumbbell Press', 3, '8-10', 90, 'Press the dumbbells up and slightly together at the top.', ARRAY['Chest', 'Shoulders', 'Triceps'], 2),
  (plan_id, 2, 1, 'Pull-ups', 3, '5-8', 90, 'Pull yourself up until your chin clears the bar.', ARRAY['Back', 'Biceps'], 3),
  (plan_id, 2, 1, 'Dumbbell Shoulder Press', 3, '8-10', 90, 'Press the dumbbells straight up, avoiding arching your back.', ARRAY['Shoulders', 'Triceps'], 4),
  (plan_id, 2, 1, 'Russian Twists', 3, '15-20', 60, 'Rotate your torso side to side while keeping your feet elevated.', ARRAY['Core', 'Obliques'], 5);
  
  -- Week 1, Day 3
  INSERT INTO workout_exercises (plan_id, day, week, name, sets, reps, rest_time, instructions, muscle_groups, order_index) VALUES
  (plan_id, 3, 1, 'Bulgarian Split Squat', 3, '8-10 each leg', 90, 'Keep most of your weight on your front leg and descend slowly.', ARRAY['Quadriceps', 'Glutes'], 1),
  (plan_id, 3, 1, 'Dumbbell Bench Press', 3, '8-10', 90, 'Lower the dumbbells with control and press up explosively.', ARRAY['Chest', 'Triceps', 'Shoulders'], 2),
  (plan_id, 3, 1, 'Lat Pulldown', 3, '8-10', 90, 'Pull the bar down to your upper chest, squeezing your lats.', ARRAY['Back', 'Biceps'], 3),
  (plan_id, 3, 1, 'Lateral Raises', 3, '10-12', 60, 'Raise the dumbbells out to your sides until parallel to the floor.', ARRAY['Shoulders'], 4),
  (plan_id, 3, 1, 'Mountain Climbers', 3, '20-30', 60, 'Alternate bringing your knees to your chest in a plank position.', ARRAY['Core', 'Cardio'], 5);
END $$;

-- Insert exercises for HIIT Fat Burner plan
DO $$
DECLARE
  plan_id uuid;
BEGIN
  SELECT id INTO plan_id FROM workout_plans WHERE title = 'HIIT Fat Burner' LIMIT 1;
  
  -- Week 1, Day 1
  INSERT INTO workout_exercises (plan_id, day, week, name, sets, reps, rest_time, instructions, muscle_groups, order_index) VALUES
  (plan_id, 1, 1, 'Burpees', 4, '30 sec', 30, 'Jump down to plank, do a push-up, jump back up with arms overhead.', ARRAY['Full Body', 'Cardio'], 1),
  (plan_id, 1, 1, 'Jump Squats', 4, '30 sec', 30, 'Squat down and explode up into a jump, landing softly.', ARRAY['Quadriceps', 'Glutes', 'Cardio'], 2),
  (plan_id, 1, 1, 'Push-ups', 4, '30 sec', 30, 'Keep your body in a straight line throughout the movement.', ARRAY['Chest', 'Triceps', 'Core'], 3),
  (plan_id, 1, 1, 'High Knees', 4, '30 sec', 30, 'Run in place bringing your knees up to hip level.', ARRAY['Cardio', 'Core'], 4),
  (plan_id, 1, 1, 'Plank Jacks', 4, '30 sec', 30, 'In plank position, jump your feet apart and together.', ARRAY['Core', 'Cardio'], 5);
END $$;