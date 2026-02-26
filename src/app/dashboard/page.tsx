'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

type WorkoutSet = { type: string; reps: number; weight: number };
type Exercise = {
  name: string; sets: WorkoutSet[];
  previous_weight: number | null; equipment_note: string | null; per_side: boolean;
};
type Session = {
  id: string; date: string; split: string | null; week: number | null;
  raw: string; exercises: Exercise[]; parse_error?: string;
};
type Meta = { lastImport?: string; sessionCount?: number; exerciseCount?: number };

function maxWeight(sets: WorkoutSet[]) {
  return Math.max(0, ...sets.filter(s => s.type === 'working').map(s => s.weight));
}

function totalVolume(session: Session) {
  let vol = 0;
  for (const ex of session.exercises)
    for (const s of ex.sets) vol += s.reps * s.weight;
  return vol;
}

export default function FitnessDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [exercises, setExercises] = useState<string[]>([]);
  const [meta, setMeta] = useState<Meta>({});
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fitness/data', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setSessions(d.sessions || []);
        setExercises(d.exercises || []);
        setMeta(d.meta || {});
        if (d.exercises?.length) setSelectedExercise(d.exercises[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
      Loading…
    </main>
  );

  if (!sessions.length) return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-green-500/5 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-6 text-center max-w-sm">
        {/* Icon illustration */}
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-green-500/10 border border-green-500/20">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 13H8a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h5" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M35 13h5a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2h-5" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="13" y="17" width="22" height="14" rx="3" stroke="#22C55E" strokeWidth="2.5"/>
            <path d="M13 24h22" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
            <circle cx="34" cy="10" r="4" fill="#22C55E" opacity="0.2" stroke="#22C55E" strokeWidth="1.5"/>
            <path d="M32.5 10l1 1.5 2-2.5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">Ready to train</div>
          <h2 className="text-2xl font-bold text-zinc-100">No sessions yet</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Your performance data lives here — PRs, volume trends, weakness flags. Import your first workout to get started.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3 w-full">
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-left">
            <p className="text-xs text-zinc-400 mb-1">Import via script</p>
            <code className="text-xs text-green-300 font-mono">node scripts/fitness-import.js</code>
          </div>
        </div>

        <form action="/logout" method="post">
          <button className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition">
            Log out
          </button>
        </form>
      </div>
    </main>
  );

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const lastSession = sorted[0];
  const recent5 = sorted.slice(0, 5);

  // PR board: max working weight per exercise
  const prMap = new Map<string, { weight: number; date: string }>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const mw = maxWeight(ex.sets);
      const cur = prMap.get(ex.name);
      if (!cur || mw > cur.weight) prMap.set(ex.name, { weight: mw, date: s.date });
    }
  }
  const prs = Array.from(prMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.weight - a.weight);

  // Weight progression for selected exercise
  const progressionData = sessions
    .filter(s => s.exercises.some(e => e.name === selectedExercise))
    .map(s => {
      const ex = s.exercises.find(e => e.name === selectedExercise)!;
      return { date: s.date, weight: maxWeight(ex.sets) };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Weekly volume
  const weekVol = new Map<string, number>();
  for (const s of sessions) {
    // Use ISO week approximation: YYYY-WNN
    const d = new Date(s.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    weekVol.set(key, (weekVol.get(key) || 0) + totalVolume(s));
  }
  const volumeData = Array.from(weekVol.entries())
    .map(([week, volume]) => ({ week, volume }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Weakness flags: exercises with no weight increase in last 4 weeks
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const weaknesses: string[] = [];
  for (const exName of exercises) {
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
    const allSame = weights.every(w => w === weights[0]);
    if (allSame) weaknesses.push(exName);
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Nav bar */}
        <nav className="sticky top-0 z-50 -mx-4 sm:-mx-6 border-b border-white/5 bg-zinc-950/90 backdrop-blur-sm px-4 sm:px-6 py-3 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-green-400">Kai Fitness</span>
            </div>
            <div className="flex gap-2">
              <a href="/sessions" className="rounded-lg border border-green-400/30 bg-green-500/10 px-3 py-1.5 text-xs text-green-300 hover:bg-green-500/20 transition">
                Sessions
              </a>
              <form action="/logout" method="post">
                <button className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 transition">
                  Log out
                </button>
              </form>
            </div>
          </div>
        </nav>

        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-white/5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-green-400">Performance Hub</p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-100">Fitness Dashboard</h1>
            <div className="mt-1 h-0.5 w-10 rounded-full bg-green-500" />
            <p className="mt-2 text-sm text-zinc-400">
              Last: {lastSession.date} · {lastSession.id} · {meta.sessionCount || sessions.length} sessions
            </p>
            {meta.lastImport && (
              <p className="text-xs text-zinc-600">Imported: {new Date(meta.lastImport).toLocaleString()}</p>
            )}
          </div>
        </header>

        {/* Summary Cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card title="Total Sessions" value={String(sessions.length)} />
          <Card title="Exercises Tracked" value={String(exercises.length)} />
          <Card title="Latest Split" value={lastSession.split || '—'} sub={`Week ${lastSession.week || '?'}`} />
          <Card title="Top PR" value={prs[0] ? `${prs[0].weight}kg` : '—'} sub={prs[0]?.name} />
        </section>

        {/* Weight Progression Chart */}
        <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-semibold text-zinc-200">Weight Progression</h2>
            <select
              value={selectedExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className="rounded-lg border border-white/15 bg-zinc-950 px-2 py-1 text-sm text-zinc-200"
            >
              {exercises.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          {progressionData.length > 0 ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="mt-4 text-sm text-zinc-500">No data for this exercise.</p>}
        </section>

        {/* Volume Trends */}
        <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
          <h2 className="text-sm font-semibold text-zinc-200">Weekly Volume</h2>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
                <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* PR Board */}
          <section className="rounded-xl border border-white/10 bg-zinc-950/70 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">PR Board</h2>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {prs.slice(0, 15).map(pr => (
                <div key={pr.name} className="flex items-center justify-between rounded-lg bg-zinc-900/60 px-3 py-2">
                  <a href={`/exercises/${encodeURIComponent(pr.name)}`} className="text-sm text-zinc-200 hover:text-emerald-400">
                    {pr.name}
                  </a>
                  <span className="text-sm font-semibold text-emerald-400">{pr.weight}kg</span>
                </div>
              ))}
            </div>
          </section>

          {/* Weakness Flags */}
          <section className="rounded-xl border border-white/10 bg-zinc-950/70 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Weakness Flags</h2>
            <p className="mt-1 text-xs text-zinc-500">No weight increase in 4+ weeks</p>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {weaknesses.length === 0 ? (
                <p className="text-sm text-zinc-500">No stalls detected 💪</p>
              ) : weaknesses.map(name => (
                <div key={name} className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2">
                  <span className="text-amber-400">⚠</span>
                  <a href={`/exercises/${encodeURIComponent(name)}`} className="text-sm text-zinc-200 hover:text-amber-400">{name}</a>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recent Sessions */}
        <section className="rounded-xl border border-white/10 bg-zinc-950/70 p-4">
          <h2 className="text-sm font-semibold text-zinc-200">Recent Sessions</h2>
          <div className="mt-3 space-y-2">
            {recent5.map(s => (
              <div key={s.id} className="rounded-lg border border-white/5 bg-zinc-900/60">
                <button
                  onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left"
                >
                  <div>
                    <span className="text-sm font-medium text-zinc-100">{s.id}</span>
                    <span className="ml-2 text-xs text-zinc-500">{s.date}</span>
                    {s.split && <span className="ml-2 rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-300">Split {s.split}</span>}
                  </div>
                  <span className="text-xs text-zinc-500">{s.exercises.length} exercises</span>
                </button>
                {expandedSession === s.id && (
                  <div className="border-t border-white/5 px-3 py-2">
                    {s.exercises.map((ex, i) => (
                      <div key={i} className="py-1">
                        <a href={`/exercises/${encodeURIComponent(ex.name)}`} className="text-sm text-zinc-300 hover:text-emerald-400">
                          {ex.name}
                        </a>
                        <span className="ml-2 text-xs text-zinc-500">
                          {ex.sets.map(set => `${set.reps}@${set.weight}kg`).join(', ')}
                          {ex.per_side && ' (per side)'}
                        </span>
                      </div>
                    ))}
                    {s.parse_error && <p className="mt-1 text-xs text-amber-400">{s.parse_error}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-500/60 to-transparent" />
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-green-400">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}
