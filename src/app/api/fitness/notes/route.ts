import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAuth } from '@/lib/api-auth';

/** GET /api/fitness/notes?exercise=Name — list notes for an exercise */
export async function GET(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const exerciseName = request.nextUrl.searchParams.get('exercise');
  if (!exerciseName) {
    return NextResponse.json({ error: 'exercise query param required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('exercise_notes')
    .select('*')
    .eq('exercise_name', exerciseName)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

/** POST /api/fitness/notes — create a note */
export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    if (!body.exercise_name || !body.note) {
      return NextResponse.json({ error: 'exercise_name and note are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('exercise_notes')
      .insert({
        exercise_name: body.exercise_name,
        note: body.note,
        tags: body.tags || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
