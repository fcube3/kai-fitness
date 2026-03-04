'use client';

import type { Session, HealthMetric } from '@/lib/types';
import {
  computeACWR,
  computeVolumeTrend,
  computeE1RMProgression,
  computeRecoveryScore,
  computeStrengthRatio,
  computeStreak,
  findTopCompound,
} from '@/lib/analytics-utils';
import { useHealthData } from '@/lib/use-health-data';
import { useNutritionData } from '@/lib/use-nutrition-data';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

function Card({
  label,
  value,
  sub,
  color = 'green',
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: 'green' | 'amber' | 'red' | 'blue';
  children?: React.ReactNode;
}) {
  const gradients: Record<string, string> = {
    green: 'from-green-500/60 to-transparent',
    amber: 'from-amber-500/60 to-transparent',
    red: 'from-red-500/60 to-transparent',
    blue: 'from-blue-500/60 to-transparent',
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradients[color]}`} />
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-xl font-black truncate text-zinc-100 md:text-2xl">{value}</p>
        {children}
      </div>
      {sub && <p className="mt-1 text-[11px] text-zinc-500 truncate">{sub}</p>}
    </div>
  );
}

function Sparkline({ data }: { data: { value: number }[] }) {
  if (data.length < 2) return null;
  return (
    <div className="h-8 w-16 flex-shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="#22C55E"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-xs text-zinc-500">—</span>;
  const positive = delta > 0;
  return (
    <span className={`text-xs font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>
      {positive ? '↑' : '↓'}{Math.abs(delta)}%
    </span>
  );
}

function RecoveryScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-1.5">
      <svg width="44" height="44" className="flex-shrink-0">
        <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle
          cx="22" cy="22" r="18" fill="none"
          stroke={color} strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 22 22)"
        />
        <text x="22" y="26" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          {score}
        </text>
      </svg>
      <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

export default function InsightCards({ sessions }: { sessions: Session[] }) {
  // Health data (last 30 days for recovery computation)
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);
  const { metrics: healthMetrics } = useHealthData(thirtyDaysAgo);

  // Nutrition data (today)
  const today = new Date().toISOString().slice(0, 10);
  const { todayTotals, getTarget } = useNutritionData(today);

  const hasHealth = healthMetrics.length > 0;
  const hasNutrition = todayTotals.calories > 0 || getTarget('calories') !== null;

  // Core analytics
  const volumeTrend = computeVolumeTrend(sessions);
  const acwr = computeACWR(sessions);
  const topCompound = findTopCompound(sessions);
  const e1rm = topCompound ? computeE1RMProgression(sessions, topCompound) : null;

  // Cross-domain analytics
  const recovery = useMemo(
    () => computeRecoveryScore(sessions, healthMetrics),
    [sessions, healthMetrics],
  );

  const bodyWeight = useMemo(() => {
    const bw = healthMetrics
      .filter(m => m.metric_type === 'body_weight')
      .sort((a, b) => b.date.localeCompare(a.date));
    return bw.length > 0 ? bw[0].value : null;
  }, [healthMetrics]);

  const strengthRatio = e1rm && bodyWeight
    ? computeStrengthRatio(e1rm.current, bodyWeight)
    : null;

  const acwrColor = acwr.zone === 'optimal' ? 'green' as const : acwr.zone === 'caution' ? 'amber' as const : 'red' as const;
  const acwrLabel = acwr.zone === 'optimal' ? 'Optimal' : acwr.zone === 'caution' ? 'Caution' : 'High Risk';
  const sparkData = volumeTrend.weeklyData.map(w => ({ value: w.volume }));

  // Card 1: Recovery Score (with health data) or Streak (without)
  const card1 = hasHealth ? (
    <Card
      label="Recovery"
      value=""
      color={recovery.score >= 80 ? 'green' : recovery.score >= 60 ? 'amber' : 'red'}
    >
      <RecoveryScoreRing score={recovery.score} label={recovery.label} />
    </Card>
  ) : (
    <Card
      label="Streak"
      value={`${computeStreak(sessions)} wk${computeStreak(sessions) !== 1 ? 's' : ''}`}
      sub="consecutive weeks training"
      color="green"
    />
  );

  // Card 3: E1RM with BW ratio (if body weight exists) or plain E1RM
  const e1rmValue = e1rm && e1rm.current > 0
    ? strengthRatio
      ? `${strengthRatio}x BW`
      : `${Math.round(e1rm.current)}kg`
    : '—';
  const e1rmSub = e1rm && e1rm.current > 0
    ? strengthRatio
      ? `${topCompound} · ${Math.round(e1rm.current)}kg`
      : topCompound || undefined
    : undefined;

  // Card 4: Calorie balance (with nutrition) or ACWR (without)
  const calorieTarget = getTarget('calories');
  const card4 = hasNutrition && calorieTarget ? (
    <Card
      label="Calorie Balance"
      value={`${todayTotals.calories}`}
      sub={`/ ${calorieTarget} kcal target`}
      color={todayTotals.calories <= calorieTarget * 1.1 && todayTotals.calories >= calorieTarget * 0.8 ? 'green' : 'amber'}
    >
      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
        todayTotals.calories > calorieTarget
          ? 'bg-amber-500/15 text-amber-400'
          : todayTotals.calories >= calorieTarget * 0.8
            ? 'bg-green-500/15 text-green-400'
            : 'bg-blue-500/15 text-blue-400'
      }`}>
        {todayTotals.calories > calorieTarget ? 'Surplus' : todayTotals.calories >= calorieTarget * 0.8 ? 'On Track' : 'Deficit'}
      </span>
    </Card>
  ) : (
    <Card
      label="Training Load"
      value={acwr.ratio > 0 ? String(acwr.ratio) : '—'}
      sub={`ACWR · ${acwrLabel}`}
      color={acwrColor}
    >
      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
        acwrColor === 'green' ? 'bg-green-500/15 text-green-400' :
        acwrColor === 'amber' ? 'bg-amber-500/15 text-amber-400' :
        'bg-red-500/15 text-red-400'
      }`}>
        {acwrLabel}
      </span>
    </Card>
  );

  return (
    <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-4">
      {card1}

      {/* Weekly Volume — always shown */}
      <Card
        label="Volume Trend"
        value={volumeTrend.currentWeek > 0 ? `${(volumeTrend.currentWeek / 1000).toFixed(1)}k` : '—'}
        sub={volumeTrend.average > 0 ? `avg ${(volumeTrend.average / 1000).toFixed(1)}k` : undefined}
      >
        <div className="flex flex-col items-end gap-1">
          <DeltaBadge delta={volumeTrend.delta} />
          <Sparkline data={sparkData} />
        </div>
      </Card>

      {/* E1RM — enhanced with BW ratio when available */}
      <Card
        label={strengthRatio ? 'Strength Ratio' : 'E1RM Trend'}
        value={e1rmValue}
        sub={e1rmSub}
      >
        {e1rm && e1rm.delta !== 0 && <DeltaBadge delta={e1rm.delta} />}
      </Card>

      {card4}
    </div>
  );
}
