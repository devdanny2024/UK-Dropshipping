import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../lib/response';
import { prisma } from '../../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../../lib/events';
import { verifyPaystackWebhook, verifyPaystackTransaction } from '../../../../../../lib/paystack';
import { sendMail } from '../../../../../../lib/mailer';
import { paymentConfirmedEmail } from '../../../../../../lib/emails';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!verifyPaystackWebhook(signature, rawBody)) {
    return fail('UNAUTHORIZED', 'Invalid webhook signature', 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return fail('BAD_REQUEST', 'Invalid JSON payload', 400);
  }

  if (payload?.event !== 'charge.success') {
    return ok({ ignored: true });
  }

  const reference = payload?.data?.reference;
  if (!reference) return fail('BAD_REQUEST', 'Missing reference', 400);

  const idempotencyKey = `paystack:${reference}`;
  const existing = await prisma.payment.findUnique({ where: { idempotencyKey } });
  if (existing) {
    return ok({ id: existing.id, status: existing.status, paymentRef: existing.paymentRef });
  }

  const verified = await verifyPaystackTransaction(reference);
  const status = verified.status === 'success' ? 'CAPTURED' : 'FAILED';
  const orderId = String(verified.metadata?.orderId ?? '').trim() || null;
  const amountNGN = verified.amount / 100;

  const payment = await prisma.payment.create({
    data: {
      paymentRef: verified.reference,
      provider: 'paystack',
      amount: amountNGN,
      currency: verified.currency,
      status,
      idempotencyKey,
      orderId,
      gatewayRef: verified.reference,
      gatewayTxId: String(verified.id),
      paidAt: verified.paid_at ? new Date(verified.paid_at) : null,
      rawPayload: payload
    }
  });

  if (orderId) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: status === 'CAPTURED' ? 'PROCESSING' : 'PLACED' },
      include: { user: { select: { email: true, name: true } } }
    });
    await createOrderEvent(orderId, 'PAYMENT', `Paystack payment ${reference} ${status.toLowerCase()}`);

    if (status === 'CAPTURED' && order.user?.email) {
      const mail = paymentConfirmedEmail(order.user.name ?? '', orderId, amountNGN, verified.currency, 'paystack');
      await sendMail({ to: order.user.email, ...mail });
    }
  }

  return ok({ id: payment.id, status: payment.status, paymentRef: payment.paymentRef });
}
