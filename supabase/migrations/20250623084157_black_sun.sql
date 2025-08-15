/*
  # Populate Exercise Database with 50+ Popular Exercises

  1. Clear existing data and insert comprehensive exercise library
  2. Include exercises across all categories: Strength, Cardio, Flexibility
  3. Add proper indexing for search performance
*/

-- Clear existing sample data and insert comprehensive exercise database
DELETE FROM exercise_database;

INSERT INTO exercise_database (name, category, muscle_groups, calories_per_minute, equipment, instructions, difficulty) VALUES

-- STRENGTH EXERCISES - COMPOUND MOVEMENTS
('Deadlift', 'strength', ARRAY['Hamstrings', 'Glutes', 'Back', 'Core'], 9.0, 'Barbell', 'Keep bar close to body, drive through heels, maintain neutral spine throughout movement', 'intermediate'),
('Back Squat', 'strength', ARRAY['Quadriceps', 'Glutes', 'Core'], 8.5, 'Barbell', 'Descend until thighs parallel to floor, keep chest up and knees tracking over toes', 'intermediate'),
('Front Squat', 'strength', ARRAY['Quadriceps', 'Core', 'Shoulders'], 8.0, 'Barbell', 'Keep elbows high, core tight, descend slowly with upright torso', 'advanced'),
('Goblet Squat', 'strength', ARRAY['Quadriceps', 'Glutes', 'Core'], 7.0, 'Dumbbell', 'Hold weight at chest, squat down keeping weight on heels', 'beginner'),
('Bench Press', 'strength', ARRAY['Chest', 'Triceps', 'Shoulders'], 8.5, 'Barbell', 'Lower bar to chest with control, press up explosively, keep feet planted', 'intermediate'),
('Incline Bench Press', 'strength', ARRAY['Chest', 'Shoulders', 'Triceps'], 8.0, 'Barbell', 'Set bench to 30-45 degrees, press bar up and slightly back', 'intermediate'),
('Dumbbell Bench Press', 'strength', ARRAY['Chest', 'Triceps', 'Shoulders'], 7.5, 'Dumbbells', 'Lower dumbbells with control, press up and slightly together', 'beginner'),
('Incline Dumbbell Press', 'strength', ARRAY['Chest', 'Shoulders', 'Triceps'], 7.5, 'Dumbbells', 'Press dumbbells up from inclined position, focus on upper chest', 'beginner'),
('Overhead Press', 'strength', ARRAY['Shoulders', 'Triceps', 'Core'], 7.5, 'Barbell', 'Press bar straight up from shoulders, keep core engaged throughout', 'intermediate'),
('Dumbbell Shoulder Press', 'strength', ARRAY['Shoulders', 'Triceps'], 7.0, 'Dumbbells', 'Press dumbbells straight up, avoid arching back excessively', 'beginner'),
('Pull-ups', 'strength', ARRAY['Back', 'Biceps'], 10.0, 'Pull-up Bar', 'Pull body up until chin clears bar, lower with control', 'intermediate'),
('Chin-ups', 'strength', ARRAY['Back', 'Biceps'], 9.5, 'Pull-up Bar', 'Use underhand grip, pull up focusing on biceps and lats', 'intermediate'),
('Barbell Rows', 'strength', ARRAY['Back', 'Biceps'], 8.0, 'Barbell', 'Pull bar to lower chest, squeeze shoulder blades together', 'intermediate'),
('Dumbbell Rows', 'strength', ARRAY['Back', 'Biceps'], 7.0, 'Dumbbells', 'Pull dumbbell to hip, keep core tight and back straight', 'beginner'),
('Dips', 'strength', ARRAY['Triceps', 'Chest', 'Shoulders'], 9.0, 'Dip Bars', 'Lower until shoulders below elbows, press up to full extension', 'intermediate'),

