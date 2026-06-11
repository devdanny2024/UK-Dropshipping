import type { NextRequest } from 'next/server';
import { ok } from '../../../../../lib/response';
import { prisma } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/auth';

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const statusParam = request.nextUrl.searchParams.get('status');
  const status =
    statusParam === 'REQUESTED' || statusParam === 'PRICED' || statusParam === 'AUTO'
      ? statusParam
      : undefined;

  const requests = await prisma.weightPriceRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' }
  });

  return ok({ requests });
}
