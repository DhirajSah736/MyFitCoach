/*
  # Create conversation logs table for Tavus AI Coach

  1. New Tables
    - `ai_conversation_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `conversation_id` (text, not null) - Tavus conversation ID
      - `conversation_url` (text, not null) - Tavus conversation URL
      - `user_metrics` (jsonb, nullable) - snapshot of user data at time of conversation
      - `duration_seconds` (integer, nullable) - conversation duration
      - `status` (text, default 'active') - 'active', 'ended', 'error'
      - `started_at` (timestamptz, default now())
      - `ended_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on ai_conversation_logs table
    - Add policies for users to manage their own logs

  3. Indexes
    - Performance indexes for common queries
*/

CREATE TABLE IF NOT EXISTS ai_conversation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id text NOT NULL,
  conversation_url text NOT NULL,
  user_metrics jsonb,
  duration_seconds integer,
  status text DEFAULT 'active' CHECK (status IN ('active', 'ended', 'error')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Enable RLS
ALTER TABLE ai_conversation_logs ENABLE ROW LEVEL SECURITY;

-- Policies for ai_conversation_logs
CREATE POLICY "Users can read own conversation logs"
  ON ai_conversation_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation logs"
  ON ai_conversation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation logs"
  ON ai_conversation_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversation logs"
  ON ai_conversation_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS ai_conversation_logs_user_id_idx ON ai_conversation_logs(user_id);
CREATE INDEX IF NOT EXISTS ai_conversation_logs_conversation_id_idx ON ai_conversation_logs(conversation_id);
CREATE INDEX IF NOT EXISTS ai_conversation_logs_status_idx ON ai_conversation_logs(status);
CREATE INDEX IF NOT EXISTS ai_conversation_logs_started_at_idx ON ai_conversation_logs(started_at DESC);