-- STRENGTH EXERCISES - ISOLATION MOVEMENTS
('Bicep Curls', 'strength', ARRAY['Biceps'], 5.5, 'Dumbbells', 'Curl weights up with control, squeeze at top, lower slowly', 'beginner'),
('Hammer Curls', 'strength', ARRAY['Biceps', 'Forearms'], 5.5, 'Dumbbells', 'Keep neutral grip throughout movement, control the weight', 'beginner'),
('Tricep Extensions', 'strength', ARRAY['Triceps'], 5.5, 'Dumbbells', 'Extend arms overhead, lower weight behind head with control', 'beginner'),
('Lateral Raises', 'strength', ARRAY['Shoulders'], 5.0, 'Dumbbells', 'Raise arms out to sides until parallel to floor, control descent', 'beginner'),
('Chest Flyes', 'strength', ARRAY['Chest'], 6.0, 'Dumbbells', 'Lower weights in arc motion, squeeze chest at top', 'beginner'),
('Leg Curls', 'strength', ARRAY['Hamstrings'], 6.0, 'Machine', 'Curl heels toward glutes, squeeze hamstrings at top', 'beginner'),
('Leg Extensions', 'strength', ARRAY['Quadriceps'], 6.0, 'Machine', 'Extend legs until straight, squeeze quads at top', 'beginner'),
('Calf Raises', 'strength', ARRAY['Calves'], 5.0, 'Bodyweight', 'Rise up on toes, hold briefly, lower with control', 'beginner'),

-- BODYWEIGHT STRENGTH EXERCISES
('Push-ups', 'strength', ARRAY['Chest', 'Triceps', 'Core'], 8.0, 'Bodyweight', 'Keep body in straight line from head to heels, lower chest to floor', 'beginner'),
('Diamond Push-ups', 'strength', ARRAY['Triceps', 'Chest'], 9.0, 'Bodyweight', 'Form diamond with hands, focus on tricep engagement', 'intermediate'),
('Pike Push-ups', 'strength', ARRAY['Shoulders', 'Triceps'], 8.5, 'Bodyweight', 'Start in downward dog position, lower head toward hands', 'intermediate'),
('Walking Lunges', 'strength', ARRAY['Quadriceps', 'Glutes'], 7.0, 'Bodyweight', 'Step forward into lunge, alternate legs with each step', 'beginner'),
('Reverse Lunges', 'strength', ARRAY['Quadriceps', 'Glutes'], 6.5, 'Bodyweight', 'Step backward into lunge, return to starting position', 'beginner'),
('Bulgarian Split Squats', 'strength', ARRAY['Quadriceps', 'Glutes'], 7.5, 'Bodyweight', 'Rear foot elevated, lower into single-leg squat position', 'intermediate'),
('Single-Leg Glute Bridges', 'strength', ARRAY['Glutes', 'Hamstrings'], 6.0, 'Bodyweight', 'Bridge up on one leg, squeeze glutes at top', 'beginner'),

-- CORE EXERCISES
('Planks', 'strength', ARRAY['Core', 'Shoulders'], 5.0, 'Bodyweight', 'Hold straight line from head to heels, engage entire core', 'beginner'),
('Side Planks', 'strength', ARRAY['Core', 'Obliques'], 5.5, 'Bodyweight', 'Hold side position, keep body in straight line', 'beginner'),
('Russian Twists', 'strength', ARRAY['Core', 'Obliques'], 6.0, 'Bodyweight', 'Rotate torso side to side, keep feet elevated if possible', 'beginner'),
('Dead Bug', 'strength', ARRAY['Core'], 4.5, 'Bodyweight', 'Lie on back, extend opposite arm and leg while keeping core stable', 'beginner'),
('Bird Dog', 'strength', ARRAY['Core', 'Back'], 4.5, 'Bodyweight', 'Extend opposite arm and leg from hands and knees position', 'beginner'),
('Bicycle Crunches', 'strength', ARRAY['Core', 'Obliques'], 6.5, 'Bodyweight', 'Alternate bringing elbow to opposite knee in cycling motion', 'beginner'),

