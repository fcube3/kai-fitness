import { NextRequest, NextResponse } from 'next/server';

/** Check auth from cookie or header. Returns error response if unauthorized, null if OK. */
export function checkAuth(request: NextRequest): NextResponse | null {
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

  return null;
}
