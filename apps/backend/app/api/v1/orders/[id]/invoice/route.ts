import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../lib/response';
import { prisma } from '../../../../../../lib/prisma';
import { getClientSession } from '../../../../../../lib/auth';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const session = await getClientSession(request);
  if (!session) return fail('UNAUTHORIZED', 'Client session required', 401);

  const orderId = context.params.id;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  });
  if (!order || order.userId !== session.userId) {
    return fail('NOT_FOUND', 'Order not found', 404);
  }

  const invoice = await prisma.invoice.findUnique({
    where: { orderId },
    include: { lineItems: true },
  });
  if (!invoice) return fail('NOT_FOUND', 'Invoice not found', 404);

  return ok({ invoice });
}
