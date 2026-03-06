'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseWorkoutNote } from '@/lib/fitness-parser';
import type { Session } from '@/lib/types';
import Shell from '@/components/layout/Shell';
import SessionEditor from '@/components/fitness/SessionEditor';

export default function NewSessionPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [parsedSession, setParsedSession] = useState<Session | undefined>();
  const [parseKey, setParseKey] = useState(0);
  const [showPaste, setShowPaste] = useState(true);
  const [parseError, setParseError] = useState('');

  function handleParse() {
    if (!rawText.trim()) return;
    setParseError('');
    const result = parseWorkoutNote(rawText.trim());
    // Convert parser output to Session type
    const session: Session = {
      id: result.id,
      date: result.date,
      split: result.split,
      week: result.week,
      raw: result.raw,
      exercises: result.exercises,
    };
    if (result.parse_error) {
      session.parse_error = result.parse_error;
      setParseError(result.parse_error);
    }
    setParsedSession(session);
    setParseKey(k => k + 1);
    setShowPaste(false);
  }

  function handleClear() {
    setRawText('');
    setParsedSession(undefined);
    setParseKey(k => k + 1);
    setShowPaste(true);
    setParseError('');
  }

  async function handleSave(session: Session) {
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

  return (
    <Shell>
      <div className="mb-6">
        <a href="/sessions" className="text-xs text-green-400 hover:underline">&larr; Sessions</a>
        <h1 className="mt-2 text-2xl font-bold text-zinc-100">New Session</h1>
      </div>

      {/* Paste raw notes section */}
      <div className="mb-6">
        <button
          onClick={() => setShowPaste(!showPaste)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition"
        >
          <span className="text-xs">{showPaste ? '\u25BC' : '\u25B6'}</span>
          Paste raw notes
        </button>

        {showPaste && (
          <div className="mt-2 space-y-2">
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder={`Workout B43, 03/04\nHack Squat, warmup 8@57kg, working 6/6/6@97kg\nBulgarian squat, 10/10/10@12kg`}
              rows={6}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 font-mono placeholder:text-zinc-600 resize-y"
            />
            <div className="flex gap-2">
              <button
                onClick={handleParse}
                disabled={!rawText.trim()}
                className="rounded-lg bg-green-500/20 border border-green-500/30 px-4 py-2 text-sm text-green-400 hover:bg-green-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Parse
              </button>
              {parsedSession && (
                <button
                  onClick={handleClear}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {parseError && (
          <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-400">
            ⚠ {parseError}
          </div>
        )}
      </div>

      {/* Session editor form */}
      <SessionEditor
        key={parseKey}
        session={parsedSession}
        mode="create"
        inline
        onSave={handleSave}
        onCancel={() => router.push('/sessions')}
      />
    </Shell>
  );
}
