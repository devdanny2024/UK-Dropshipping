import type { NextRequest } from 'next/server';
import { ok } from '../../../../../lib/response';
import { prisma } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { orders: true } },
      orders: {
        select: { total: true },
      },
    },
  });

  return ok(
    users.map((u: (typeof users)[number]) => ({
      id: u.id,
      name: u.name ?? 'Unknown',
      email: u.email,
      orderCount: u._count.orders,
      totalSpend: u.orders.reduce((sum: number, o: { total: number }) => sum + o.total, 0),
      createdAt: u.createdAt.toISOString(),
    }))
  );
}
