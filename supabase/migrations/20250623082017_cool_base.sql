/*
  # Create workout logging and template system

  1. New Tables
    - `user_workout_logs` - Individual workout session logs
    - `user_templates` - Custom workout templates created by users
    - `exercise_database` - Master exercise database with calorie estimates
    - `template_exercises` - Exercises within each template

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
    - Public read access to exercise database

  3. Indexes
    - Performance indexes for common queries
*/

-- Create exercise database table
CREATE TABLE IF NOT EXISTS exercise_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL, -- 'strength', 'cardio', 'flexibility'
  muscle_groups text[] DEFAULT '{}',
  calories_per_minute real DEFAULT 5.0,
  equipment text,
  instructions text,
  difficulty text DEFAULT 'beginner',
  created_at timestamptz DEFAULT now()
);

-- Create user workout logs table
CREATE TABLE IF NOT EXISTS user_workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_type text NOT NULL, -- 'strength', 'cardio', 'flexibility'
  exercise_name text NOT NULL,
  sets integer,
  reps integer,
  duration_minutes integer,
  weight_kg real,
  calories_burned integer,
  notes text,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user templates table
CREATE TABLE IF NOT EXISTS user_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL, -- 'strength', 'cardio', 'flexibility', 'mixed'
  estimated_duration integer, -- in minutes
  estimated_calories integer,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create template exercises table
CREATE TABLE IF NOT EXISTS template_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES user_templates(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  sets integer,
  reps integer,
  duration_minutes integer,
  rest_seconds integer DEFAULT 60,
  order_index integer NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exercise_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;

-- Policies for exercise_database (public read)
CREATE POLICY "Anyone can read exercise database"
  ON exercise_database
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_workout_logs
CREATE POLICY "Users can read own workout logs"
  ON user_workout_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs"
  ON user_workout_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs"
  ON user_workout_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs"
  ON user_workout_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for user_templates
CREATE POLICY "Users can read own templates and public templates"
  ON user_templates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own templates"
  ON user_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON user_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON user_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for template_exercises
CREATE POLICY "Users can read template exercises for accessible templates"
  ON template_exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_templates 
      WHERE user_templates.id = template_exercises.template_id 
      AND (user_templates.user_id = auth.uid() OR user_templates.is_public = true)
    )
  );

CREATE POLICY "Users can insert exercises for own templates"
  ON template_exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_templates 
      WHERE user_templates.id = template_exercises.template_id 
      AND user_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises for own templates"
  ON template_exercises
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_templates 
      WHERE user_templates.id = template_exercises.template_id 
      AND user_templates.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_templates 
      WHERE user_templates.id = template_exercises.template_id 
      AND user_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises for own templates"
  ON template_exercises
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_templates 
      WHERE user_templates.id = template_exercises.template_id 
      AND user_templates.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_workout_logs_user_date_idx ON user_workout_logs(user_id, date);
CREATE INDEX IF NOT EXISTS user_workout_logs_date_idx ON user_workout_logs(date);
CREATE INDEX IF NOT EXISTS user_templates_user_id_idx ON user_templates(user_id);
CREATE INDEX IF NOT EXISTS user_templates_public_idx ON user_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS template_exercises_template_id_idx ON template_exercises(template_id);
CREATE INDEX IF NOT EXISTS template_exercises_order_idx ON template_exercises(template_id, order_index);
CREATE INDEX IF NOT EXISTS exercise_database_name_idx ON exercise_database(name);
CREATE INDEX IF NOT EXISTS exercise_database_category_idx ON exercise_database(category);

-- Create trigger for updating updated_at on user_templates
CREATE TRIGGER update_user_templates_updated_at
  BEFORE UPDATE ON user_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample exercises into database
