'use client';

import { useState, useEffect } from 'react';

type Goal = {
  exercise_name: string;
  target_weight: number | null;
  target_reps: number | null;
  target_date: string | null;
  notes: string | null;
};

export default function GoalEditor({
  exerciseName,
  currentPR,
}: {
  exerciseName: string;
  currentPR: number;
}) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [targetWeight, setTargetWeight] = useState('');
  const [targetReps, setTargetReps] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch(`/api/fitness/goals/${encodeURIComponent(exerciseName)}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data && data.exercise_name) {
          setGoal(data);
          setTargetWeight(data.target_weight?.toString() || '');
          setTargetReps(data.target_reps?.toString() || '');
          setTargetDate(data.target_date || '');
          setNotes(data.notes || '');
        }
      })
      .catch((e: Error) => console.error('Failed to load goal:', e.message))
      .finally(() => setLoading(false));
  }, [exerciseName]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/fitness/goals', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_name: exerciseName,
          target_weight: targetWeight ? parseFloat(targetWeight) : null,
          target_reps: targetReps ? parseInt(targetReps, 10) : null,
          target_date: targetDate || null,
          notes: notes.trim() || null,
        }),
      });
      if (res.ok) {
        setGoal({
          exercise_name: exerciseName,
          target_weight: targetWeight ? parseFloat(targetWeight) : null,
          target_reps: targetReps ? parseInt(targetReps, 10) : null,
          target_date: targetDate || null,
          notes: notes.trim() || null,
        });
        setEditing(false);
      }
    } catch {}
    setSaving(false);
  }

  async function handleDelete() {
    await fetch(`/api/fitness/goals/${encodeURIComponent(exerciseName)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setGoal(null);
    setTargetWeight('');
    setTargetReps('');
    setTargetDate('');
    setNotes('');
    setEditing(false);
  }

  if (loading) return null;

  // Display mode
  if (goal && !editing) {
    const progress = goal.target_weight && currentPR > 0
      ? Math.min(100, Math.round((currentPR / goal.target_weight) * 100))
      : null;

    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-zinc-900/80 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-zinc-200">Goal</h2>
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] text-zinc-500 hover:text-green-400 transition"
          >
            Edit
          </button>
        </div>

        <div className="flex items-baseline gap-3">
          {goal.target_weight && (
            <span className="text-2xl font-bold text-green-400 tabular-nums">
              {goal.target_weight}<span className="text-xs font-normal text-zinc-500">kg</span>
            </span>
          )}
          {goal.target_reps && (
            <span className="text-sm text-zinc-400">× {goal.target_reps} reps</span>
          )}
          {goal.target_date && (
            <span className="text-xs text-zinc-500">by {goal.target_date}</span>
          )}
        </div>

        {progress !== null && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-zinc-500">Progress</span>
              <span className={progress >= 100 ? 'text-green-400 font-semibold' : 'text-zinc-400'}>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500/70 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {goal.notes && (
          <p className="mt-2 text-xs text-zinc-500">{goal.notes}</p>
        )}
      </div>
    );
  }

  // Edit/create mode
  if (editing || !goal) {
    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-zinc-900/80 p-4">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">
          {goal ? 'Edit Goal' : 'Set a Goal'}
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Target Weight (kg)</label>
            <input
              type="number"
              value={targetWeight}
              onChange={e => setTargetWeight(e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Target Reps</label>
            <input
              type="number"
              value={targetReps}
              onChange={e => setTargetReps(e.target.value)}
              placeholder="e.g. 6"
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Notes</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          {goal && (
            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition"
            >
              Remove
            </button>
          )}
          {editing && (
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || (!targetWeight && !targetReps)}
            className="rounded-lg bg-green-500/20 border border-green-500/30 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/30 transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Goal'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
