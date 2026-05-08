import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rawOrigins = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';
const allowedOrigins = new Set(rawOrigins.split(',').map((o) => o.trim()).filter(Boolean));

function getAllowOrigin(origin: string | null): string {
  if (origin && allowedOrigins.has(origin)) return origin;
  return allowedOrigins.values().next().value ?? '*';
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    const allowOrigin = getAllowOrigin(origin);

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowOrigin,
          'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key',
          'Access-Control-Allow-Credentials': 'true',
          'Vary': 'Origin'
        }
      });
    }

    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', allowOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
