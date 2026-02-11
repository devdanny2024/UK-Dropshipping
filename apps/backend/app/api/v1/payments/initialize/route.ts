import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../lib/response';
import { parseBody } from '../../../../../../lib/parse';
import { paymentInitSchema } from '../../../../../../lib/schemas';
import { getClientSession } from '../../../../../../lib/auth';
import { prisma } from '../../../../../../lib/prisma';
import { initializeFlutterwavePayment, newTxRef } from '../../../../../../lib/flutterwave';

export async function POST(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) return fail('UNAUTHORIZED', 'Client session required', 401);

  const { data, error } = await parseBody(request, paymentInitSchema);
  if (error) return error;

  const order = await prisma.order.findUnique({ where: { id: data.orderId }, include: { user: true } });
  if (!order || order.userId !== session.userId) return fail('NOT_FOUND', 'Order not found', 404);

  const txRef = data.txRef ?? newTxRef(order.id);
  const redirectUrl = `${process.env.FLW_REDIRECT_URL}?orderId=${encodeURIComponent(order.id)}`;

  const payment = await initializeFlutterwavePayment({
    txRef,
    amount: order.total,
    currency: order.currency,
    redirectUrl,
    customer: {
      email: order.user?.email ?? 'customer@uk2meonline.com',
      name: order.user?.name
    },
    meta: { orderId: order.id, userId: order.userId }
  });

  return ok({
    orderId: order.id,
    txRef,
    checkoutUrl: payment.link
  });
}
