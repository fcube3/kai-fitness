'use client';

import { useState, useMemo } from 'react';
import type { Session } from '@/lib/types';
import { getMuscleGroup, MUSCLE_GROUP_COLORS } from '@/lib/muscle-groups';

type TimeRange = '4w' | '8w' | 'all';

function computeVolumeByGroup(sessions: Session[], timeRange: TimeRange) {
  let filtered = sessions;

  if (timeRange !== 'all') {
    const weeksBack = timeRange === '4w' ? 28 : 56;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeksBack);
    filtered = sessions.filter(s => new Date(s.date) >= cutoff);
  }

  const groupVol = new Map<string, number>();

  for (const s of filtered) {
    for (const ex of s.exercises) {
      const group = getMuscleGroup(ex.name);
      let vol = 0;
      for (const set of ex.sets) {
        vol += set.reps * set.weight;
      }
      groupVol.set(group, (groupVol.get(group) || 0) + vol);
    }
  }

  const total = Array.from(groupVol.values()).reduce((a, b) => a + b, 0);

  return Array.from(groupVol.entries())
    .map(([group, volume]) => ({
      group,
      volume,
      pct: total > 0 ? (volume / total) * 100 : 0,
      color: MUSCLE_GROUP_COLORS[group] || MUSCLE_GROUP_COLORS.Other,
    }))
    .sort((a, b) => b.volume - a.volume);
}

function formatVol(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

export default function BodyPartVolume({ sessions }: { sessions: Session[] }) {
  const [range, setRange] = useState<TimeRange>('4w');
  const data = useMemo(() => computeVolumeByGroup(sessions, range), [sessions, range]);
  const maxVol = data.length > 0 ? data[0].volume : 1;

  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-zinc-100">Volume by Muscle Group</h2>
        <div className="flex gap-1">
          {(['4w', '8w', 'all'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                range === r
                  ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-zinc-600 text-center py-6">No data for this period</p>
      ) : (
        <div className="space-y-3">
          {data.map(d => (
            <div key={d.group}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-xs text-zinc-200">{d.group}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 tabular-nums">{formatVol(d.volume)}</span>
                  <span className="text-[10px] text-zinc-600 tabular-nums w-10 text-right">{d.pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(d.volume / maxVol) * 100}%`,
                    backgroundColor: d.color,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
