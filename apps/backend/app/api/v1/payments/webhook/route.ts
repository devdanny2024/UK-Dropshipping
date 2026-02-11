import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { prisma } from '../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../lib/events';
import { verifyFlutterwaveWebhook, verifyFlutterwaveTransaction } from '../../../../../lib/flutterwave';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('verif-hash');
  if (!verifyFlutterwaveWebhook(signature)) {
    return fail('UNAUTHORIZED', 'Invalid webhook signature', 401);
  }

  const payload = await request.json().catch(() => null) as any;
  const eventData = payload?.data;
  if (!eventData?.id || !eventData?.tx_ref) {
    return fail('BAD_REQUEST', 'Invalid webhook payload', 400);
  }

  const verified = await verifyFlutterwaveTransaction(eventData.id);
  const idempotencyKey = `flw:${verified.tx_ref}`;

  const existing = await prisma.payment.findUnique({ where: { idempotencyKey } });
  if (existing) {
    return ok({ id: existing.id, status: existing.status, paymentRef: existing.paymentRef });
  }

  const orderId = String(payload?.meta?.orderId ?? '').trim() || null;
  const status = verified.status === 'successful' ? 'CAPTURED' : 'FAILED';

  const payment = await prisma.payment.create({
    data: {
      paymentRef: verified.tx_ref,
      provider: 'flutterwave',
      amount: verified.amount,
      currency: verified.currency,
      status,
      idempotencyKey,
      orderId,
      gatewayRef: verified.flw_ref,
      gatewayTxId: String(verified.id),
      paidAt: verified.paid_at ? new Date(verified.paid_at) : null,
      rawPayload: payload
    }
  });

  if (orderId) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status === 'CAPTURED' ? 'PROCESSING' : 'PLACED'
      }
    });
    await createOrderEvent(orderId, 'PAYMENT', `Payment ${payment.paymentRef} ${status.toLowerCase()}`);
  }

  return ok({ id: payment.id, status: payment.status, paymentRef: payment.paymentRef });
}
