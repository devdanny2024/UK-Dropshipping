import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  // Auth disabled for presentation/demo purposes.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};

