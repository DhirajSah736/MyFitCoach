/*
  # Remove Tavus Integration

  1. Drop Tables
    - Drop ai_conversation_logs table and all related objects

  2. Clean Up
    - Remove all policies, indexes, and triggers related to Tavus
*/

-- Drop the ai_conversation_logs table if it exists
DROP TABLE IF EXISTS ai_conversation_logs CASCADE;

-- Note: This will automatically drop all related policies, indexes, and triggers
-- due to the CASCADE option