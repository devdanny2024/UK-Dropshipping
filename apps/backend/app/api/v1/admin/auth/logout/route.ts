import type { NextRequest } from 'next/server';
import { ok } from '../../../../../../lib/response';
import { getAdminCookieName } from '../../../../../../lib/auth';
import { prisma } from '../../../../../../lib/prisma';

export async function POST(request: NextRequest) {
  const cookieName = getAdminCookieName();
  const token = request.cookies.get(cookieName)?.value;
  // Invalidate the server-side session so the token can't be reused.
  if (token && token !== 'active') {
    await prisma.session.deleteMany({ where: { token } });
  }
  const response = ok({ ok: true });
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
  return response;
}
