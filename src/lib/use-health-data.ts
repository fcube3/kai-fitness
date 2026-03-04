'use client';

import { useEffect, useState, useCallback } from 'react';
import type { HealthMetric } from './types';

export function useHealthData(from?: string, to?: string) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();

    fetch(`/api/fitness/health${qs ? `?${qs}` : ''}`, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(d => setMetrics(d.metrics || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /** Group metrics by type for easier consumption */
  const byType = (type: string) =>
    metrics
      .filter(m => m.metric_type === type)
      .sort((a, b) => a.date.localeCompare(b.date));

  /** Get latest value for a metric type */
  const latest = (type: string): HealthMetric | null => {
    const sorted = byType(type);
    return sorted.length > 0 ? sorted[sorted.length - 1] : null;
  };

  return { metrics, loading, error, refetch: fetchData, byType, latest };
}
