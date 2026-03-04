'use client';

import type { Session } from '@/lib/types';
import { best1RM } from '@/lib/one-rep-max';

export default function OneRepMax({
  sessions,
  exerciseName,
}: {
  sessions: Session[];
  exerciseName: string;
}) {
  // Find the best e1RM across all sessions for this exercise
  let overall: { e1rm: number; fromWeight: number; fromReps: number; date: string; sessionId: string } | null = null;

  for (const s of sessions) {
    const ex = s.exercises.find(e => e.name === exerciseName);
    if (!ex) continue;
    const result = best1RM(ex.sets);
    if (result && (!overall || result.e1rm > overall.e1rm)) {
      overall = { ...result, date: s.date, sessionId: s.id };
    }
  }

  if (!overall) return null;

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-zinc-900/80 p-4">
      <h2 className="text-sm font-semibold text-zinc-200 mb-3">Estimated 1RM</h2>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-black text-green-400 tabular-nums">{overall.e1rm}<span className="text-sm font-normal text-zinc-500">kg</span></span>
        <span className="text-xs text-zinc-500">
          from {overall.fromWeight}kg × {overall.fromReps} on {overall.date}
        </span>
      </div>
      <p className="mt-2 text-[10px] text-zinc-600">Average of Epley &amp; Brzycki formulas</p>
    </div>
  );
}
