/*
  # Remove Custom Workout Templates

  1. Cleanup Operations
    - Delete template exercises for custom templates first (foreign key constraints)
    - Delete the custom templates from user_templates table
    - Clean up any orphaned data

  2. Templates to Remove
    - "Push Day (custom)"
    - "Yoga Flow(custom)" (both instances)
    - Any other templates with "(custom)" suffix

  3. Data Integrity
    - Ensure no orphaned template_exercises remain
    - Maintain referential integrity
*/

-- Delete template exercises for custom templates first (to avoid foreign key constraints)
DELETE FROM template_exercises 
WHERE template_id IN (
  SELECT id FROM user_templates 
  WHERE name ILIKE '%custom%' OR name ILIKE '%(custom)%' OR name LIKE '%Custom%'
);

-- Delete all custom templates (including variations of the name)
DELETE FROM user_templates 
WHERE name ILIKE '%custom%' 
   OR name ILIKE '%(custom)%' 
   OR name LIKE '%Custom%'
   OR name = 'Push Day (custom)'
   OR name = 'Yoga Flow(custom)'
   OR name = 'Yoga Flow Workout (custom)';

-- Clean up any potential orphaned template exercises (safety check)
DELETE FROM template_exercises 
WHERE template_id NOT IN (SELECT id FROM user_templates);

-- Verify cleanup - log the remaining templates for confirmation
-- This will help us see what templates remain in the system