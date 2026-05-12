import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { simulatePaymentSchema } from '../../../../../lib/schemas';
import { getClientSession } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../lib/events';
import { sendMail } from '../../../../../lib/mailer';
import { paymentConfirmedEmail } from '../../../../../lib/emails';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) return fail('UNAUTHORIZED', 'Please log in', 401);

  const { data, error } = await parseBody(request, simulatePaymentSchema);
  if (error) return error;

  const order = await prisma.order.findUnique({ where: { id: data.orderId } });
  if (!order || order.userId !== session.userId) {
    return fail('NOT_FOUND', 'Order not found', 404);
  }

  if (order.status !== 'PLACED') {
    return ok({ orderId: order.id, status: order.status });
  }

  const ref = `DEMO-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const idempotencyKey = `demo:${order.id}`;

  const existing = await prisma.payment.findUnique({ where: { idempotencyKey } });
  if (!existing) {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        paymentRef: ref,
        provider: 'demo',
        amount: order.total,
        currency: order.currency,
        status: 'CAPTURED',
        idempotencyKey,
        paidAt: new Date(),
        rawPayload: { simulated: true },
      }
    });
  }

  await prisma.order.update({ where: { id: order.id }, data: { status: 'PROCESSING' } });
  await createOrderEvent(order.id, 'PAYMENT', `Simulated payment ${ref} confirmed`);

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (user?.email) {
    const mail = paymentConfirmedEmail(user.name ?? '', order.id, order.total, order.currency, 'demo');
    await sendMail({ to: user.email, ...mail });
  }

  return ok({ orderId: order.id, status: 'PROCESSING', paymentRef: ref });
}
