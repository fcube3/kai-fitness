'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from '@/lib/types';
import Shell from '@/components/layout/Shell';
import SessionEditor from '@/components/fitness/SessionEditor';

type InputMode = 'form' | 'text';

export default function NewSessionPage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>('form');
  const [textInput, setTextInput] = useState('');
  const [parseError, setParseError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleFormSave(session: Session) {
    const res = await fetch('/api/fitness/sessions', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Create failed');
    }
    router.push('/sessions');
  }

  async function handleTextSubmit() {
    if (!textInput.trim()) { setParseError('Paste your workout note text'); return; }

    setSaving(true);
    setParseError('');

    try {
      // Send as single-session import using the existing import endpoint
      const res = await fetch('/api/fitness/import', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-fitness-password': '', // Will use cookie auth
        },
        body: JSON.stringify([{ raw: textInput }]),
      });

      // The import endpoint expects parsed sessions, so we'll parse client-side instead
      // Use the parser format: first line is title, rest are exercises
      const lines = textInput.trim().split('\n').filter(l => l.trim());
      if (lines.length === 0) { setParseError('Empty input'); setSaving(false); return; }

      const titleLine = lines[0].trim();

      // Parse title: "Workout B42, 02/24"
      const titleMatch = titleLine.match(/^Workout\s+(\S+),\s*(\d{1,2})\/(\d{1,2})$/i);
      let id: string;
      let date: string;
      let split: string | null = null;
      let week: number | null = null;

      if (titleMatch) {
        id = titleMatch[1];
        const month = titleMatch[2].padStart(2, '0');
        const day = titleMatch[3].padStart(2, '0');
        date = `${new Date().getFullYear()}-${month}-${day}`;

        const idMatch = id.match(/^([A-F](?:\+[A-F])?)(\d+)$/i);
        if (idMatch) {
          split = idMatch[1].toUpperCase();
          week = parseInt(idMatch[2], 10);
        }
      } else {
        // Fallback: use sanitized title as ID, today's date
        id = titleLine.replace(/[^a-zA-Z0-9+]/g, '_').slice(0, 20) || `M${Date.now()}`;
        date = new Date().toISOString().slice(0, 10);
      }

      // Parse exercise lines
      const exercises: Session['exercises'] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        const ex = parseExerciseLine(line);
        if (ex) exercises.push(ex);
      }

      if (exercises.length === 0) {
        setParseError('Could not parse any exercises. Check the format.');
        setSaving(false);
        return;
      }

      const session: Session = {
        id,
        date,
        split,
        week,
        raw: textInput,
        exercises,
      };

      const createRes = await fetch('/api/fitness/sessions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(data.error || 'Create failed');
      }

      router.push('/sessions');
    } catch (e: any) {
      setParseError(e.message || 'Failed to create session');
      setSaving(false);
    }
  }

  return (
    <Shell>
      <div className="mb-6">
        <a href="/sessions" className="text-xs text-green-400 hover:underline">← Sessions</a>
        <h1 className="mt-2 text-2xl font-bold text-zinc-100">New Session</h1>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setMode('form')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            mode === 'form'
              ? 'bg-green-500/15 text-green-400 border border-green-500/25'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
          }`}
        >
          Structured Form
        </button>
        <button
          onClick={() => setMode('text')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            mode === 'text'
              ? 'bg-green-500/15 text-green-400 border border-green-500/25'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
          }`}
        >
          Paste Text
        </button>
      </div>

      {mode === 'form' ? (
        <SessionEditor
          mode="create"
          inline
          onSave={handleFormSave}
          onCancel={() => router.push('/sessions')}
        />
      ) : (
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
          <p className="text-xs text-zinc-500 mb-3">
            Paste in Apple Notes format. First line: title (e.g. &quot;Workout B43, 03/04&quot;), followed by exercises.
          </p>

          {parseError && (
            <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
              {parseError}
            </div>
          )}

          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder={`Workout B43, 03/04\nHack Squat, warmup 8@57kg, working 6/6/6@97kg\nBulgarian squat, 10/10/10@12kg`}
            rows={12}
            className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 font-mono placeholder:text-zinc-600 resize-y"
          />

          <div className="mt-4 flex gap-3 justify-end">
            <a
              href="/sessions"
              className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition"
            >
              Cancel
            </a>
            <button
              onClick={handleTextSubmit}
              disabled={saving}
              className="rounded-lg bg-green-500/20 border border-green-500/30 px-4 py-2 text-sm text-green-400 hover:bg-green-500/30 transition disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Session'}
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}

/** Lightweight client-side exercise line parser */
function parseExerciseLine(line: string): Session['exercises'][number] | null {
  // Find first comma not inside parentheses
  let depth = 0;
  let splitIdx = -1;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '(') depth++;
    else if (line[i] === ')') depth--;
    else if (line[i] === ',' && depth === 0) { splitIdx = i; break; }
  }
  if (splitIdx < 0) return null;

  let name = line.slice(0, splitIdx).trim();
  const rest = line.slice(splitIdx + 1).trim();

  // Equipment note
  let equipment_note: string | null = null;
  const equipMatch = name.match(/\(([^)]+)\)\s*$/);
  if (equipMatch) {
    equipment_note = equipMatch[1];
    name = name.slice(0, equipMatch.index).trim();
  }

  // Previous weight
  let previous_weight: number | null = null;
  const wasMatch = rest.match(/\(was\s+(\d+(?:\.\d+)?)kg\)/i);
  if (wasMatch) previous_weight = parseFloat(wasMatch[1]);

  // Per side
  const per_side = /\bper\s*$/i.test(rest);

  // Parse sets
  const sets: { type: string; reps: number; weight: number }[] = [];
  const warmupMatch = rest.match(/warmup\s+([\d/]+)@([\d./]+)kg/i);
  const workingMatch = rest.match(/working\s+([\d/]+)@([\d./]+)kg/i);

  if (warmupMatch || workingMatch) {
    if (warmupMatch) {
      const reps = warmupMatch[1].split('/').map(Number);
      const weights = warmupMatch[2].split('/').map(Number);
      for (let i = 0; i < reps.length; i++) {
        const w = weights.length === 1 ? weights[0] : weights[i] || weights[weights.length - 1];
        if (reps[i] > 0) sets.push({ type: 'warmup', reps: reps[i], weight: w });
      }
    }
    if (workingMatch) {
      const reps = workingMatch[1].split('/').map(Number);
      const weights = workingMatch[2].split('/').map(Number);
      for (let i = 0; i < reps.length; i++) {
        const w = weights.length === 1 ? weights[0] : weights[i] || weights[weights.length - 1];
        if (reps[i] > 0) sets.push({ type: 'working', reps: reps[i], weight: w });
      }
    }
  } else {
    const simpleMatch = rest.match(/([\d/]+)@([\d./]+)kg/);
    if (simpleMatch) {
      const reps = simpleMatch[1].split('/').map(Number);
      const weights = simpleMatch[2].split('/').map(Number);
      for (let i = 0; i < reps.length; i++) {
        const w = weights.length === 1 ? weights[0] : weights[i] || weights[weights.length - 1];
        if (reps[i] > 0) sets.push({ type: 'working', reps: reps[i], weight: w });
      }
    }
  }

  if (!name || sets.length === 0) return null;

  return { name, sets, previous_weight, equipment_note, per_side };
}
