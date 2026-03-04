// Auto-detect muscle group from exercise name
// Keyword-based matching — order matters (first match wins)

type MuscleGroup = 'Chest' | 'Back' | 'Shoulders' | 'Legs' | 'Arms' | 'Core';

const PATTERNS: [RegExp, MuscleGroup][] = [
  // Legs
  [/squat|leg press|leg curl|leg extension|hack|lunge|bulgarian|calf|calves|hip thrust|glute|hamstring|quad|rdl|deadlift|goblet/i, 'Legs'],

  // Chest
  [/bench|chest|pec|fly|flye|push.?up|incline press|decline press|dip/i, 'Chest'],

  // Back
  [/row|pull.?up|chin.?up|lat pull|pulldown|pull down|cable row|t.?bar|back ext|rear delt/i, 'Back'],

  // Shoulders
  [/shoulder|ohp|overhead|military|lateral raise|front raise|face pull|delt|arnold|upright row|shrug/i, 'Shoulders'],

  // Arms
  [/curl|bicep|tricep|hammer|preacher|extension|skull crush|pushdown|push down|dip/i, 'Arms'],

  // Core
  [/ab|crunch|plank|sit.?up|oblique|core|cable twist|wood.?chop|leg raise|russian twist/i, 'Core'],
];

export function getMuscleGroup(exerciseName: string): MuscleGroup {
  for (const [pattern, group] of PATTERNS) {
    if (pattern.test(exerciseName)) return group;
  }
  return 'Other' as MuscleGroup;
}

export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Legs: '#22C55E',       // green
  Chest: '#3B82F6',      // blue
  Back: '#A855F7',       // purple
  Shoulders: '#F59E0B',  // amber
  Arms: '#EC4899',       // pink
  Core: '#06B6D4',       // cyan
  Other: '#6B7280',      // gray
};
