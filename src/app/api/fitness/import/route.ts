import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { WorkoutSession } from '@/lib/fitness-parser';

export async function POST(request: NextRequest) {
  const expectedPassword = process.env.FITNESS_PASSWORD?.trim();
  if (!expectedPassword) {
    return NextResponse.json({ error: 'FITNESS_PASSWORD not configured' }, { status: 503 });
  }

  const cookieValue = request.cookies.get('fitness_auth')?.value?.trim();
  const authPassword =
    request.headers.get('x-fitness-password')?.trim() ||
    request.headers.get('authorization')?.replace('Bearer ', '').trim();

  if (cookieValue !== expectedPassword && authPassword !== expectedPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessions: WorkoutSession[] = await request.json();

    if (!Array.isArray(sessions)) {
      return NextResponse.json({ error: 'Expected array of sessions' }, { status: 400 });
    }

    let added = 0;
    let updated = 0;

    for (const session of sessions) {
      // Compute aggregates
      const exerciseCount = session.exercises.length;
      let totalVolume = 0;
      for (const ex of session.exercises) {
        for (const set of ex.sets) {
          totalVolume += set.reps * set.weight;
        }
      }

      // Upsert session
      const { data: existing } = await supabase
        .from('fitness_sessions')
        .select('id')
        .eq('id', session.id)
        .single();

      if (existing) {
        updated++;
      } else {
        added++;
      }

      const { error: sessionError } = await supabase
        .from('fitness_sessions')
        .upsert({
          id: session.id,
          date: session.date,
          split: session.split,
          week: session.week,
          raw_note: session.raw,
          exercise_count: exerciseCount,
          total_volume: totalVolume,
        }, { onConflict: 'id' });

      if (sessionError) {
        console.error('Session upsert error:', sessionError);
        continue;
      }

      // Delete existing exercises for this session, then re-insert
      await supabase
        .from('fitness_exercises')
        .delete()
        .eq('session_id', session.id);

      if (session.exercises.length > 0) {
        const exerciseRows = session.exercises.map((ex) => {
          const workingSets = ex.sets.filter(s => s.type === 'working');
          const allSets = ex.sets;
          const totalReps = allSets.reduce((sum, s) => sum + s.reps, 0);
          const topWeight = allSets.length > 0 ? Math.max(...allSets.map(s => s.weight)) : 0;
          const repsStr = allSets.map(s => s.reps).join('/');
          const weightDetailStr = allSets.map(s => s.weight).join('/');
          const uniqueWeights = new Set(allSets.map(s => s.weight));
          const volume = allSets.reduce((sum, s) => sum + s.reps * s.weight, 0);

          return {
            session_id: session.id,
            date: session.date,
            name: ex.name,
            set_type: workingSets.length > 0 && workingSets.length < allSets.length ? 'mixed' : (workingSets.length > 0 ? 'working' : 'warmup'),
            sets: allSets.length,
            reps: repsStr,
            total_reps: totalReps,
            weight: topWeight,
            weight_detail: uniqueWeights.size > 1 ? weightDetailStr : null,
            previous_weight: ex.previous_weight,
            weight_delta: ex.previous_weight != null ? topWeight - ex.previous_weight : null,
            volume,
            per_side: ex.per_side,
            equipment_note: ex.equipment_note,
          };
        });

        const { error: exError } = await supabase
          .from('fitness_exercises')
          .insert(exerciseRows);

        if (exError) {
          console.error('Exercise insert error:', exError);
        }
      }
    }

    // Get totals
    const { count: totalSessions } = await supabase
      .from('fitness_sessions')
      .select('*', { count: 'exact', head: true });

    const { data: exNames } = await supabase
      .from('fitness_exercises')
      .select('name');

    const uniqueExercises = new Set(exNames?.map(e => e.name) || []);

    return NextResponse.json({
      ok: true,
      added,
      updated,
      totalSessions: totalSessions || 0,
      totalExercises: uniqueExercises.size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
