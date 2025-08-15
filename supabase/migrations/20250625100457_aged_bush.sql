/*
  # Create AI Coach Logs Table

  1. New Tables
    - `ai_coach_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `interaction_type` (text, not null) - 'voice' or 'video'
      - `agent_type` (text, not null) - 'arnold' or 'david'
      - `user_message` (text, nullable)
      - `ai_response` (text, nullable)
      - `audio_url` (text, nullable) - for voice responses
      - `video_url` (text, nullable) - for video responses
      - `user_metrics` (jsonb, nullable) - snapshot of user data at time of interaction
      - `session_id` (text, nullable) - to group related interactions
      - `duration_seconds` (integer, nullable)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on ai_coach_logs table
    - Add policies for users to manage their own logs

  3. Indexes
    - Performance indexes for common queries
*/

CREATE TABLE IF NOT EXISTS ai_coach_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('voice', 'video')),
  agent_type text NOT NULL CHECK (agent_type IN ('arnold', 'david')),
  user_message text,
  ai_response text,
  audio_url text,
  video_url text,
  user_metrics jsonb,
  session_id text,
  duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_coach_logs ENABLE ROW LEVEL SECURITY;

-- Policies for ai_coach_logs
CREATE POLICY "Users can read own AI coach logs"
  ON ai_coach_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI coach logs"
  ON ai_coach_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI coach logs"
  ON ai_coach_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI coach logs"
  ON ai_coach_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS ai_coach_logs_user_id_idx ON ai_coach_logs(user_id);
CREATE INDEX IF NOT EXISTS ai_coach_logs_session_idx ON ai_coach_logs(session_id);
CREATE INDEX IF NOT EXISTS ai_coach_logs_type_idx ON ai_coach_logs(interaction_type);
CREATE INDEX IF NOT EXISTS ai_coach_logs_created_at_idx ON ai_coach_logs(created_at DESC);