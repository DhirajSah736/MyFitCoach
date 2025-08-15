/*
  # Remove AI Coach functionality

  1. Drop Tables
    - Drop `ai_coach_logs` table and all related data
    
  2. Clean up
    - Remove all policies, indexes, and triggers related to AI coach
*/

-- Drop the ai_coach_logs table if it exists
DROP TABLE IF EXISTS ai_coach_logs CASCADE;

-- Note: This will automatically drop all related policies, indexes, and triggers
-- due to the CASCADE option