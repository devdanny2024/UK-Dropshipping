import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const isLogin = req.nextUrl.pathname === '/admin/login';
  const hasSession = req.cookies.get('admin_session')?.value === 'active';

  if (!isLogin && !hasSession && req.nextUrl.pathname.startsWith('/admin')) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};

