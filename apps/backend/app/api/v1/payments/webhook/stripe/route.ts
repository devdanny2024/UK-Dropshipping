import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../lib/response';
import { prisma } from '../../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../../lib/events';
import { verifyStripeWebhook } from '../../../../../../lib/stripe';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!verifyStripeWebhook(signature, rawBody)) {
    return fail('UNAUTHORIZED', 'Invalid webhook signature', 401);
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return fail('BAD_REQUEST', 'Invalid JSON payload', 400);
  }

  if (event.type !== 'checkout.session.completed') {
    return ok({ ignored: true });
  }

  const stripeSession = event.data?.object;
  const sessionId = stripeSession?.id;
  if (!sessionId) return fail('BAD_REQUEST', 'Missing session id', 400);

  const idempotencyKey = `stripe:${sessionId}`;
  const existing = await prisma.payment.findUnique({ where: { idempotencyKey } });
  if (existing) {
    return ok({ id: existing.id, status: existing.status, paymentRef: existing.paymentRef });
  }

  const orderId = String(stripeSession?.metadata?.orderId ?? '').trim() || null;
  const amountTotal = typeof stripeSession?.amount_total === 'number' ? stripeSession.amount_total / 100 : 0;
  const currency = (stripeSession?.currency ?? 'gbp').toUpperCase();
  const status = stripeSession?.payment_status === 'paid' ? 'CAPTURED' : 'FAILED';

  const payment = await prisma.payment.create({
    data: {
      paymentRef: sessionId,
      provider: 'stripe',
      amount: amountTotal,
      currency,
      status,
      idempotencyKey,
      orderId,
      gatewayRef: stripeSession?.payment_intent ?? null,
      gatewayTxId: sessionId,
      paidAt: status === 'CAPTURED' ? new Date() : null,
      rawPayload: event
    }
  });

  if (orderId) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: status === 'CAPTURED' ? 'PROCESSING' : 'PLACED' }
    });
    await createOrderEvent(orderId, 'PAYMENT', `Stripe payment ${sessionId} ${status.toLowerCase()}`);
  }

  return ok({ id: payment.id, status: payment.status, paymentRef: payment.paymentRef });
}
