import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { backendBase } from '@/app/lib/server-api';

async function proxy(request: NextRequest) {
  if (!backendBase) {
    return NextResponse.json({ message: 'Backend service is not configured.' }, { status: 503 });
  }

  const path = request.nextUrl.pathname.replace('/api/proxy', '');
  const targetUrl = `${backendBase}/api${path}${request.nextUrl.search}`;
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();

  const headers = new Headers(request.headers);
  headers.set('host', new URL(backendBase).host);

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'content-encoding' || key.toLowerCase() === 'content-length') {
        return;
      }
      responseHeaders.append(key, value);
    });

    const data = await response.arrayBuffer();
    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Backend service is temporarily unavailable.',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 503 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
