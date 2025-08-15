/*
  # Create planner system tables

  1. New Tables
    - `planner_entries` - Main planner entries table
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, not null)
      - `description` (text, nullable)
      - `entry_type` (text, not null) - 'workout', 'meal', 'reminder', 'note'
      - `scheduled_date` (date, not null)
      - `scheduled_time` (time, nullable)
      - `status` (text, default 'pending') - 'pending', 'completed', 'cancelled'
      - `priority` (text, default 'medium') - 'low', 'medium', 'high'
      - `tags` (text array, default '{}')
      - `metadata` (jsonb, nullable) - flexible data for different entry types
      - `reminder_minutes` (integer, nullable) - minutes before to remind
      - `is_recurring` (boolean, default false)
      - `recurrence_pattern` (text, nullable) - 'daily', 'weekly', 'monthly'
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on planner_entries table
    - Add policies for users to manage their own entries

  3. Indexes
    - Performance indexes for common queries
    - Date-based indexes for efficient filtering
*/

-- Create planner_entries table
CREATE TABLE IF NOT EXISTS planner_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  entry_type text NOT NULL CHECK (entry_type IN ('workout', 'meal', 'reminder', 'note')),
  scheduled_date date NOT NULL,
  scheduled_time time,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  tags text[] DEFAULT '{}',
  metadata jsonb,
  reminder_minutes integer,
  is_recurring boolean DEFAULT false,
  recurrence_pattern text CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE planner_entries ENABLE ROW LEVEL SECURITY;

-- Policies for planner_entries
CREATE POLICY "Users can read own planner entries"
  ON planner_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planner entries"
  ON planner_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planner entries"
  ON planner_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own planner entries"
  ON planner_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS planner_entries_user_id_idx ON planner_entries(user_id);
CREATE INDEX IF NOT EXISTS planner_entries_date_idx ON planner_entries(scheduled_date);
CREATE INDEX IF NOT EXISTS planner_entries_user_date_idx ON planner_entries(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS planner_entries_status_idx ON planner_entries(status);
CREATE INDEX IF NOT EXISTS planner_entries_type_idx ON planner_entries(entry_type);
CREATE INDEX IF NOT EXISTS planner_entries_priority_idx ON planner_entries(priority);

-- Create trigger for updating updated_at
CREATE TRIGGER update_planner_entries_updated_at
  BEFORE UPDATE ON planner_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample planner entries for demonstration
INSERT INTO planner_entries (user_id, title, description, entry_type, scheduled_date, scheduled_time, status, priority, tags, metadata) VALUES
-- Use a placeholder user_id - this will be replaced with actual user data in practice
((SELECT id FROM auth.users LIMIT 1), 'Morning Workout', 'Upper body strength training session', 'workout', CURRENT_DATE, '07:00:00', 'pending', 'high', ARRAY['fitness', 'strength'], '{"duration": 45, "exercises": ["bench press", "pull-ups", "shoulder press"]}'),
((SELECT id FROM auth.users LIMIT 1), 'Protein Smoothie', 'Post-workout protein shake with banana and berries', 'meal', CURRENT_DATE, '08:30:00', 'pending', 'medium', ARRAY['nutrition', 'post-workout'], '{"calories": 350, "protein": 25}'),
((SELECT id FROM auth.users LIMIT 1), 'Meal Prep Sunday', 'Prepare meals for the upcoming week', 'reminder', CURRENT_DATE + 1, '10:00:00', 'pending', 'medium', ARRAY['meal-prep', 'planning'], '{"estimated_time": 120}'),
((SELECT id FROM auth.users LIMIT 1), 'Cardio Session', 'HIIT workout for fat burning', 'workout', CURRENT_DATE + 1, '18:00:00', 'pending', 'high', ARRAY['cardio', 'hiit'], '{"duration": 30, "intensity": "high"}'),
((SELECT id FROM auth.users LIMIT 1), 'Weekly Progress Review', 'Review fitness progress and adjust goals', 'note', CURRENT_DATE + 2, '20:00:00', 'pending', 'low', ARRAY['review', 'goals'], '{"metrics": ["weight", "measurements", "photos"]}');