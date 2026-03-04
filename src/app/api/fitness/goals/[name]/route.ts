import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAuth } from '@/lib/api-auth';

/** GET /api/fitness/goals/[name] */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const { name } = await params;
  const exerciseName = decodeURIComponent(name);

  const { data, error } = await supabase
    .from('exercise_goals')
    .select('*')
    .eq('exercise_name', exerciseName)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || null);
}

/** DELETE /api/fitness/goals/[name] */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const { name } = await params;
  const exerciseName = decodeURIComponent(name);

  const { error } = await supabase
    .from('exercise_goals')
    .delete()
    .eq('exercise_name', exerciseName);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
