import { ok, fail } from '../../../../../lib/response';
import { prisma } from '../../../../../lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
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
