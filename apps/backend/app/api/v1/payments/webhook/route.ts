import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { paymentWebhookSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../lib/events';

export async function POST(request: NextRequest) {
  const idempotencyKey = request.headers.get('idempotency-key');
  if (!idempotencyKey) {
    return fail('MISSING_IDEMPOTENCY_KEY', 'Idempotency-Key header required', 400);
  }

  const existing = await prisma.payment.findUnique({
    where: { idempotencyKey }
  });

  if (existing) {
    return ok({
      id: existing.id,
      paymentRef: existing.paymentRef,
      status: existing.status
    });
  }

  const { data, error } = await parseBody(request, paymentWebhookSchema);
  if (error) return error;

  const payment = await prisma.payment.create({
    data: {
      paymentRef: data.paymentRef,
      provider: data.provider,
      amount: data.amount,
      currency: data.currency,
      status: 'RECEIVED',
      idempotencyKey,
      orderId: data.orderId ?? null
    }
  });

  if (payment.orderId) {
    await createOrderEvent(payment.orderId, 'PAYMENT', `Payment ${payment.paymentRef} received`);
  }

  return ok({
    id: payment.id,
    paymentRef: payment.paymentRef,
    status: payment.status
  });
}
