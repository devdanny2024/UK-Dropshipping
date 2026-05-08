import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../lib/response';
import { prisma } from '../../../../../../lib/prisma';
import { requireAdmin } from '../../../../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      address: true,
      items: { include: { productSnapshot: true } },
      events: { orderBy: { createdAt: 'asc' } },
      shipments: true,
      payments: true,
      attempts: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!order) return fail('NOT_FOUND', 'Order not found', 404);

  return ok(order);
}
