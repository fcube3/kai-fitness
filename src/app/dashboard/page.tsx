'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
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

const GREEN = '#22C55E';

function maxWeight(sets: WorkoutSet[]) {
  return Math.max(0, ...sets.filter(s => s.type === 'working').map(s => s.weight));
}

function totalVolume(session: Session) {
  let vol = 0;
  for (const ex of session.exercises)
    for (const s of ex.sets) vol += s.reps * s.weight;
  return vol;
}

function formatVol(kg: number) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

function CustomLineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="font-semibold" style={{ color: GREEN }}>{payload[0].value}kg</p>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="font-semibold" style={{ color: GREEN }}>{formatVol(payload[0].value)}</p>
    </div>
  );
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
    <main className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-500 uppercase tracking-widest">Loading</p>
      </div>
    </main>
  );

  if (!sessions.length) return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-green-500/5 blur-3xl" />
      </div>
      <div className="relative flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-green-500/10 border border-green-500/20">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M13 13H8a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h5" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M35 13h5a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2h-5" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="13" y="17" width="22" height="14" rx="3" stroke={GREEN} strokeWidth="2.5"/>
          </svg>
        </div>
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">Ready to train</div>
          <h2 className="text-2xl font-bold text-zinc-100">No sessions yet</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">Import your first workout to unlock your performance data.</p>
        </div>
        <form action="/logout" method="post">
          <button className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition">Log out</button>
        </form>
      </div>
    </main>
  );

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const lastSession = sorted[0];
  const recent5 = sorted.slice(0, 5);

  // PR board
  const prMap = new Map<string, { weight: number; date: string }>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const mw = maxWeight(ex.sets);
      if (mw <= 0) continue;
      const cur = prMap.get(ex.name);
      if (!cur || mw > cur.weight) prMap.set(ex.name, { weight: mw, date: s.date });
    }
  }
  const prs = Array.from(prMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.weight - a.weight);

  // Weight progression
  const progressionData = sessions
    .filter(s => s.exercises.some(e => e.name === selectedExercise))
    .map(s => {
      const ex = s.exercises.find(e => e.name === selectedExercise)!;
      const w = maxWeight(ex.sets);
      const d = s.date.slice(5); // MM-DD
      return { date: d, weight: w };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const prForSelected = progressionData.length > 0 ? Math.max(...progressionData.map(d => d.weight)) : null;

  // Weekly volume — last 10 weeks
  const weekVol = new Map<string, number>();
  for (const s of sessions) {
    const d = new Date(s.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(5, 10); // MM-DD
    weekVol.set(key, (weekVol.get(key) || 0) + totalVolume(s));
  }
  const volumeData = Array.from(weekVol.entries())
    .map(([week, volume]) => ({ week, volume }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-10);

  // Weakness flags
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
    if (weights.every(w => w === weights[0])) weaknesses.push(exName);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-500/5 blur-3xl rounded-full" />

      <div className="relative mx-auto max-w-2xl px-4 pb-12 pt-0">
        {/* Nav */}
        <nav className="sticky top-0 z-50 -mx-4 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md px-4 py-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-green-400">Kai Fitness</span>
            </div>
            <div className="flex gap-2">
              <a href="/sessions" className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs text-green-300 hover:bg-green-500/20 transition">
                Sessions
              </a>
              <form action="/logout" method="post">
                <button className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 transition">
                  Out
                </button>
              </form>
            </div>
          </div>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-green-400 font-semibold">Performance Hub</p>
          <h1 className="mt-1 text-3xl font-black text-zinc-100">Dashboard</h1>
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
            <span>{lastSession.date}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-400">{meta.sessionCount || sessions.length} sessions</span>
            {lastSession.split && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-green-400">
                  {lastSession.split}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── STAT CARDS 2×2 ── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
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
            value={prs[0] ? `${prs[0].weight}kg` : '—'}
            sub={prs[0]?.name}
            accent
          />
        </div>

        {/* ── WEIGHT PROGRESSION ── */}
        <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 mb-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-bold text-zinc-100">Weight Progression</h2>
            {prForSelected !== null && (
              <span className="text-xs font-semibold text-green-400">PR: {prForSelected}kg</span>
            )}
          </div>
          <select
            value={selectedExercise}
            onChange={e => setSelectedExercise(e.target.value)}
            className="mb-4 w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-green-500/50"
          >
            {exercises.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          {progressionData.length > 1 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomLineTooltip />} />
                  {prForSelected !== null && (
                    <ReferenceLine y={prForSelected} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1} strokeOpacity={0.5} />
                  )}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={GREEN}
                    strokeWidth={2.5}
                    dot={{ fill: GREEN, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: GREEN, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center">
              <p className="text-sm text-zinc-600">Not enough data yet</p>
            </div>
          )}
        </section>

        {/* ── WEEKLY VOLUME ── */}
        <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 mb-4">
          <h2 className="text-sm font-bold text-zinc-100 mb-4">Weekly Volume</h2>
          {volumeData.length > 0 ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={formatVol} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="volume" fill={GREEN} fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center">
              <p className="text-sm text-zinc-600">No volume data yet</p>
            </div>
          )}
        </section>

        {/* ── PR BOARD + WEAKNESS FLAGS side by side on bigger screens ── */}
        <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
          {/* PR Board */}
          <section className="rounded-xl border border-white/10 bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-zinc-100">PR Board</h2>
              <span className="text-[10px] text-zinc-500">{prs.length} lifts</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {prs.slice(0, 15).map((pr, i) => (
                <div
                  key={pr.name}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 gap-2 ${
                    i === 0
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-zinc-800/60 border border-white/5'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${i === 0 ? 'text-green-300' : 'text-zinc-200'}`}>
                      {i === 0 && <span className="mr-1.5 text-[10px]">👑</span>}
                      {pr.name}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{pr.date}</p>
                  </div>
                  <span className={`text-base font-bold tabular-nums shrink-0 ${i === 0 ? 'text-green-400' : 'text-zinc-300'}`}>
                    {pr.weight}<span className="text-xs font-normal text-zinc-500">kg</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Weakness Flags */}
          <section className="rounded-xl border border-white/10 bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-zinc-100">Weakness Flags</h2>
              <span className="text-[10px] text-zinc-500">4+ week stall</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {weaknesses.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-3">
                  <span className="text-green-400 text-sm">✓</span>
                  <p className="text-sm text-green-300">All lifts progressing</p>
                </div>
              ) : weaknesses.map(name => (
                <div key={name} className="flex items-center gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
                  <span className="text-amber-400 text-xs shrink-0">⚠</span>
                  <span className="text-sm text-zinc-200 truncate">{name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── RECENT SESSIONS ── */}
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
      </div>
    </main>
  );
}

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
      <p className={`mt-2 text-2xl font-black truncate ${accent ? 'text-green-400' : 'text-zinc-100'}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-zinc-500 truncate">{sub}</p>}
    </div>
  );
}
