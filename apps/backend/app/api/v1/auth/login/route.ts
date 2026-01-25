import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { loginSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { createSession, getClientCookieName, verifyPassword } from '../../../../../lib/auth';

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, loginSchema);
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() }
  });

  if (!user || !verifyPassword(data.password, user.passwordHash)) {
    return fail('INVALID_CREDENTIALS', 'Email or password is incorrect', 401);
  }

  if (!user.emailVerifiedAt) {
    return fail('EMAIL_NOT_VERIFIED', 'Please verify your email before logging in', 403);
  }

  const session = await createSession(user.id);
  const response = ok({
    user: { id: user.id, email: user.email, name: user.name }
  });

  response.cookies.set(getClientCookieName(), session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: session.expiresAt
  });

  return response;
}
