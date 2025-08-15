/*
  # Add end_reason column to ai_conversation_logs

  1. Changes
    - Add `end_reason` column to `ai_conversation_logs` table
    - Column will store the reason why a conversation ended (manual or timeout)
    - Column is nullable since not all conversations may have an end reason

  2. Security
    - No RLS changes needed as the column inherits existing policies
*/

-- Add end_reason column to ai_conversation_logs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_conversation_logs' AND column_name = 'end_reason'
  ) THEN
    ALTER TABLE ai_conversation_logs ADD COLUMN end_reason text;
  END IF;
END $$;