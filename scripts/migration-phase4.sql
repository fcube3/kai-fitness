-- Phase 4: Exercise Tracking — run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS exercise_goals (
  id SERIAL PRIMARY KEY,
  exercise_name TEXT NOT NULL UNIQUE,
  target_weight NUMERIC,
  target_reps INTEGER,
  target_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercise_notes (
  id SERIAL PRIMARY KEY,
  exercise_name TEXT NOT NULL,
  note TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_notes_name ON exercise_notes(exercise_name);
