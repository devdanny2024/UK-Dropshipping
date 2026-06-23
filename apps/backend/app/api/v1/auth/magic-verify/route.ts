import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { magicVerifySchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { createSession, getClientCookieName } from '../../../../../lib/auth';

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, magicVerifySchema);
  if (error) return error;

  const email = data.email.toLowerCase();

  const record = await prisma.magicLoginCode.findFirst({
    where: {
      email,
      code: data.code,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!record) {
    return fail('INVALID_CODE', 'Invalid or expired code', 400);
  }

  await prisma.magicLoginCode.update({
    where: { id: record.id },
    data: { usedAt: new Date() }
  });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return fail('NOT_FOUND', 'Account not found', 404);
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
