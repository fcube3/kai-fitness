-- Phase 8: Photo-Based Nutrition Logging
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,       -- 'breakfast','lunch','dinner','snack'
  description TEXT,              -- AI-generated description of food
  calories INTEGER,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  photo_url TEXT,                -- Supabase Storage URL (optional)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_date ON nutrition_logs(date);

CREATE TABLE IF NOT EXISTS nutrition_targets (
  id SERIAL PRIMARY KEY,
  target_type TEXT NOT NULL UNIQUE, -- 'calories','protein_g','carbs_g','fat_g'
  value NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
