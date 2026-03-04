-- Phase 7: Apple Health Integration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS health_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,  -- 'body_weight','sleep_hours','hrv','resting_hr',
                              -- 'active_calories','steps','vo2_max','blood_oxygen'
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,         -- 'kg','hours','ms','bpm','kcal','steps','mL/kg/min','%'
  source TEXT DEFAULT 'apple_health',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, metric_type)  -- one value per day per metric
);

CREATE INDEX IF NOT EXISTS idx_health_date ON health_metrics(date);
CREATE INDEX IF NOT EXISTS idx_health_type ON health_metrics(metric_type);
