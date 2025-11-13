import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get the correct host from headers (for proxy setups)
  const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || 'ifreshbeard.com';
  const protocol = req.headers.get('x-forwarded-proto') || (req.nextUrl.protocol === 'https:' ? 'https' : 'http');
  const baseUrl = `${protocol}://${host}`;

  // Only protect /admin pages (not APIs)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const cookie = req.cookies.get('admin_session');
    if (!cookie) {
      const url = new URL('/admin/login', baseUrl);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Require registration/login before checkout
  if (pathname === '/checkout') {
    const session = req.cookies.get('session');
    if (!session) {
      const url = new URL('/auth/login', baseUrl);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/checkout'],
};
