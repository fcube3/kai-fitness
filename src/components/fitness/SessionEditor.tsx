'use client';

import { useState } from 'react';
import type { Session, Exercise, WorkoutSet } from '@/lib/types';

type EditorExercise = {
  name: string;
  sets: { type: string; reps: number; weight: number }[];
  per_side: boolean;
  equipment_note: string;
};

function emptySet(): WorkoutSet {
  return { type: 'working', reps: 0, weight: 0 };
}

function emptyExercise(): EditorExercise {
  return { name: '', sets: [emptySet()], per_side: false, equipment_note: '' };
}

function sessionToEditorExercises(session: Session): EditorExercise[] {
  return session.exercises.map(ex => ({
    name: ex.name,
    sets: ex.sets.map(s => ({ ...s })),
    per_side: ex.per_side,
    equipment_note: ex.equipment_note || '',
  }));
}

export default function SessionEditor({
  session,
  mode,
  inline = false,
  onSave,
  onCancel,
}: {
  session?: Session;
  mode: 'create' | 'edit';
  inline?: boolean;
  onSave: (session: Session) => Promise<void>;
  onCancel: () => void;
}) {
  const [id, setId] = useState(session?.id || '');
  const [date, setDate] = useState(session?.date || new Date().toISOString().slice(0, 10));
  const [split, setSplit] = useState(session?.split || '');
  const [week, setWeek] = useState(session?.week?.toString() || '');
  const [exercises, setExercises] = useState<EditorExercise[]>(
    session ? sessionToEditorExercises(session) : [emptyExercise()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateExercise(idx: number, field: keyof EditorExercise, value: string | boolean | WorkoutSet[]) {
    setExercises(prev => prev.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex));
  }

  function updateSet(exIdx: number, setIdx: number, field: keyof WorkoutSet, value: string | number) {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s),
      };
    }));
  }

  function addSet(exIdx: number) {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const lastSet = ex.sets[ex.sets.length - 1];
      return { ...ex, sets: [...ex.sets, { ...emptySet(), weight: lastSet?.weight || 0, reps: lastSet?.reps || 0 }] };
    }));
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx || ex.sets.length <= 1) return ex;
      return { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) };
    }));
  }

  function addExercise() {
    setExercises(prev => [...prev, emptyExercise()]);
  }

  function removeExercise(idx: number) {
    if (exercises.length <= 1) return;
    setExercises(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!id.trim()) { setError('Session ID is required'); return; }
    if (!date) { setError('Date is required'); return; }

    const validExercises = exercises.filter(ex => ex.name.trim());
    if (validExercises.length === 0) { setError('Add at least one exercise'); return; }

    setSaving(true);
    setError('');

    const sessionData: Session = {
      id: id.trim(),
      date,
      split: split.trim() || null,
      week: week ? parseInt(week, 10) : null,
      raw: session?.raw || '',
      exercises: validExercises.map(ex => ({
        name: ex.name.trim(),
        sets: ex.sets.filter(s => s.reps > 0 || s.weight > 0),
        previous_weight: null,
        equipment_note: ex.equipment_note.trim() || null,
        per_side: ex.per_side,
      })),
    };

    try {
      await onSave(sessionData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      setSaving(false);
    }
  }

  const content = (
      <div className={inline ? '' : 'relative my-8 rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl max-w-lg w-full mx-4'}>
        {!inline && (
          <h3 className="text-sm font-bold text-zinc-100 mb-4">
            {mode === 'create' ? 'New Session' : `Edit ${session?.id}`}
          </h3>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Session metadata */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">ID</label>
            <input
              value={id}
              onChange={e => setId(e.target.value)}
              disabled={mode === 'edit'}
              placeholder="e.g. M1, B43"
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Split</label>
            <input
              value={split}
              onChange={e => setSplit(e.target.value)}
              placeholder="e.g. A, B, D+E"
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block">Week</label>
            <input
              type="number"
              value={week}
              onChange={e => setWeek(e.target.value)}
              placeholder="e.g. 42"
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
            />
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-4 mb-5">
          {exercises.map((ex, exIdx) => (
            <div key={exIdx} className="rounded-lg border border-white/5 bg-zinc-800/40 p-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={ex.name}
                  onChange={e => updateExercise(exIdx, 'name', e.target.value)}
                  placeholder="Exercise name"
                  className="flex-1 rounded border border-white/10 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200"
                />
                <label className="flex items-center gap-1 text-[10px] text-zinc-500 shrink-0">
                  <input
                    type="checkbox"
                    checked={ex.per_side}
                    onChange={e => updateExercise(exIdx, 'per_side', e.target.checked)}
                    className="rounded"
                  />
                  per side
                </label>
                {exercises.length > 1 && (
                  <button
                    onClick={() => removeExercise(exIdx)}
                    className="text-zinc-600 hover:text-red-400 text-sm transition"
                    title="Remove exercise"
                  >
                    &times;
                  </button>
                )}
              </div>

              {/* Sets */}
              <div className="space-y-1.5">
                {ex.sets.map((set, setIdx) => (
                  <div key={setIdx} className="flex items-center gap-2">
                    <select
                      value={set.type}
                      onChange={e => updateSet(exIdx, setIdx, 'type', e.target.value)}
                      className="rounded border border-white/10 bg-zinc-800 px-1.5 py-1 text-[11px] text-zinc-400 w-20"
                    >
                      <option value="working">Working</option>
                      <option value="warmup">Warmup</option>
                    </select>
                    <input
                      type="number"
                      value={set.reps || ''}
                      onChange={e => updateSet(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                      placeholder="reps"
                      className="w-16 rounded border border-white/10 bg-zinc-800 px-2 py-1 text-sm text-zinc-200 text-center"
                    />
                    <span className="text-zinc-600 text-xs">@</span>
                    <input
                      type="number"
                      value={set.weight || ''}
                      onChange={e => updateSet(exIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)}
                      placeholder="kg"
                      className="w-20 rounded border border-white/10 bg-zinc-800 px-2 py-1 text-sm text-zinc-200 text-center"
                    />
                    <span className="text-[11px] text-zinc-600">kg</span>
                    {ex.sets.length > 1 && (
                      <button
                        onClick={() => removeSet(exIdx, setIdx)}
                        className="text-zinc-600 hover:text-red-400 text-xs transition"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => addSet(exIdx)}
                className="mt-2 text-[10px] text-green-400 hover:text-green-300 transition"
              >
                + Add set
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addExercise}
          className="mb-5 w-full rounded-lg border border-dashed border-white/10 py-2 text-xs text-zinc-500 hover:text-green-400 hover:border-green-500/30 transition"
        >
          + Add exercise
        </button>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-green-500/20 border border-green-500/30 px-4 py-2 text-sm text-green-400 hover:bg-green-500/30 transition disabled:opacity-50"
          >
            {saving ? 'Saving\u2026' : mode === 'create' ? 'Create Session' : 'Save Changes'}
          </button>
        </div>
      </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      {content}
    </div>
  );
}
