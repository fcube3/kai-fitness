import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAuth } from '@/lib/api-auth';

/** GET /api/fitness/goals — list all goals */
export async function GET(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const { data, error } = await supabase
    .from('exercise_goals')
    .select('*')
    .order('exercise_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

/** POST /api/fitness/goals — create or update a goal */
export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    if (!body.exercise_name) {
      return NextResponse.json({ error: 'exercise_name is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('exercise_goals')
      .upsert({
        exercise_name: body.exercise_name,
        target_weight: body.target_weight ?? null,
        target_reps: body.target_reps ?? null,
        target_date: body.target_date ?? null,
        notes: body.notes ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'exercise_name' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
