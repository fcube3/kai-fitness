import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAuth } from '@/lib/api-auth';
import type { Exercise } from '@/lib/types';

/** POST /api/fitness/sessions — create a new manual session */
export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const session = await request.json();

    if (!session.id || !session.date) {
      return NextResponse.json({ error: 'id and date are required' }, { status: 400 });
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('fitness_sessions')
      .select('id')
      .eq('id', session.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: `Session ${session.id} already exists` }, { status: 409 });
    }

    // Compute aggregates
    const exercises = session.exercises || [];
    let totalVolume = 0;
    for (const ex of exercises) {
      for (const set of ex.sets || []) {
        totalVolume += (set.reps || 0) * (set.weight || 0);
      }
    }

    // Insert session
    const { error: sessError } = await supabase
      .from('fitness_sessions')
      .insert({
        id: session.id,
        date: session.date,
        split: session.split || null,
        week: session.week || null,
        raw_note: session.raw || '',
        exercise_count: exercises.length,
        total_volume: totalVolume,
      });

    if (sessError) {
      return NextResponse.json({ error: sessError.message }, { status: 500 });
    }

    // Insert exercises
    if (exercises.length > 0) {
      const rows = buildExerciseRows(session.id, session.date, exercises);
      const { error: exError } = await supabase.from('fitness_exercises').insert(rows);
      if (exError) {
        console.error('Exercise insert error:', exError);
      }
    }

    return NextResponse.json({ ok: true, id: session.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildExerciseRows(sessionId: string, date: string, exercises: Exercise[]) {
  return exercises.map((ex) => {
    const allSets = ex.sets || [];
    const workingSets = allSets.filter((s) => s.type === 'working');
    const totalReps = allSets.reduce((sum, s) => sum + (s.reps || 0), 0);
    const topWeight = allSets.length > 0 ? Math.max(...allSets.map((s) => s.weight || 0)) : 0;
    const repsStr = allSets.map((s) => s.reps).join('/');
    const weightDetailStr = allSets.map((s) => s.weight).join('/');
    const uniqueWeights = new Set(allSets.map((s) => s.weight));
    const volume = allSets.reduce((sum, s) => sum + (s.reps || 0) * (s.weight || 0), 0);

    return {
      session_id: sessionId,
      date,
      name: ex.name,
      set_type: workingSets.length > 0 && workingSets.length < allSets.length ? 'mixed' : (workingSets.length > 0 ? 'working' : 'warmup'),
      sets: allSets.length,
      reps: repsStr,
      total_reps: totalReps,
      weight: topWeight,
      weight_detail: uniqueWeights.size > 1 ? weightDetailStr : null,
      previous_weight: ex.previous_weight ?? null,
      weight_delta: ex.previous_weight != null ? topWeight - ex.previous_weight : null,
      volume,
      per_side: ex.per_side ?? false,
      equipment_note: ex.equipment_note ?? null,
    };
  });
}
