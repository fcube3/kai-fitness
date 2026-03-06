'use client';

import type { Session } from '@/lib/types';
import { computeACWRTimeline } from '@/lib/analytics-utils';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

export default function TrainingLoadChart({ sessions }: { sessions: Session[] }) {
  const data = computeACWRTimeline(sessions);

  if (data.length < 3) return null;

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
            Training Load
          </p>
          <p className="text-sm font-bold text-zinc-100 mt-0.5">
            Acute:Chronic Workload Ratio
          </p>
        </div>
        <div className="flex gap-2 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500/50" />
            Optimal
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500/50" />
            Caution
          </span>
        </div>
      </div>

      <div className="h-48 md:h-56 lg:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

            {/* Optimal zone fill */}
            <Area
              type="monotone"
              dataKey={() => 1.3}
              stroke="none"
              fill="#22C55E"
              fillOpacity={0.06}
              isAnimationActive={false}
            />

            {/* Zone reference lines */}
            <ReferenceLine y={1.3} stroke="#22C55E" strokeDasharray="4 4" strokeOpacity={0.4} />
            <ReferenceLine y={0.8} stroke="#22C55E" strokeDasharray="4 4" strokeOpacity={0.4} />
            <ReferenceLine y={1.5} stroke="#F59E0B" strokeDasharray="4 4" strokeOpacity={0.3} />

            <XAxis
              dataKey="week"
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 'auto']}
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : String(value ?? ''), 'ACWR']}
              labelFormatter={(label) => `Week of ${label}`}
            />

            <Line
              type="monotone"
              dataKey="acwr"
              stroke="#22C55E"
              strokeWidth={2}
              dot={(props: Record<string, unknown>) => {
                const { cx, cy, payload } = props as { cx: number; cy: number; payload: { acwr: number } };
                const acwr = payload.acwr;
                const color = acwr >= 0.8 && acwr <= 1.3 ? '#22C55E'
                  : acwr >= 0.5 && acwr <= 1.5 ? '#F59E0B'
                  : '#EF4444';
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={color}
                    stroke={color}
                    strokeWidth={1}
                  />
                );
              }}
              activeDot={{ r: 5, stroke: '#22C55E', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
