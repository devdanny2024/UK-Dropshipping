import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { resetPasswordSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { hashPassword } from '../../../../../lib/auth';

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, resetPasswordSchema);
  if (error) return error;

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: data.token }
  });

  if (!record) {
    return fail('INVALID_TOKEN', 'Reset link is invalid or expired', 400);
  }

  if (record.expiresAt < new Date()) {
    return fail('TOKEN_EXPIRED', 'Reset link has expired', 400);
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: hashPassword(data.password) }
  });

  await prisma.passwordResetToken.delete({ where: { id: record.id } });

  return ok({ reset: true });
}
