import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { prisma } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const status = request.nextUrl.searchParams.get('status');
  const allowedStatuses = [
    'PLACED',
    'PROCESSING',
    'AWAITING_PURCHASE',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ] as const;

  if (status && !allowedStatuses.includes(status as (typeof allowedStatuses)[number])) {
    return fail('INVALID_STATUS', 'Invalid status filter', 400);
  }
  const orders = await prisma.order.findMany({
    where: status ? { status: status as (typeof allowedStatuses)[number] } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: { productSnapshot: { select: { title: true, url: true } } },
        take: 1
      },
      attempts: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });

  return ok(
    orders.map((order: (typeof orders)[number]) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      customerName: order.user?.name ?? 'Guest',
      customerEmail: order.user?.email ?? null,
      productTitle: order.items[0]?.productSnapshot?.title ?? null,
      productUrl: order.items[0]?.productSnapshot?.url ?? null,
      hasPendingAttempt: order.attempts[0]?.status === 'QUEUED' || order.attempts[0]?.status === 'RUNNING'
    }))
  );
}
