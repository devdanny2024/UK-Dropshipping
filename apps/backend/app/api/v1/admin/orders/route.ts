import type { NextRequest } from 'next/server';
import { ok } from '../../../../../lib/response';
import { prisma } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const status = request.nextUrl.searchParams.get('status');
  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' }
  });

  return ok(
    orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      currency: order.currency,
      createdAt: order.createdAt.toISOString()
    }))
  );
}
