'use client';

import { useEffect, useState, useCallback } from 'react';
import type { NutritionLog, NutritionTarget, DailyNutrition } from './types';

export function useNutritionData(date?: string) {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [targets, setTargets] = useState<NutritionTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (date) params.set('date', date);

    Promise.all([
      fetch(`/api/fitness/nutrition${params.toString() ? `?${params}` : ''}`, { credentials: 'include' })
        .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
      fetch('/api/fitness/nutrition/targets', { credentials: 'include' })
        .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); }),
    ])
      .then(([logsData, targetsData]) => {
        setLogs(logsData.logs || []);
        setTargets(targetsData.targets || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getTarget = (type: string): number | null => {
    const t = targets.find(t => t.target_type === type);
    return t ? t.value : null;
  };

  const todayTotals: DailyNutrition = {
    date: date || new Date().toISOString().slice(0, 10),
    calories: logs.reduce((sum, l) => sum + (l.calories || 0), 0),
    protein_g: logs.reduce((sum, l) => sum + (l.protein_g || 0), 0),
    carbs_g: logs.reduce((sum, l) => sum + (l.carbs_g || 0), 0),
    fat_g: logs.reduce((sum, l) => sum + (l.fat_g || 0), 0),
    meals: logs,
  };

  const addLog = async (log: Omit<NutritionLog, 'id' | 'created_at'>) => {
    const res = await fetch('/api/fitness/nutrition', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    if (!res.ok) throw new Error('Failed to save');
    fetchData();
  };

  const deleteLog = async (id: number) => {
    const res = await fetch(`/api/fitness/nutrition/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete');
    fetchData();
  };

  return { logs, targets, loading, error, refetch: fetchData, getTarget, todayTotals, addLog, deleteLog };
}