-- CARDIO EXERCISES
('Running', 'cardio', ARRAY['Legs', 'Cardio'], 12.0, 'None', 'Maintain steady pace, land on midfoot, keep upright posture', 'beginner'),
('Sprinting', 'cardio', ARRAY['Legs', 'Cardio'], 18.0, 'None', 'Maximum effort short bursts, focus on form and power', 'advanced'),
('Cycling', 'cardio', ARRAY['Legs', 'Cardio'], 10.0, 'Bicycle', 'Maintain steady cadence, adjust resistance as needed', 'beginner'),
('Jump Rope', 'cardio', ARRAY['Legs', 'Cardio', 'Coordination'], 15.0, 'Jump Rope', 'Light bounces on balls of feet, keep elbows close to body', 'beginner'),
('Rowing', 'cardio', ARRAY['Back', 'Legs', 'Cardio'], 11.0, 'Rowing Machine', 'Drive with legs, pull with back, finish with arms', 'beginner'),
('Elliptical', 'cardio', ARRAY['Legs', 'Arms', 'Cardio'], 9.0, 'Elliptical Machine', 'Smooth, controlled motion, engage both arms and legs', 'beginner'),

-- HIIT AND FUNCTIONAL EXERCISES
('Burpees', 'cardio', ARRAY['Full Body', 'Cardio'], 18.0, 'Bodyweight', 'Jump down to plank, do push-up, jump back up with arms overhead', 'intermediate'),
('Mountain Climbers', 'cardio', ARRAY['Core', 'Cardio'], 12.0, 'Bodyweight', 'Alternate bringing knees to chest in plank position', 'beginner'),
('High Knees', 'cardio', ARRAY['Legs', 'Cardio'], 10.0, 'Bodyweight', 'Run in place bringing knees up to hip level', 'beginner'),
('Jumping Jacks', 'cardio', ARRAY['Full Body', 'Cardio'], 8.0, 'Bodyweight', 'Jump feet apart while raising arms overhead, return to start', 'beginner'),
('Jump Squats', 'cardio', ARRAY['Quadriceps', 'Glutes', 'Cardio'], 12.0, 'Bodyweight', 'Squat down and explode up into jump, land softly', 'intermediate'),
('Box Jumps', 'cardio', ARRAY['Quadriceps', 'Glutes', 'Cardio'], 14.0, 'Plyo Box', 'Jump onto box with both feet, step down with control', 'intermediate'),
('Kettlebell Swings', 'cardio', ARRAY['Glutes', 'Hamstrings', 'Core'], 13.0, 'Kettlebell', 'Hip hinge movement, swing kettlebell to shoulder height', 'intermediate'),
('Battle Ropes', 'cardio', ARRAY['Arms', 'Core', 'Cardio'], 15.0, 'Battle Ropes', 'Alternate arm waves, keep core engaged throughout', 'intermediate'),
('Plank Jacks', 'cardio', ARRAY['Core', 'Cardio'], 8.0, 'Bodyweight', 'In plank position, jump feet apart and together', 'beginner'),

-- FLEXIBILITY AND MOBILITY
('Yoga Flow', 'flexibility', ARRAY['Full Body', 'Flexibility'], 3.0, 'Yoga Mat', 'Flow through poses with controlled breathing and mindful movement', 'beginner'),
('Sun Salutations', 'flexibility', ARRAY['Full Body', 'Flexibility'], 4.0, 'Yoga Mat', 'Traditional yoga sequence, coordinate breath with movement', 'beginner'),
('Static Stretching', 'flexibility', ARRAY['Full Body', 'Flexibility'], 2.5, 'None', 'Hold stretches for 30-60 seconds, breathe deeply', 'beginner'),
('Dynamic Stretching', 'flexibility', ARRAY['Full Body', 'Flexibility'], 4.0, 'None', 'Controlled movements through full range of motion', 'beginner'),
('Foam Rolling', 'flexibility', ARRAY['Full Body', 'Recovery'], 3.5, 'Foam Roller', 'Apply pressure to tight muscle areas, roll slowly', 'beginner'),
('Cat-Cow Stretch', 'flexibility', ARRAY['Back', 'Core'], 3.0, 'Yoga Mat', 'Alternate between arching and rounding spine on hands and knees', 'beginner'),
('Pigeon Pose', 'flexibility', ARRAY['Hips', 'Glutes'], 2.5, 'Yoga Mat', 'Hip opener stretch, hold position and breathe deeply', 'beginner');

-- Create simple indexes for better search performance
CREATE INDEX IF NOT EXISTS exercise_database_name_idx ON exercise_database (name);
CREATE INDEX IF NOT EXISTS exercise_database_category_idx ON exercise_database (category);
CREATE INDEX IF NOT EXISTS exercise_database_difficulty_idx ON exercise_database (difficulty);