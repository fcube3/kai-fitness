import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
  const expectedPassword = process.env.FITNESS_PASSWORD?.trim();
  if (!expectedPassword) {
    return NextResponse.json({ error: 'FITNESS_PASSWORD not configured' }, { status: 503 });
  }

  const cookieValue = request.cookies.get('fitness_auth')?.value?.trim();
  const headerPassword =
    request.headers.get('x-fitness-password')?.trim() ||
    request.headers.get('authorization')?.replace('Bearer ', '').trim();

  if (cookieValue !== expectedPassword && headerPassword !== expectedPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch sessions
  const { data: sessions, error: sessErr } = await supabase
    .from('fitness_sessions')
    .select('*')
    .order('date', { ascending: true });

  if (sessErr) {
    return NextResponse.json({ error: sessErr.message }, { status: 500 });
  }

  // Fetch all exercises
  const { data: allExercises, error: exErr } = await supabase
    .from('fitness_exercises')
    .select('*')
    .order('id', { ascending: true });

  if (exErr) {
    return NextResponse.json({ error: exErr.message }, { status: 500 });
  }

  // Group exercises by session
  const exercisesBySession = new Map<string, typeof allExercises>();
  for (const ex of allExercises || []) {
    const list = exercisesBySession.get(ex.session_id) || [];
    list.push(ex);
    exercisesBySession.set(ex.session_id, list);
  }

  // Reconstruct WorkoutSession shape for frontend compatibility
  const reconstructed = (sessions || []).map((s) => {
    const exRows = exercisesBySession.get(s.id) || [];
    return {
      id: s.id,
      date: s.date,
      split: s.split,
      week: s.week,
      raw: s.raw_note,
      exercises: exRows.map((ex) => ({
        name: ex.name,
        sets: parseExerciseSets(ex),
        previous_weight: ex.previous_weight,
        equipment_note: ex.equipment_note,
        per_side: ex.per_side,
      })),
    };
  });

  // Unique exercise names
  const exerciseNames = [...new Set((allExercises || []).map(e => e.name))];

  const meta = {
    sessionCount: sessions?.length || 0,
    exerciseCount: exerciseNames.length,
  };

  return NextResponse.json({ sessions: reconstructed, exercises: exerciseNames, meta });
  } catch (err: unknown) {
    console.error('GET /api/fitness/data error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Reconstruct WorkoutSet[] from DB row */
function parseExerciseSets(ex: {
  reps: string | null;
  weight: number | null;
  weight_detail: string | null;
  set_type: string | null;
}) {
  if (!ex.reps) return [];

  const repParts = ex.reps.split('/').map(Number);
  const weightParts = ex.weight_detail
    ? ex.weight_detail.split('/').map(Number)
    : repParts.map(() => ex.weight || 0);

  return repParts.map((reps, i) => ({
    type: ex.set_type === 'warmup' ? 'warmup' as const : 'working' as const,
    reps,
    weight: weightParts[i] ?? weightParts[weightParts.length - 1] ?? 0,
  }));
}
