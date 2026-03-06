'use client';

import { useState, useEffect } from 'react';

type Note = {
  id: number;
  exercise_name: string;
  note: string;
  tags: string[] | null;
  created_at: string;
};

const TAG_OPTIONS = ['form cue', 'pain', 'equipment', 'progression', 'variation'];

export default function ExerciseNotes({ exerciseName }: { exerciseName: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/fitness/notes?exercise=${encodeURIComponent(exerciseName)}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotes(data); })
      .catch((e: Error) => console.error('Failed to load notes:', e.message))
      .finally(() => setLoading(false));
  }, [exerciseName]);

  async function handleAdd() {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/fitness/notes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_name: exerciseName,
          note: newNote.trim(),
          tags: selectedTags.length > 0 ? selectedTags : null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setNotes(prev => [created, ...prev]);
        setNewNote('');
        setSelectedTags([]);
        setShowForm(false);
      }
    } catch {}
    setSaving(false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/fitness/notes/${id}`, { method: 'DELETE', credentials: 'include' });
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-white/10 bg-zinc-900/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-200">Notes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[10px] text-green-400 hover:text-green-300 transition"
        >
          {showForm ? 'Cancel' : '+ Add note'}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-white/5 bg-zinc-800/40 p-3">
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Write a note…"
            rows={2}
            className="w-full rounded border border-white/10 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 resize-y placeholder:text-zinc-600"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {TAG_OPTIONS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-2 py-0.5 text-[10px] border transition ${
                  selectedTags.includes(tag)
                    ? 'bg-green-500/15 border-green-500/25 text-green-400'
                    : 'border-white/10 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAdd}
              disabled={saving || !newNote.trim()}
              className="rounded-lg bg-green-500/20 border border-green-500/30 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/30 transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add Note'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-zinc-600">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-zinc-600">No notes yet</p>
      ) : (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="rounded-lg bg-zinc-800/40 px-3 py-2 group">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-zinc-300">{n.note}</p>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-zinc-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition shrink-0"
                >
                  ×
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-zinc-600">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
                {n.tags?.map(tag => (
                  <span key={tag} className="rounded-full bg-zinc-700/50 px-1.5 py-0.5 text-[9px] text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
