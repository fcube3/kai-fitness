'use client';

import { useParams } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { useFitnessData } from '@/lib/use-fitness-data';
import { maxWeight, maxReps } from '@/lib/fitness-utils';
import Shell from '@/components/layout/Shell';
import { SkeletonBox } from '@/components/ui/Skeleton';
import OneRepMax from '@/components/fitness/OneRepMax';
import GoalEditor from '@/components/fitness/GoalEditor';
import ExerciseNotes from '@/components/fitness/ExerciseNotes';

export default function ExercisePage() {
  const params = useParams();
  const exerciseName = decodeURIComponent(params.name as string);
  const { sessions, loading } = useFitnessData();

  if (loading) return (
    <Shell>
      <SkeletonBox className="h-8 w-48 mb-2" />
      <SkeletonBox className="h-4 w-32 mb-6" />
      <SkeletonBox className="h-72 mb-6" />
      <SkeletonBox className="h-64" />
    </Shell>
  );

  const history = sessions
    .filter(s => s.exercises.some(e => e.name === exerciseName))
    .sort((a, b) => a.date.localeCompare(b.date));

  const chartData = history.map(s => {
    const ex = s.exercises.find(e => e.name === exerciseName)!;
    return {
      date: s.date,
      weight: maxWeight(ex.sets),
      maxReps: maxReps(ex.sets),
      session: s.id,
    };
  });

  const prWeight = Math.max(0, ...chartData.map(d => d.weight));
  const prEntry = chartData.find(d => d.weight === prWeight);

  return (
    <Shell>
      <h1 className="text-xl font-bold md:text-2xl">{exerciseName}</h1>
      <p className="text-sm text-zinc-400">{history.length} sessions tracked</p>

      {prEntry && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2">
          <span className="text-sm text-green-300">PR: {prWeight}kg</span>
          <span className="text-xs text-zinc-500">on {prEntry.date} ({prEntry.session})</span>
        </div>
      )}

      {/* 1RM Calculator */}
      <OneRepMax sessions={sessions} exerciseName={exerciseName} />

      {/* Goal */}
      <GoalEditor exerciseName={exerciseName} currentPR={prWeight} />

      {/* Weight Chart */}
      {chartData.length > 0 && (
        <section className="mt-6 rounded-xl border border-white/10 bg-zinc-900/80 p-4">
          <h2 className="text-sm font-semibold text-zinc-200">Weight Progression</h2>
          <div className="mt-4 h-52 md:h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
                {prWeight > 0 && (
                  <ReferenceLine y={prWeight} stroke="#22C55E" strokeDasharray="4 4" strokeWidth={1} strokeOpacity={0.5} />
                )}
                <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Notes */}
      <ExerciseNotes exerciseName={exerciseName} />

      {/* Full History */}
      <section className="mt-6 rounded-xl border border-white/10 bg-zinc-950/70 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">Full History</h2>
        <div className="mt-3 space-y-2">
          {[...history].reverse().map(s => {
            const ex = s.exercises.find(e => e.name === exerciseName)!;
            return (
              <div key={s.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-zinc-900/60 px-3 py-2">
                <div>
                  <span className="text-sm font-medium text-zinc-200">{s.id}</span>
                  <span className="ml-2 text-xs text-zinc-500">{s.date}</span>
                </div>
                <div className="text-xs text-zinc-400">
                  {ex.sets.map((set, i) => (
                    <span key={i} className={set.type === 'warmup' ? 'text-zinc-600' : ''}>
                      {i > 0 && ' / '}{set.reps}@{set.weight}kg
                    </span>
                  ))}
                  {ex.per_side && ' per side'}
                  {ex.equipment_note && ` (${ex.equipment_note})`}
                  {ex.previous_weight != null && <span className="text-amber-400"> was {ex.previous_weight}kg</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}
