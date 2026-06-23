import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { changePasswordSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { getClientSession, verifyPassword, hashPassword } from '../../../../../lib/auth';

export async function POST(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) {
    return fail('UNAUTHORIZED', 'Client session required', 401);
  }

  const { data, error } = await parseBody(request, changePasswordSchema);
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.passwordHash) {
    return fail('BAD_REQUEST', 'Cannot change password for this account', 400);
  }

  if (!verifyPassword(data.currentPassword, user.passwordHash)) {
    return fail('BAD_REQUEST', 'Current password is incorrect', 400);
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash: hashPassword(data.newPassword) },
  });

  return ok({ changed: true });
}
