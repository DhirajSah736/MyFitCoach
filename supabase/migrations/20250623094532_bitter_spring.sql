/*
  # Delete Custom Templates

  1. Remove Templates
    - Delete "Push Day (custom)" template
    - Delete "Yoga Flow Workout (custom)" templates (2 instances)
    - Also delete associated template exercises

  2. Clean Up
    - Remove orphaned template exercises
    - Ensure data consistency
*/

-- Delete template exercises for custom templates first (to avoid foreign key constraints)
DELETE FROM template_exercises 
WHERE template_id IN (
  SELECT id FROM user_templates 
  WHERE name IN ('Push Day (custom)', 'Yoga Flow Workout (custom)')
);

-- Delete the custom templates
DELETE FROM user_templates 
WHERE name IN ('Push Day (custom)', 'Yoga Flow Workout (custom)');

-- Verify cleanup - this should return 0 rows
-- SELECT COUNT(*) FROM user_templates WHERE name LIKE '%custom%' OR name LIKE '%Custom%';