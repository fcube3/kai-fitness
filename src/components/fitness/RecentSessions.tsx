'use client';

import { useState } from 'react';
import type { Session } from '@/lib/types';
import { totalVolume, formatVol } from '@/lib/fitness-utils';

export default function RecentSessions({ sessions }: { sessions: Session[] }) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const recent5 = sessions.slice(0, 5);

  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-zinc-100">Recent Sessions</h2>
        <a href="/sessions" className="text-[10px] text-zinc-500 hover:text-green-400 transition">View all →</a>
      </div>
      <div className="divide-y divide-white/5">
        {recent5.map(s => {
          const vol = totalVolume(s);
          return (
            <div key={s.id} className="py-0.5">
              <button
                onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                className="w-full flex items-center justify-between py-3 text-left gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-zinc-100">{s.id}</span>
                    {s.split && (
                      <span className="rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] text-green-400">
                        {s.split}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-zinc-500">{s.date}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-[11px] text-zinc-500">{s.exercises.length} exercises</span>
                    {vol > 0 && (
                      <>
                        <span className="text-zinc-700">·</span>
                        <span className="text-[11px] text-zinc-500">{formatVol(vol)}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`text-zinc-500 text-sm shrink-0 transition-transform duration-200 ${expandedSession === s.id ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {expandedSession === s.id && (
                <div className="pb-3 pl-1 space-y-1.5">
                  {s.exercises.map((ex, i) => (
                    <div key={i} className="flex items-start justify-between text-xs gap-2">
                      <span className="text-zinc-400 truncate">{ex.name}</span>
                      <span className="text-zinc-600 shrink-0 tabular-nums text-right">
                        {ex.sets.map(set => `${set.reps}@${set.weight}kg`).join(' · ')}
                      </span>
                    </div>
                  ))}
                  {s.parse_error && (
                    <p className="text-[10px] text-amber-400 mt-1">{s.parse_error}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
