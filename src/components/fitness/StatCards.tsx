'use client';

import type { Session, Meta, PR } from '@/lib/types';

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-500/60 to-transparent" />
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">{label}</p>
      <p className={`mt-2 text-xl font-black truncate md:text-2xl ${accent ? 'text-green-400' : 'text-zinc-100'}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-zinc-500 truncate">{sub}</p>}
    </div>
  );
}

export default function StatCards({
  sessions,
  exercises,
  meta,
  lastSession,
  topPR,
}: {
  sessions: Session[];
  exercises: string[];
  meta: Meta;
  lastSession: Session;
  topPR: PR | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-4">
      <StatCard
        label="Total Sessions"
        value={String(meta.sessionCount || sessions.length)}
      />
      <StatCard
        label="Exercises"
        value={String(exercises.length)}
        sub="tracked"
      />
      <StatCard
        label="Latest Split"
        value={lastSession.split || '—'}
        sub={lastSession.week ? `Week ${lastSession.week}` : undefined}
      />
      <StatCard
        label="Top PR"
        value={topPR ? `${topPR.weight}kg` : '—'}
        sub={topPR?.name}
        accent
      />
    </div>
  );
}
