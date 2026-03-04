'use client';

import { useState } from 'react';
import { useFitnessData } from '@/lib/use-fitness-data';
import { computePRs, computeWeaknesses, computeProgressionData } from '@/lib/fitness-utils';
import Shell from '@/components/layout/Shell';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import InsightCards from '@/components/fitness/InsightCards';
import TrainingLoadChart from '@/components/fitness/TrainingLoadChart';
import FrequencyHeatmap from '@/components/fitness/FrequencyHeatmap';
import WeightProgression from '@/components/fitness/WeightProgression';
import WeeklyVolume from '@/components/fitness/WeeklyVolume';
import BodyPartVolume from '@/components/fitness/BodyPartVolume';
import PRBoard from '@/components/fitness/PRBoard';
import WeaknessFlags from '@/components/fitness/WeaknessFlag';
import RecentSessions from '@/components/fitness/RecentSessions';
import HealthDashboard from '@/components/fitness/HealthDashboard';
import NutritionSummary from '@/components/fitness/NutritionSummary';
import RecoveryTrends from '@/components/fitness/RecoveryTrends';

const GREEN = '#22C55E';

export default function FitnessDashboard() {
  const { sessions, exercises, meta, loading } = useFitnessData();
  const [selectedExercise, setSelectedExercise] = useState('');

  if (loading) return (
    <Shell>
      <DashboardSkeleton />
    </Shell>
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

  const activeExercise = selectedExercise || exercises[0] || '';

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const lastSession = sorted[0];
  const prs = computePRs(sessions);
  const weaknesses = computeWeaknesses(sessions, exercises);
  const progressionData = computeProgressionData(sessions, activeExercise);
  const prForSelected = progressionData.length > 0 ? Math.max(...progressionData.map(d => d.weight)) : null;

  return (
    <Shell>
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-green-400 font-semibold">Performance Hub</p>
        <h1 className="mt-1 text-2xl font-black text-zinc-100 md:text-3xl">Dashboard</h1>
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

      <InsightCards sessions={sessions} />

      <NutritionSummary />

      <FrequencyHeatmap sessions={sessions} />

      <WeightProgression
        exercises={exercises}
        selectedExercise={activeExercise}
        onSelectExercise={setSelectedExercise}
        progressionData={progressionData}
        prWeight={prForSelected}
      />

      <WeeklyVolume sessions={sessions} />

      <BodyPartVolume sessions={sessions} />

      <TrainingLoadChart sessions={sessions} />

      <HealthDashboard />

      <RecoveryTrends sessions={sessions} />

      <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
        <PRBoard prs={prs} />
        <WeaknessFlags weaknesses={weaknesses} />
      </div>

      <RecentSessions sessions={sorted} />
    </Shell>
  );
}
