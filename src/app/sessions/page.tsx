'use client';

import { useState } from 'react';
import { useFitnessData } from '@/lib/use-fitness-data';
import type { Session } from '@/lib/types';
import Shell from '@/components/layout/Shell';
import { SessionsSkeleton } from '@/components/ui/Skeleton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SessionEditor from '@/components/fitness/SessionEditor';

export default function SessionsPage() {
  const { sessions, loading, refetch } = useFitnessData();
  const [search, setSearch] = useState('');
  const [splitFilter, setSplitFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const [editTarget, setEditTarget] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (loading) return (
    <Shell>
      <SessionsSkeleton />
    </Shell>
  );

  const splits = Array.from(new Set(sessions.map(s => s.split).filter(Boolean))) as string[];

  const filtered = [...sessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(s => {
      if (splitFilter && s.split !== splitFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.id.toLowerCase().includes(q) ||
          s.date.includes(q) ||
          s.exercises.some(e => e.name.toLowerCase().includes(q));
      }
      return true;
    });

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/fitness/sessions/${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setDeleteTarget(null);
      setExpanded(null);
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  }

  async function handleEditSave(session: Session) {
    const res = await fetch(`/api/fitness/sessions/${encodeURIComponent(session.id)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Update failed');
    }
    setEditTarget(null);
    refetch();
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-green-400">Private · Fitness</p>
          <h1 className="mt-1 text-xl font-bold md:text-2xl">All Sessions</h1>
        </div>
        <a
          href="/sessions/new"
          className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs text-green-300 hover:bg-green-500/20 transition"
        >
          + New Session
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          placeholder="Search exercise, id, date…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
        />
        <select
          value={splitFilter} onChange={e => setSplitFilter(e.target.value)}
          className="rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
        >
          <option value="">All Splits</option>
          {splits.map(s => <option key={s} value={s}>Split {s}</option>)}
        </select>
      </div>

      <p className="mt-3 text-xs text-zinc-500">{filtered.length} sessions</p>

      <div className="mt-4 space-y-2">
        {filtered.map(s => (
          <div key={s.id} className="rounded-lg border border-white/5 bg-zinc-900/60">
            <button
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-zinc-100">{s.id}</span>
                <span className="text-sm text-zinc-500">{s.date}</span>
                {s.split && <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-300">Split {s.split}</span>}
                {s.parse_error && <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300">⚠ parse issue</span>}
              </div>
              <span className="text-xs text-zinc-500">{s.exercises.length} ex</span>
            </button>
            {expanded === s.id && (
              <div className="border-t border-white/5 px-4 py-3 space-y-1">
                {s.exercises.map((ex, i) => (
                  <div key={i} className="flex flex-wrap items-baseline gap-2">
                    <a href={`/exercises/${encodeURIComponent(ex.name)}`} className="text-sm font-medium text-zinc-200 hover:text-green-400">{ex.name}</a>
                    <span className="text-xs text-zinc-500">
                      {ex.sets.map(set => `${set.reps}@${set.weight}kg`).join(' / ')}
                      {ex.per_side && ' per side'}
                      {ex.equipment_note && ` (${ex.equipment_note})`}
                      {ex.previous_weight != null && ` (was ${ex.previous_weight}kg)`}
                    </span>
                  </div>
                ))}
                {s.parse_error && <p className="text-xs text-amber-400">{s.parse_error}</p>}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-zinc-500">Raw note</summary>
                  <pre className="mt-1 whitespace-pre-wrap rounded bg-zinc-950 p-2 text-xs text-zinc-400">{s.raw}</pre>
                </details>

                {/* Edit / Delete actions */}
                <div className="mt-3 flex gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => setEditTarget(s)}
                    className="rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(s)}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Session"
        message={`Are you sure you want to delete session ${deleteTarget?.id}? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Edit modal */}
      {editTarget && (
        <SessionEditor
          session={editTarget}
          mode="edit"
          onSave={handleEditSave}
          onCancel={() => setEditTarget(null)}
        />
      )}
    </Shell>
  );
}
