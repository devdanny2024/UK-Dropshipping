import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { addressSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { getClientSession } from '../../../../../lib/auth';

export async function POST(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) {
    return fail('UNAUTHORIZED', 'Client session required', 401);
  }

  const { data, error } = await parseBody(request, addressSchema);
  if (error) return error;

  const address = await prisma.$transaction(async (tx: typeof prisma) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId: session.userId, type: data.type },
        data: { isDefault: false }
      });
    }

    return tx.address.create({
      data: {
        userId: session.userId,
        label: data.label,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone,
        type: data.type,
        isDefault: data.isDefault ?? false
      }
    });
  });

  return ok({ address });
}
