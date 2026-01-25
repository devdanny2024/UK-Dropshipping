import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { verifyEmailSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, verifyEmailSchema);
  if (error) return error;

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token: data.token },
    include: { user: true }
  });

  if (!record) {
    return fail('INVALID_TOKEN', 'Verification link is invalid or expired', 400);
  }

  if (record.expiresAt < new Date()) {
    return fail('TOKEN_EXPIRED', 'Verification link has expired', 400);
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerifiedAt: new Date() }
  });

  await prisma.emailVerificationToken.delete({ where: { id: record.id } });

  return ok({ verified: true, email: record.user.email });
}
