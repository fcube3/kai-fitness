import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAuth } from '@/lib/api-auth';

const VALID_TARGETS = ['calories', 'protein_g', 'carbs_g', 'fat_g'];

/** GET /api/fitness/nutrition/targets */
export async function GET(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const { data, error } = await supabase
    .from('nutrition_targets')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ targets: data });
}

/** POST /api/fitness/nutrition/targets — upsert targets */
export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const rows: { target_type: string; value: number; updated_at: string }[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (!VALID_TARGETS.includes(key)) continue;
      const numValue = Number(value);
      if (isNaN(numValue) || numValue <= 0) continue;
      rows.push({ target_type: key, value: numValue, updated_at: new Date().toISOString() });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid targets provided' }, { status: 400 });
    }

    const { error } = await supabase
      .from('nutrition_targets')
      .upsert(rows, { onConflict: 'target_type' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, upserted: rows.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
