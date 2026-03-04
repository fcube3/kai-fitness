/** Estimate 1RM from a working set (weight × reps) */

export function epley(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function brzycki(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  if (reps >= 37) return weight * 36; // avoid division by zero
  return weight * (36 / (37 - reps));
}

export function estimated1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round((epley(weight, reps) + brzycki(weight, reps)) / 2);
}

/** Find the best estimated 1RM from a list of sets */
export function best1RM(sets: { type: string; reps: number; weight: number }[]): {
  e1rm: number;
  fromWeight: number;
  fromReps: number;
} | null {
  let best: { e1rm: number; fromWeight: number; fromReps: number } | null = null;

  for (const set of sets) {
    if (set.type !== 'working' || set.weight <= 0 || set.reps <= 0) continue;
    const e1rm = estimated1RM(set.weight, set.reps);
    if (!best || e1rm > best.e1rm) {
      best = { e1rm, fromWeight: set.weight, fromReps: set.reps };
    }
  }

  return best;
}
