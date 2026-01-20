import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { prisma } from '../../../../../lib/prisma';
import { getClientSession } from '../../../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getClientSession(request);
  if (!session) {
    return fail('UNAUTHORIZED', 'Client session required', 401);
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id, userId: session.userId },
    include: {
      items: true,
      events: { orderBy: { createdAt: 'asc' } },
      shipments: true
    }
  });

  if (!order) {
    return fail('NOT_FOUND', 'Order not found', 404);
  }

  return ok({
    id: order.id,
    status: order.status,
    total: order.total,
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    items: order.items,
    events: order.events,
    shipments: order.shipments
  });
}