INSERT INTO exercise_database (name, category, muscle_groups, calories_per_minute, equipment, instructions, difficulty) VALUES
-- Strength exercises
('Push-ups', 'strength', ARRAY['Chest', 'Triceps', 'Core'], 8.0, 'Bodyweight', 'Keep your body in a straight line from head to heels', 'beginner'),
('Squats', 'strength', ARRAY['Quadriceps', 'Glutes', 'Core'], 7.0, 'Bodyweight', 'Lower until thighs are parallel to floor', 'beginner'),
('Pull-ups', 'strength', ARRAY['Back', 'Biceps'], 10.0, 'Pull-up bar', 'Pull yourself up until chin clears the bar', 'intermediate'),
('Deadlifts', 'strength', ARRAY['Hamstrings', 'Glutes', 'Back'], 9.0, 'Barbell', 'Keep bar close to body, drive through heels', 'intermediate'),
('Bench Press', 'strength', ARRAY['Chest', 'Triceps', 'Shoulders'], 8.5, 'Barbell, Bench', 'Lower bar to chest, press up explosively', 'intermediate'),
('Overhead Press', 'strength', ARRAY['Shoulders', 'Triceps', 'Core'], 7.5, 'Barbell', 'Press bar straight up, keep core engaged', 'intermediate'),
('Barbell Rows', 'strength', ARRAY['Back', 'Biceps'], 8.0, 'Barbell', 'Pull bar to lower chest, squeeze shoulder blades', 'intermediate'),
('Lunges', 'strength', ARRAY['Quadriceps', 'Glutes'], 6.5, 'Bodyweight', 'Step forward, lower back knee toward ground', 'beginner'),
('Dips', 'strength', ARRAY['Triceps', 'Chest', 'Shoulders'], 9.0, 'Dip bars', 'Lower body until shoulders below elbows', 'intermediate'),
('Planks', 'strength', ARRAY['Core', 'Shoulders'], 5.0, 'Bodyweight', 'Hold straight line from head to heels', 'beginner'),

-- Cardio exercises
('Running', 'cardio', ARRAY['Legs', 'Cardio'], 12.0, 'None', 'Maintain steady pace, land on midfoot', 'beginner'),
('Cycling', 'cardio', ARRAY['Legs', 'Cardio'], 10.0, 'Bicycle', 'Maintain steady cadence, adjust resistance', 'beginner'),
('Jump Rope', 'cardio', ARRAY['Legs', 'Cardio', 'Coordination'], 15.0, 'Jump rope', 'Light bounces on balls of feet', 'beginner'),
('Burpees', 'cardio', ARRAY['Full Body', 'Cardio'], 18.0, 'Bodyweight', 'Jump down to plank, push-up, jump back up', 'intermediate'),
('Mountain Climbers', 'cardio', ARRAY['Core', 'Cardio'], 12.0, 'Bodyweight', 'Alternate bringing knees to chest in plank', 'beginner'),
('High Knees', 'cardio', ARRAY['Legs', 'Cardio'], 10.0, 'Bodyweight', 'Run in place, bring knees to hip level', 'beginner'),
('Jumping Jacks', 'cardio', ARRAY['Full Body', 'Cardio'], 8.0, 'Bodyweight', 'Jump feet apart while raising arms overhead', 'beginner'),
('Rowing', 'cardio', ARRAY['Back', 'Legs', 'Cardio'], 11.0, 'Rowing machine', 'Drive with legs, pull with back, finish with arms', 'beginner'),

-- Flexibility exercises
('Yoga Flow', 'flexibility', ARRAY['Full Body', 'Flexibility'], 3.0, 'Yoga mat', 'Flow through poses with controlled breathing', 'beginner'),
('Static Stretching', 'flexibility', ARRAY['Full Body', 'Flexibility'], 2.5, 'None', 'Hold stretches for 30-60 seconds', 'beginner'),
('Dynamic Stretching', 'flexibility', ARRAY['Full Body', 'Flexibility'], 4.0, 'None', 'Controlled movements through range of motion', 'beginner'),
('Foam Rolling', 'flexibility', ARRAY['Full Body', 'Recovery'], 3.5, 'Foam roller', 'Apply pressure to tight muscle areas', 'beginner');

