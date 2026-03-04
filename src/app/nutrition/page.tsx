'use client';

import { useState } from 'react';
import Shell from '@/components/layout/Shell';
import NutritionLogger from '@/components/fitness/NutritionLogger';
import { useNutritionData } from '@/lib/use-nutrition-data';
import type { NutritionLog } from '@/lib/types';

function MealCard({
  log,
  onDelete,
}: {
  log: NutritionLog;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-white/5 bg-zinc-800/40 p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
            {log.meal_type}
          </span>
          <span className="text-[10px] text-zinc-600">
            {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <p className="text-sm text-zinc-300 mt-0.5 truncate">{log.description || 'No description'}</p>
        <div className="flex gap-3 mt-1 text-[10px] text-zinc-500 font-mono">
          {log.calories != null && <span>{log.calories} cal</span>}
          {log.protein_g != null && <span>{log.protein_g}g P</span>}
          {log.carbs_g != null && <span>{log.carbs_g}g C</span>}
          {log.fat_g != null && <span>{log.fat_g}g F</span>}
        </div>
      </div>
      <button
        onClick={() => onDelete(log.id)}
        className="text-zinc-600 hover:text-red-400 transition text-xs ml-2"
        title="Delete"
      >
        ✕
      </button>
    </div>
  );
}

export default function NutritionPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const { logs, todayTotals, getTarget, loading, addLog, deleteLog } = useNutritionData(selectedDate);

  return (
    <Shell>
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-green-400 font-semibold">Nutrition</p>
        <h1 className="mt-1 text-2xl font-black text-zinc-100 md:text-3xl">Food Log</h1>
        <div className="mt-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-green-500/50"
          />
        </div>
      </div>

      {/* Macro summary for selected date */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Cal', value: todayTotals.calories, target: getTarget('calories'), color: 'text-green-400' },
          { label: 'Protein', value: todayTotals.protein_g, target: getTarget('protein_g'), color: 'text-blue-400' },
          { label: 'Carbs', value: todayTotals.carbs_g, target: getTarget('carbs_g'), color: 'text-amber-400' },
          { label: 'Fat', value: todayTotals.fat_g, target: getTarget('fat_g'), color: 'text-red-400' },
        ].map(({ label, value, target, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-zinc-900 p-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">{label}</p>
            <p className={`text-lg font-black mt-1 ${color}`}>{Math.round(value)}</p>
            {target && (
              <p className="text-[9px] text-zinc-600 mt-0.5">/ {target}</p>
            )}
          </div>
        ))}
      </div>

      {/* Logger */}
      {selectedDate === today && (
        <div className="mb-4">
          <NutritionLogger onSave={addLog} />
        </div>
      )}

      {/* Meal list */}
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-3">
          Meals
        </p>
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-16 rounded bg-zinc-800" />
            <div className="h-16 rounded bg-zinc-800" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-zinc-600 py-4 text-center">No meals logged for this date</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <MealCard key={log.id} log={log} onDelete={deleteLog} />
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
