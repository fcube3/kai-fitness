'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Line, ComposedChart,
} from 'recharts';
import type { Session } from '@/lib/types';
import { totalVolume, formatVol } from '@/lib/fitness-utils';
import { BarTooltip } from './CustomTooltips';

const GREEN = '#22C55E';

type WeekRange = 4 | 8 | 12 | 0; // 0 = all

function computeVolumeWithAvg(sessions: Session[], lastN: WeekRange) {
  const weekVol = new Map<string, { volume: number; sets: number; reps: number }>();

  for (const s of sessions) {
    const d = new Date(s.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(5, 10);
    const existing = weekVol.get(key) || { volume: 0, sets: 0, reps: 0 };

    let sessionSets = 0;
    let sessionReps = 0;
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        sessionSets++;
        sessionReps += set.reps;
      }
    }

    weekVol.set(key, {
      volume: existing.volume + totalVolume(s),
      sets: existing.sets + sessionSets,
      reps: existing.reps + sessionReps,
    });
  }

  let data = Array.from(weekVol.entries())
    .map(([week, v]) => ({ week, ...v, avg: 0 }))
    .sort((a, b) => a.week.localeCompare(b.week));

  if (lastN > 0) {
    data = data.slice(-lastN);
  }

  // 3-week trailing average
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - 2);
    const window = data.slice(start, i + 1);
    data[i].avg = Math.round(window.reduce((sum, d) => sum + d.volume, 0) / window.length);
  }

  return data;
}

function VolumeTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: { volume: number; sets: number; reps: number; avg: number } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="font-semibold" style={{ color: GREEN }}>{formatVol(d?.volume || 0)}</p>
      <div className="flex gap-3 mt-1 text-zinc-500">
        <span>{d?.sets} sets</span>
        <span>{d?.reps} reps</span>
      </div>
      {d?.avg > 0 && (
        <p className="mt-1 text-zinc-500">Avg: {formatVol(d.avg)}</p>
      )}
    </div>
  );
}

export default function WeeklyVolume({ sessions }: { sessions: Session[] }) {
  const [range, setRange] = useState<WeekRange>(8);
  const data = useMemo(() => computeVolumeWithAvg(sessions, range), [sessions, range]);

  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-zinc-100">Weekly Volume</h2>
        <div className="flex gap-1">
          {([4, 8, 12, 0] as WeekRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                range === r
                  ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {r === 0 ? 'All' : `${r}w`}
            </button>
          ))}
        </div>
      </div>
      {data.length > 0 ? (
        <div className="h-44 md:h-56 lg:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={formatVol} />
              <Tooltip content={<VolumeTooltip />} />
              <Bar dataKey="volume" fill={GREEN} fillOpacity={0.85} radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#facc15"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-44 md:h-56 lg:h-64 flex items-center justify-center">
          <p className="text-sm text-zinc-600">No volume data yet</p>
        </div>
      )}
    </section>
  );
}