-- Insert sample public templates
DO $$
DECLARE
  push_template_id uuid;
  pull_template_id uuid;
  leg_template_id uuid;
  hiit_template_id uuid;
  bro_template_id uuid;
BEGIN
  -- Push Day Template
  INSERT INTO user_templates (user_id, name, description, category, estimated_duration, estimated_calories, is_public)
  VALUES (
    (SELECT id FROM auth.users LIMIT 1), -- Use first user as template creator
    'Push Day',
    'Upper body pushing movements focusing on chest, shoulders, and triceps',
    'strength',
    45,
    350,
    true
  ) RETURNING id INTO push_template_id;

  INSERT INTO template_exercises (template_id, exercise_name, sets, reps, rest_seconds, order_index) VALUES
  (push_template_id, 'Bench Press', 4, 8, 90, 1),
  (push_template_id, 'Overhead Press', 3, 10, 90, 2),
  (push_template_id, 'Dips', 3, 12, 60, 3),
  (push_template_id, 'Push-ups', 3, 15, 60, 4);

  -- Pull Day Template
  INSERT INTO user_templates (user_id, name, description, category, estimated_duration, estimated_calories, is_public)
  VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Pull Day',
    'Upper body pulling movements focusing on back and biceps',
    'strength',
    45,
    350,
    true
  ) RETURNING id INTO pull_template_id;

  INSERT INTO template_exercises (template_id, exercise_name, sets, reps, rest_seconds, order_index) VALUES
  (pull_template_id, 'Pull-ups', 4, 8, 90, 1),
  (pull_template_id, 'Barbell Rows', 4, 10, 90, 2),
  (pull_template_id, 'Deadlifts', 3, 6, 120, 3);

  -- Leg Day Template
  INSERT INTO user_templates (user_id, name, description, category, estimated_duration, estimated_calories, is_public)
  VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Leg Day',
    'Lower body focused workout for strength and power',
    'strength',
    50,
    400,
    true
  ) RETURNING id INTO leg_template_id;

  INSERT INTO template_exercises (template_id, exercise_name, sets, reps, rest_seconds, order_index) VALUES
  (leg_template_id, 'Squats', 4, 10, 90, 1),
  (leg_template_id, 'Deadlifts', 4, 8, 120, 2),
  (leg_template_id, 'Lunges', 3, 12, 60, 3);

  -- HIIT Template
  INSERT INTO user_templates (user_id, name, description, category, estimated_duration, estimated_calories, is_public)
  VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'HIIT Blast',
    'High-intensity interval training for maximum calorie burn',
    'cardio',
    25,
    300,
    true
  ) RETURNING id INTO hiit_template_id;

  INSERT INTO template_exercises (template_id, exercise_name, sets, duration_minutes, rest_seconds, order_index) VALUES
  (hiit_template_id, 'Burpees', 4, 1, 30, 1),
  (hiit_template_id, 'Mountain Climbers', 4, 1, 30, 2),
  (hiit_template_id, 'Jumping Jacks', 4, 1, 30, 3),
  (hiit_template_id, 'High Knees', 4, 1, 30, 4);

  -- Bro Split Template
  INSERT INTO user_templates (user_id, name, description, category, estimated_duration, estimated_calories, is_public)
  VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Bro Split',
    'Classic bodybuilding split focusing on one muscle group per session',
    'strength',
    60,
    450,
    true
  ) RETURNING id INTO bro_template_id;

  INSERT INTO template_exercises (template_id, exercise_name, sets, reps, rest_seconds, order_index) VALUES
  (bro_template_id, 'Bench Press', 4, 10, 90, 1),
  (bro_template_id, 'Push-ups', 3, 15, 60, 2),
  (bro_template_id, 'Dips', 3, 12, 60, 3),
  (bro_template_id, 'Overhead Press', 3, 12, 90, 4);
END $$;