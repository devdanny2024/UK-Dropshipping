import type { NextRequest } from 'next/server';
import { ok } from '../../../../../lib/response';
import { prisma } from '../../../../../lib/prisma';
import { getClientCookieName } from '../../../../../lib/auth';

export async function POST(request: NextRequest) {
  const cookieName = getClientCookieName();
  const token = request.cookies.get(cookieName)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  const response = ok({ success: true });
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0)
  });

  return response;
}
