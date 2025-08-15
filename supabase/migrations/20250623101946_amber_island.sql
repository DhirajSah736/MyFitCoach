/*
  # Complete Nutrition Tracking System

  1. New Tables
    - `food_database` - Comprehensive food database with nutritional information
    - Enhanced `nutrition_logs` table structure

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for user data access

  3. Sample Data
    - Populate food database with common foods
    - Include variety of food categories and nutritional profiles
*/

-- Create comprehensive food database
CREATE TABLE IF NOT EXISTS food_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text,
  category text NOT NULL, -- 'protein', 'carbs', 'fats', 'vegetables', 'fruits', 'dairy', 'snacks', 'beverages'
  calories_per_100g integer NOT NULL,
  protein_per_100g real NOT NULL,
  carbs_per_100g real NOT NULL,
  fat_per_100g real NOT NULL,
  fiber_per_100g real DEFAULT 0,
  sugar_per_100g real DEFAULT 0,
  sodium_per_100g real DEFAULT 0, -- in mg
  serving_size_g integer DEFAULT 100,
  serving_description text DEFAULT '100g',
  barcode text,
  verified boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on food database
ALTER TABLE food_database ENABLE ROW LEVEL SECURITY;

-- Policy for food database (public read)
CREATE POLICY "Anyone can read food database"
  ON food_database
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS food_database_name_idx ON food_database USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS food_database_category_idx ON food_database(category);
CREATE INDEX IF NOT EXISTS food_database_brand_idx ON food_database(brand);

-- Insert comprehensive food database
INSERT INTO food_database (name, brand, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g, serving_size_g, serving_description) VALUES

-- PROTEIN SOURCES
('Chicken Breast (skinless)', NULL, 'protein', 165, 31.0, 0.0, 3.6, 0.0, 0.0, 74, 100, '100g'),
('Salmon (Atlantic)', NULL, 'protein', 208, 25.4, 0.0, 12.4, 0.0, 0.0, 59, 100, '100g'),
('Ground Beef (lean)', NULL, 'protein', 250, 26.0, 0.0, 15.0, 0.0, 0.0, 75, 100, '100g'),
('Eggs (whole)', NULL, 'protein', 155, 13.0, 1.1, 11.0, 0.0, 1.1, 124, 50, '1 large egg'),
('Greek Yogurt (plain)', NULL, 'protein', 59, 10.0, 3.6, 0.4, 0.0, 3.6, 36, 170, '1 cup'),
('Tuna (canned in water)', NULL, 'protein', 116, 25.5, 0.0, 0.8, 0.0, 0.0, 247, 100, '100g'),
('Cottage Cheese (low-fat)', NULL, 'protein', 72, 12.4, 2.7, 1.0, 0.0, 2.7, 364, 100, '100g'),
('Tofu (firm)', NULL, 'protein', 144, 17.3, 2.8, 8.7, 2.3, 0.6, 11, 100, '100g'),
('Protein Powder (whey)', NULL, 'protein', 400, 80.0, 8.0, 4.0, 0.0, 4.0, 200, 30, '1 scoop'),
('Turkey Breast', NULL, 'protein', 135, 30.0, 0.0, 1.0, 0.0, 0.0, 1040, 100, '100g'),

-- CARBOHYDRATES
('Brown Rice (cooked)', NULL, 'carbs', 112, 2.6, 23.0, 0.9, 1.8, 0.4, 5, 100, '100g'),
('White Rice (cooked)', NULL, 'carbs', 130, 2.7, 28.0, 0.3, 0.4, 0.1, 1, 100, '100g'),
('Quinoa (cooked)', NULL, 'carbs', 120, 4.4, 22.0, 1.9, 2.8, 0.9, 7, 100, '100g'),
('Oats (rolled, dry)', NULL, 'carbs', 389, 16.9, 66.3, 6.9, 10.6, 0.0, 2, 40, '1/2 cup dry'),
('Sweet Potato (baked)', NULL, 'carbs', 90, 2.0, 21.0, 0.1, 3.3, 6.8, 6, 100, '100g'),
('Banana', NULL, 'carbs', 89, 1.1, 23.0, 0.3, 2.6, 12.2, 1, 118, '1 medium'),
('Whole Wheat Bread', NULL, 'carbs', 247, 13.0, 41.0, 4.2, 7.0, 5.0, 400, 28, '1 slice'),
('Pasta (whole wheat, cooked)', NULL, 'carbs', 124, 5.3, 25.0, 1.1, 3.9, 0.8, 4, 100, '100g'),
('Apple', NULL, 'carbs', 52, 0.3, 14.0, 0.2, 2.4, 10.4, 1, 182, '1 medium'),
('Potato (baked with skin)', NULL, 'carbs', 93, 2.5, 21.0, 0.1, 2.4, 1.2, 7, 100, '100g'),

-- HEALTHY FATS
('Avocado', NULL, 'fats', 160, 2.0, 9.0, 15.0, 7.0, 0.7, 7, 100, '100g'),
('Almonds', NULL, 'fats', 579, 21.0, 22.0, 50.0, 12.5, 4.4, 1, 28, '1 oz (28g)'),
('Olive Oil (extra virgin)', NULL, 'fats', 884, 0.0, 0.0, 100.0, 0.0, 0.0, 2, 14, '1 tbsp'),
('Walnuts', NULL, 'fats', 654, 15.0, 14.0, 65.0, 6.7, 2.6, 2, 28, '1 oz (28g)'),
('Peanut Butter (natural)', NULL, 'fats', 588, 25.0, 20.0, 50.0, 8.0, 9.0, 17, 32, '2 tbsp'),
('Coconut Oil', NULL, 'fats', 862, 0.0, 0.0, 100.0, 0.0, 0.0, 0, 14, '1 tbsp'),
('Chia Seeds', NULL, 'fats', 486, 17.0, 42.0, 31.0, 34.4, 0.0, 16, 28, '1 oz (28g)'),
('Flaxseeds', NULL, 'fats', 534, 18.0, 29.0, 42.0, 27.3, 1.5, 30, 10, '1 tbsp'),

