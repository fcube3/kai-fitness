'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Session, Meta } from './types';

export function useFitnessData() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [exercises, setExercises] = useState<string[]>([]);
  const [meta, setMeta] = useState<Meta>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/fitness/data', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(d => {
        setSessions(d.sessions || []);
        setExercises(d.exercises || []);
        setMeta(d.meta || {});
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { sessions, exercises, meta, loading, error, refetch: fetchData };
}
