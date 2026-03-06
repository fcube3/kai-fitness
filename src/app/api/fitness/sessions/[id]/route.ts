import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAuth } from '@/lib/api-auth';
import type { Exercise } from '@/lib/types';

/** PUT /api/fitness/sessions/[id] — update a session */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const session = await request.json();

    // Verify session exists
    const { data: existing } = await supabase
      .from('fitness_sessions')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const exercises = session.exercises || [];
    let totalVolume = 0;
    for (const ex of exercises) {
      for (const set of ex.sets || []) {
        totalVolume += (set.reps || 0) * (set.weight || 0);
      }
    }

    // Update session
    const { error: sessError } = await supabase
      .from('fitness_sessions')
      .update({
        date: session.date,
        split: session.split || null,
        week: session.week || null,
        raw_note: session.raw || '',
        exercise_count: exercises.length,
        total_volume: totalVolume,
      })
      .eq('id', id);

    if (sessError) {
      return NextResponse.json({ error: sessError.message }, { status: 500 });
    }

    // Replace exercises: delete old, insert new
    await supabase.from('fitness_exercises').delete().eq('session_id', id);

    if (exercises.length > 0) {
      const rows = buildExerciseRows(id, session.date, exercises);
      const { error: exError } = await supabase.from('fitness_exercises').insert(rows);
      if (exError) {
        console.error('Exercise insert error:', exError);
        return NextResponse.json({ error: `Failed to save exercises: ${exError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/fitness/sessions/[id] — delete a session */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    // Delete exercises first (FK)
    await supabase.from('fitness_exercises').delete().eq('session_id', id);

    // Delete session
    const { error } = await supabase
      .from('fitness_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
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
