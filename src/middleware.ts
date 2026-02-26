import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'fitness_auth';
const BYPASS_PATHS = ['/login', '/logout', '/auth'];

function isHtmlRequest(request: NextRequest) {
  return (request.headers.get('accept') || '').includes('text/html');
}

function readBasicPassword(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) return null;
  try {
    const decoded = atob(authHeader.slice(6));
    const sep = decoded.indexOf(':');
    return sep < 0 ? null : decoded.slice(sep + 1).trim();
  } catch { return null; }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (BYPASS_PATHS.includes(pathname)) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.next(); // API routes check auth internally

  const expectedPassword = process.env.FITNESS_PASSWORD?.trim();
  if (!expectedPassword) {
    return new NextResponse('FITNESS_PASSWORD is not configured', { status: 503 });
  }

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value?.trim();
  if (cookieValue === expectedPassword) return NextResponse.next();

  const basicPassword = readBasicPassword(request);
  if (basicPassword && basicPassword === expectedPassword) {
    const response = NextResponse.next();
    response.cookies.set(COOKIE_NAME, expectedPassword, {
      httpOnly: true, secure: true, sameSite: 'lax',
      path: '/', maxAge: 60 * 60 * 24 * 14,
    });
    return response;
  }

  if (!isHtmlRequest(request)) {
    return new NextResponse('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Fitness"' } });
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
