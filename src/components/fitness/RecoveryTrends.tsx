'use client';

import { useMemo, useState } from 'react';
import type { Session } from '@/lib/types';
import { useHealthData } from '@/lib/use-health-data';
import { buildRecoveryTimeline } from '@/lib/analytics-utils';
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

const RANGE_OPTIONS = [
  { label: '4W', weeks: 4 },
  { label: '8W', weeks: 8 },
  { label: '12W', weeks: 12 },
];

export default function RecoveryTrends({ sessions }: { sessions: Session[] }) {
  const [rangeWeeks, setRangeWeeks] = useState(8);

  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - rangeWeeks * 7);
    return d.toISOString().slice(0, 10);
  }, [rangeWeeks]);

  const { metrics, loading } = useHealthData(from);

  const data = useMemo(
    () => buildRecoveryTimeline(sessions, metrics, rangeWeeks),
    [sessions, metrics, rangeWeeks],
  );

  // Only show if we have health data to overlay
  const hasHealthData = metrics.some(m =>
    m.metric_type === 'hrv' || m.metric_type === 'resting_hr' || m.metric_type === 'sleep_hours'
  );

  if (loading || (!hasHealthData && data.length === 0)) return null;

  // If we only have training data (no health), don't show this chart
  // (TrainingLoadChart already covers volume-only view)
  if (!hasHealthData) return null;

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
            Cross-Domain
          </p>
          <p className="text-sm font-bold text-zinc-100 mt-0.5">Recovery Trends</p>
        </div>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.weeks}
              onClick={() => setRangeWeeks(opt.weeks)}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                rangeWeeks === opt.weeks
                  ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 md:h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#71717a', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#71717a', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#71717a', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />

            <Legend
              wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
              iconSize={8}
            />

            {/* Sleep as background area */}
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="sleep"
              name="Sleep (hrs)"
              fill="#8B5CF6"
              fillOpacity={0.1}
              stroke="#8B5CF6"
              strokeWidth={0}
              connectNulls
            />

            {/* Training volume as bars */}
            <Bar
              yAxisId="left"
              dataKey="volume"
              name="Volume"
              fill="#22C55E"
              fillOpacity={0.3}
              radius={[2, 2, 0, 0]}
            />

            {/* HRV as primary line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="hrv"
              name="HRV (ms)"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              connectNulls
            />

            {/* Resting HR as secondary line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="restingHr"
              name="RHR (bpm)"
              stroke="#EF4444"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
