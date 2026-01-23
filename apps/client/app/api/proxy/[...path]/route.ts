import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const backendBase = process.env.BACKEND_HTTP_BASE_URL ?? 'http://localhost:4000';

async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api/proxy', '');
  const targetUrl = `${backendBase}/api${path}${request.nextUrl.search}`;
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();

  const headers = new Headers(request.headers);
  headers.set('host', new URL(backendBase).host);

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
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
