// Canonical fitness data types — matches API response shape from /api/fitness/data

export type WorkoutSet = {
  type: string;
  reps: number;
  weight: number;
};

export type Exercise = {
  name: string;
  sets: WorkoutSet[];
  previous_weight: number | null;
  equipment_note: string | null;
  per_side: boolean;
};

export type Session = {
  id: string;
  date: string;
  split: string | null;
  week: number | null;
  raw: string;
  exercises: Exercise[];
  parse_error?: string;
};

export type Meta = {
  lastImport?: string;
  sessionCount?: number;
  exerciseCount?: number;
};

export type FitnessData = {
  sessions: Session[];
  exercises: string[];
  meta: Meta;
};

export type PR = {
  name: string;
  weight: number;
  date: string;
};

export type HealthMetric = {
  id: number;
  date: string;
  metric_type: string;
  value: number;
  unit: string;
  source: string;
};

export type HealthMetricType =
  | 'body_weight'
  | 'sleep_hours'
  | 'hrv'
  | 'resting_hr'
  | 'active_calories'
  | 'steps'
  | 'vo2_max'
  | 'blood_oxygen';

export type NutritionLog = {
  id: number;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  photo_url: string | null;
  created_at: string;
};

export type NutritionTarget = {
  id: number;
  target_type: string;
  value: number;
};

export type DailyNutrition = {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meals: NutritionLog[];
};
