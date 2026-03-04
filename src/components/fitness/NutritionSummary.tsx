'use client';

import { useNutritionData } from '@/lib/use-nutrition-data';

function MacroBar({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number | null;
  unit: string;
  color: string;
}) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{label}</span>
        <span className="text-xs text-zinc-300 font-mono">
          {value}{unit}
          {target ? <span className="text-zinc-600"> / {target}{unit}</span> : null}
        </span>
      </div>
      {target ? (
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      ) : (
        <div className="h-1.5 rounded-full bg-zinc-800" />
      )}
    </div>
  );
}

export default function NutritionSummary() {
  const today = new Date().toISOString().slice(0, 10);
  const { todayTotals, getTarget, loading } = useNutritionData(today);

  if (loading) {
    return (
      <div className="mb-4 rounded-xl border border-white/10 bg-zinc-900 p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-20 rounded bg-zinc-800" />
          <div className="h-4 w-32 rounded bg-zinc-800" />
        </div>
      </div>
    );
  }

  // Don't render if no nutrition data and no targets set
  const hasData = todayTotals.calories > 0;
  const hasTargets = getTarget('calories') !== null;
  if (!hasData && !hasTargets) return null;

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Today</p>
          <p className="text-sm font-bold text-zinc-100 mt-0.5">Nutrition</p>
        </div>
        {todayTotals.meals.length > 0 && (
          <span className="text-[10px] text-zinc-500">
            {todayTotals.meals.length} meal{todayTotals.meals.length !== 1 ? 's' : ''} logged
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        <MacroBar label="Calories" value={todayTotals.calories} target={getTarget('calories')} unit="" color="#22C55E" />
        <MacroBar label="Protein" value={todayTotals.protein_g} target={getTarget('protein_g')} unit="g" color="#3B82F6" />
        <MacroBar label="Carbs" value={todayTotals.carbs_g} target={getTarget('carbs_g')} unit="g" color="#F59E0B" />
        <MacroBar label="Fat" value={todayTotals.fat_g} target={getTarget('fat_g')} unit="g" color="#EF4444" />
      </div>
    </div>
  );
}
