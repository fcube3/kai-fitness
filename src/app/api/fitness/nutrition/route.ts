import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAuth } from '@/lib/api-auth';

/** GET /api/fitness/nutrition — list nutrition logs */
export async function GET(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = supabase
    .from('nutrition_logs')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (date) {
    query = query.eq('date', date);
  } else {
    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
  }

  const { data, error } = await query.limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}

/** POST /api/fitness/nutrition — create a nutrition log */
export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { date, meal_type, description, calories, protein_g, carbs_g, fat_g, photo_url } = body;

    if (!date || !meal_type) {
      return NextResponse.json({ error: 'date and meal_type are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert({
        date,
        meal_type,
        description: description || null,
        calories: calories ?? null,
        protein_g: protein_g ?? null,
        carbs_g: carbs_g ?? null,
        fat_g: fat_g ?? null,
        photo_url: photo_url || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, log: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
