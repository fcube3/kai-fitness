'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { LineTooltip } from './CustomTooltips';

const GREEN = '#22C55E';

export default function WeightProgression({
  exercises,
  selectedExercise,
  onSelectExercise,
  progressionData,
  prWeight,
}: {
  exercises: string[];
  selectedExercise: string;
  onSelectExercise: (name: string) => void;
  progressionData: { date: string; weight: number }[];
  prWeight: number | null;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900 p-5 mb-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-bold text-zinc-100">Weight Progression</h2>
        {prWeight !== null && (
          <span className="text-xs font-semibold text-green-400">PR: {prWeight}kg</span>
        )}
      </div>
      <select
        value={selectedExercise}
        onChange={e => onSelectExercise(e.target.value)}
        className="mb-4 w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-green-500/50"
      >
        {exercises.map(e => <option key={e} value={e}>{e}</option>)}
      </select>
      {progressionData.length > 1 ? (
        <div className="h-48 md:h-64 lg:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip content={<LineTooltip />} />
              {prWeight !== null && (
                <ReferenceLine y={prWeight} stroke={GREEN} strokeDasharray="4 4" strokeWidth={1} strokeOpacity={0.5} />
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
        <div className="h-48 md:h-64 lg:h-72 flex items-center justify-center">
          <p className="text-sm text-zinc-600">Not enough data yet</p>
        </div>
      )}
    </section>
  );
}
