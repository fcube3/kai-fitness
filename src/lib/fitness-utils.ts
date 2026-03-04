import type { WorkoutSet, Session, PR } from './types';

export function maxWeight(sets: WorkoutSet[]): number {
  return Math.max(0, ...sets.filter(s => s.type === 'working').map(s => s.weight));
}

export function maxReps(sets: WorkoutSet[]): number {
  return Math.max(0, ...sets.map(s => s.reps));
}

export function totalVolume(session: Session): number {
  let vol = 0;
  for (const ex of session.exercises)
    for (const s of ex.sets) vol += s.reps * s.weight;
  return vol;
}

export function formatVol(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

export function computePRs(sessions: Session[]): PR[] {
  const prMap = new Map<string, { weight: number; date: string }>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const mw = maxWeight(ex.sets);
      if (mw <= 0) continue;
      const cur = prMap.get(ex.name);
      if (!cur || mw > cur.weight) prMap.set(ex.name, { weight: mw, date: s.date });
    }
  }
  return Array.from(prMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.weight - a.weight);
}

export function computeWeaknesses(sessions: Session[], exerciseNames: string[]): string[] {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const weaknesses: string[] = [];

  for (const exName of exerciseNames) {
    const hist = sessions
      .filter(s => s.exercises.some(e => e.name === exName))
      .sort((a, b) => b.date.localeCompare(a.date));
    if (hist.length < 2) continue;
    const recentSessions = hist.filter(s => new Date(s.date) >= fourWeeksAgo);
    if (recentSessions.length < 2) continue;
    const weights = recentSessions.map(s => {
      const ex = s.exercises.find(e => e.name === exName)!;
      return maxWeight(ex.sets);
    });
    if (weights.every(w => w === weights[0])) weaknesses.push(exName);
  }

  return weaknesses;
}

export function computeWeeklyVolume(sessions: Session[], lastN = 10) {
  const weekVol = new Map<string, number>();
  for (const s of sessions) {
    const d = new Date(s.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(5, 10);
    weekVol.set(key, (weekVol.get(key) || 0) + totalVolume(s));
  }
  return Array.from(weekVol.entries())
    .map(([week, volume]) => ({ week, volume }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-lastN);
}

export function computeProgressionData(sessions: Session[], exerciseName: string) {
  return sessions
    .filter(s => s.exercises.some(e => e.name === exerciseName))
    .map(s => {
      const ex = s.exercises.find(e => e.name === exerciseName)!;
      return { date: s.date.slice(5), weight: maxWeight(ex.sets) };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
