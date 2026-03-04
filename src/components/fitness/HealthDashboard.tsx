'use client';

import { useHealthData } from '@/lib/use-health-data';
import type { HealthMetric } from '@/lib/types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { useMemo, useState } from 'react';

const METRIC_CONFIG: Record<string, {
  label: string;
  unit: string;
  color: string;
  chart: 'line' | 'bar';
  target?: number;
  targetLabel?: string;
  lowerBetter?: boolean;
}> = {
  body_weight: { label: 'Body Weight', unit: 'kg', color: '#3B82F6', chart: 'line' },
  sleep_hours: { label: 'Sleep', unit: 'hrs', color: '#8B5CF6', chart: 'bar', target: 7, targetLabel: '7h target' },
  hrv: { label: 'HRV', unit: 'ms', color: '#10B981', chart: 'line' },
  resting_hr: { label: 'Resting HR', unit: 'bpm', color: '#EF4444', chart: 'line', lowerBetter: true },
  active_calories: { label: 'Active Cal', unit: 'kcal', color: '#F59E0B', chart: 'bar' },
  steps: { label: 'Steps', unit: '', color: '#06B6D4', chart: 'bar' },
  vo2_max: { label: 'VO2 Max', unit: 'mL/kg/min', color: '#22C55E', chart: 'line' },
  blood_oxygen: { label: 'SpO2', unit: '%', color: '#EC4899', chart: 'line' },
};

function formatDate(d: string) {
  return d.slice(5); // MM-DD
}

function MovingAverage(data: { date: string; value: number }[], window = 7) {
  return data.map((point, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((sum, p) => sum + p.value, 0) / slice.length;
    return { ...point, avg: Math.round(avg * 10) / 10 };
  });
}

function MetricCard({
  type,
  data,
}: {
  type: string;
  data: HealthMetric[];
}) {
  const config = METRIC_CONFIG[type];
  if (!config || data.length === 0) return null;

  const chartData = useMemo(() => {
    const points = data.map(m => ({ date: formatDate(m.date), value: m.value }));
    return config.chart === 'line' ? MovingAverage(points) : points;
  }, [data, config.chart]);

  const latest = data[data.length - 1];
  const prev = data.length > 7 ? data[data.length - 8] : data[0];
  const delta = prev ? Math.round(((latest.value - prev.value) / prev.value) * 100) : 0;
  const deltaPositive = config.lowerBetter ? delta < 0 : delta > 0;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
            {config.label}
          </p>
          <p className="text-lg font-black text-zinc-100 mt-0.5">
            {typeof latest.value === 'number' ? (
              latest.value >= 1000
                ? `${(latest.value / 1000).toFixed(1)}k`
                : Number.isInteger(latest.value)
                  ? latest.value
                  : latest.value.toFixed(1)
            ) : latest.value}
            {config.unit && <span className="text-xs font-normal text-zinc-500 ml-1">{config.unit}</span>}
          </p>
        </div>
        {delta !== 0 && (
          <span className={`text-xs font-semibold ${deltaPositive ? 'text-green-400' : 'text-red-400'}`}>
            {delta > 0 ? '↑' : '↓'}{Math.abs(delta)}%
          </span>
        )}
      </div>

      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          {config.chart === 'line' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#71717a', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              {config.target && (
                <ReferenceLine y={config.target} stroke={config.color} strokeDasharray="4 4" strokeOpacity={0.4} />
              )}
              <Line type="monotone" dataKey="value" stroke={config.color} strokeWidth={1} dot={false} strokeOpacity={0.3} />
              {'avg' in (chartData[0] || {}) && (
                <Line type="monotone" dataKey="avg" stroke={config.color} strokeWidth={2} dot={false} />
              )}
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              {config.target && (
                <ReferenceLine y={config.target} stroke={config.color} strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: config.targetLabel, fill: '#71717a', fontSize: 9 }} />
              )}
              <Bar dataKey="value" fill={config.color} fillOpacity={0.6} radius={[2, 2, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const RANGE_OPTIONS = [
  { label: '2W', days: 14 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
];

export default function HealthDashboard() {
  const [rangeDays, setRangeDays] = useState(30);

  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - rangeDays);
    return d.toISOString().slice(0, 10);
  }, [rangeDays]);

  const { metrics, loading } = useHealthData(from);

  const metricsByType = useMemo(() => {
    const grouped: Record<string, HealthMetric[]> = {};
    for (const m of metrics) {
      if (!grouped[m.metric_type]) grouped[m.metric_type] = [];
      grouped[m.metric_type].push(m);
    }
    // Sort each group by date
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.date.localeCompare(b.date));
    }
    return grouped;
  }, [metrics]);

  const hasData = Object.keys(metricsByType).length > 0;

  if (loading) {
    return (
      <div className="mb-4 rounded-xl border border-white/10 bg-zinc-900 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-24 rounded bg-zinc-800" />
          <div className="h-6 w-32 rounded bg-zinc-800" />
          <div className="h-28 rounded bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!hasData) return null; // Graceful degradation: hide if no health data

  // Order metrics for display
  const displayOrder = ['body_weight', 'sleep_hours', 'hrv', 'resting_hr', 'active_calories', 'steps', 'vo2_max', 'blood_oxygen'];
  const activeMetrics = displayOrder.filter(type => metricsByType[type]?.length > 0);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
            Apple Health
          </p>
          <p className="text-sm font-bold text-zinc-100 mt-0.5">Health Metrics</p>
        </div>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.days}
              onClick={() => setRangeDays(opt.days)}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                rangeDays === opt.days
                  ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activeMetrics.map(type => (
          <MetricCard key={type} type={type} data={metricsByType[type]} />
        ))}
      </div>
    </div>
  );
}
