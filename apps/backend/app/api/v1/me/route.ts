import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { updateProfileSchema } from '../../../../lib/schemas';
import { prisma } from '../../../../lib/prisma';
import { getClientSession } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) {
    return fail('UNAUTHORIZED', 'Client session required', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { addresses: { orderBy: { createdAt: 'desc' } } }
  });

  if (!user) {
    return fail('NOT_FOUND', 'User not found', 404);
  }

  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerifiedAt: user.emailVerifiedAt
    },
    addresses: user.addresses
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) {
    return fail('UNAUTHORIZED', 'Client session required', 401);
  }

  const { data, error } = await parseBody(request, updateProfileSchema);
  if (error) return error;

  if (!data.name && !data.phone) {
    return fail('INVALID_INPUT', 'Nothing to update', 400);
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: data.name ?? undefined,
      phone: data.phone ?? undefined
    }
  });

  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerifiedAt: user.emailVerifiedAt
    }
  });
}
