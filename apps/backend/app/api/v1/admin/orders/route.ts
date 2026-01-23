import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { prisma } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
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
    orderBy: { createdAt: 'desc' }
  });

  return ok(
    orders.map((order: { id: string; status: string; total: number; currency: string; createdAt: Date }) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      currency: order.currency,
      createdAt: order.createdAt.toISOString()
    }))
  );
}
