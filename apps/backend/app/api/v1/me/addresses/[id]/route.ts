import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../lib/response';
import { parseBody } from '../../../../../../lib/parse';
import { addressSchema } from '../../../../../../lib/schemas';
import { prisma } from '../../../../../../lib/prisma';
import { getClientSession } from '../../../../../../lib/auth';

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const session = await getClientSession(request);
  if (!session) {
    return fail('UNAUTHORIZED', 'Client session required', 401);
  }

  const { data, error } = await parseBody(request, addressSchema.partial());
  if (error) return error;

  const existing = await prisma.address.findFirst({
    where: { id: context.params.id, userId: session.userId }
  });

  if (!existing) {
    return fail('NOT_FOUND', 'Address not found', 404);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextType = data.type ?? existing.type;
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId: session.userId, type: nextType },
        data: { isDefault: false }
      });
    }

    return tx.address.update({
      where: { id: existing.id },
      data: {
        label: data.label ?? undefined,
        line1: data.line1 ?? undefined,
        line2: data.line2 ?? undefined,
        city: data.city ?? undefined,
        state: data.state ?? undefined,
        postalCode: data.postalCode ?? undefined,
        country: data.country ?? undefined,
        phone: data.phone ?? undefined,
        type: data.type ?? undefined,
        isDefault: data.isDefault ?? undefined
      }
    });
  });

  return ok({ address: updated });
}
