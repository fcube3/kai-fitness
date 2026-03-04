import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAuth } from '@/lib/api-auth';

const METRIC_UNITS: Record<string, string> = {
  body_weight: 'kg',
  sleep_hours: 'hours',
  hrv: 'ms',
  resting_hr: 'bpm',
  active_calories: 'kcal',
  steps: 'steps',
  vo2_max: 'mL/kg/min',
  blood_oxygen: '%',
};

const VALID_METRICS = Object.keys(METRIC_UNITS);

/** GET /api/fitness/health — query health metrics */
export async function GET(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const type = searchParams.get('type');

  let query = supabase
    .from('health_metrics')
    .select('*')
    .order('date', { ascending: true });

  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);
  if (type) query = query.eq('metric_type', type);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ metrics: data });
}

/** POST /api/fitness/health — upsert daily metrics (for iOS Shortcut) */
export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { date, ...metrics } = body;

    if (!date) {
      return NextResponse.json({ error: 'date is required (YYYY-MM-DD)' }, { status: 400 });
    }

    const rows: { date: string; metric_type: string; value: number; unit: string }[] = [];

    for (const [key, value] of Object.entries(metrics)) {
      if (!VALID_METRICS.includes(key)) continue;
      if (value == null || value === '') continue;
      const numValue = Number(value);
      if (isNaN(numValue)) continue;

      rows.push({
        date,
        metric_type: key,
        value: numValue,
        unit: METRIC_UNITS[key],
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid metrics provided' }, { status: 400 });
    }

    const { error } = await supabase
      .from('health_metrics')
      .upsert(rows, { onConflict: 'date,metric_type' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, upserted: rows.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