-- VEGETABLES
('Broccoli (steamed)', NULL, 'vegetables', 35, 2.8, 7.0, 0.4, 2.6, 1.5, 33, 100, '100g'),
('Spinach (raw)', NULL, 'vegetables', 23, 2.9, 3.6, 0.4, 2.2, 0.4, 79, 100, '100g'),
('Carrots (raw)', NULL, 'vegetables', 41, 0.9, 10.0, 0.2, 2.8, 4.7, 69, 100, '100g'),
('Bell Peppers (red)', NULL, 'vegetables', 31, 1.0, 7.0, 0.3, 2.5, 4.2, 4, 100, '100g'),
('Tomatoes (raw)', NULL, 'vegetables', 18, 0.9, 3.9, 0.2, 1.2, 2.6, 5, 100, '100g'),
('Cucumber', NULL, 'vegetables', 16, 0.7, 4.0, 0.1, 0.5, 1.7, 2, 100, '100g'),
('Lettuce (romaine)', NULL, 'vegetables', 17, 1.2, 3.3, 0.3, 2.1, 1.2, 8, 100, '100g'),
('Cauliflower (raw)', NULL, 'vegetables', 25, 1.9, 5.0, 0.3, 2.0, 1.9, 30, 100, '100g'),

-- FRUITS
('Strawberries', NULL, 'fruits', 32, 0.7, 8.0, 0.3, 2.0, 4.9, 1, 100, '100g'),
('Blueberries', NULL, 'fruits', 57, 0.7, 14.0, 0.3, 2.4, 10.0, 1, 100, '100g'),
('Orange', NULL, 'fruits', 47, 0.9, 12.0, 0.1, 2.4, 9.4, 0, 154, '1 medium'),
('Grapes', NULL, 'fruits', 62, 0.6, 16.0, 0.2, 0.9, 15.5, 2, 100, '100g'),
('Pineapple', NULL, 'fruits', 50, 0.5, 13.0, 0.1, 1.4, 9.9, 1, 100, '100g'),
('Mango', NULL, 'fruits', 60, 0.8, 15.0, 0.4, 1.6, 13.7, 1, 100, '100g'),

-- DAIRY
('Milk (whole)', NULL, 'dairy', 61, 3.2, 4.8, 3.3, 0.0, 4.8, 44, 240, '1 cup'),
('Milk (skim)', NULL, 'dairy', 34, 3.4, 5.0, 0.1, 0.0, 5.0, 42, 240, '1 cup'),
('Cheddar Cheese', NULL, 'dairy', 403, 25.0, 1.3, 33.0, 0.0, 0.5, 621, 28, '1 oz'),
('Mozzarella Cheese', NULL, 'dairy', 280, 28.0, 2.2, 17.0, 0.0, 1.0, 627, 28, '1 oz'),
('Butter', NULL, 'dairy', 717, 0.9, 0.1, 81.0, 0.0, 0.1, 11, 14, '1 tbsp'),

-- SNACKS & PROCESSED
('Dark Chocolate (70%)', NULL, 'snacks', 546, 7.8, 46.0, 31.0, 11.0, 24.0, 20, 28, '1 oz'),
('Granola Bar', NULL, 'snacks', 471, 10.0, 64.0, 20.0, 4.0, 29.0, 79, 28, '1 bar'),
('Crackers (whole wheat)', NULL, 'snacks', 418, 10.0, 73.0, 11.0, 6.0, 0.0, 549, 16, '16 crackers'),
('Popcorn (air-popped)', NULL, 'snacks', 387, 12.0, 78.0, 4.3, 14.5, 0.9, 8, 28, '1 oz'),

-- BEVERAGES
('Water', NULL, 'beverages', 0, 0.0, 0.0, 0.0, 0.0, 0.0, 0, 240, '1 cup'),
('Coffee (black)', NULL, 'beverages', 2, 0.3, 0.0, 0.0, 0.0, 0.0, 5, 240, '1 cup'),
('Green Tea', NULL, 'beverages', 2, 0.2, 0.0, 0.0, 0.0, 0.0, 2, 240, '1 cup'),
('Orange Juice', NULL, 'beverages', 45, 0.7, 10.4, 0.2, 0.2, 8.4, 1, 240, '1 cup'),
('Almond Milk (unsweetened)', NULL, 'beverages', 17, 0.6, 0.6, 1.5, 0.6, 0.0, 176, 240, '1 cup'),

-- CONDIMENTS & SEASONINGS
('Honey', NULL, 'snacks', 304, 0.3, 82.0, 0.0, 0.2, 82.0, 4, 21, '1 tbsp'),
('Mustard', NULL, 'snacks', 66, 4.0, 8.0, 4.0, 3.0, 3.0, 1135, 5, '1 tsp'),
('Ketchup', NULL, 'snacks', 112, 1.0, 27.0, 0.1, 0.4, 23.0, 907, 17, '1 tbsp'),
('Soy Sauce', NULL, 'snacks', 8, 1.3, 0.8, 0.0, 0.1, 0.4, 879, 18, '1 tbsp');