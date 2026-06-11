import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../lib/response';
import { prisma } from '../../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../../lib/events';
import { verifyPaystackWebhook, verifyPaystackTransaction } from '../../../../../../lib/paystack';
import { getPaidAmount } from '../../../../../../lib/wallet';
import { sendMail } from '../../../../../../lib/mailer';
import { paymentConfirmedEmail } from '../../../../../../lib/emails';

const round2 = (n: number) => Math.round(n * 100) / 100;

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
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true, name: true } }, invoice: true }
    });

    if (order) {
      // Currency-aware: only payments in the order currency count toward settlement.
      const settled = status === 'CAPTURED' ? round2(await getPaidAmount(orderId, order.currency)) : 0;
      const fullyPaid = status === 'CAPTURED' && settled >= round2(order.total);

      if (fullyPaid) {
        await prisma.order.update({ where: { id: orderId }, data: { status: 'PROCESSING' } });
        if (order.invoice && order.invoice.status !== 'PAID') {
          await prisma.invoice.update({
            where: { id: order.invoice.id },
            data: { status: 'PAID', paidAt: new Date() }
          });
        }
        await createOrderEvent(orderId, 'PAYMENT', `Paystack payment ${reference} captured — order fully paid`);
        if (order.user?.email) {
          const mail = paymentConfirmedEmail(order.user.name ?? '', orderId, amountNGN, verified.currency, 'paystack');
          await sendMail({ to: order.user.email, ...mail });
        }
      } else if (status === 'CAPTURED') {
        // Captured but insufficient (or currency mismatch) — record partial, leave order as-is.
        const remaining = round2(Math.max(0, order.total - settled));
        await createOrderEvent(
          orderId,
          'PAYMENT',
          `Paystack payment ${reference} captured (${verified.currency} ${amountNGN.toFixed(2)}) — partial; ${order.currency} ${remaining.toFixed(2)} remaining`
        );
      } else {
        await createOrderEvent(orderId, 'PAYMENT', `Paystack payment ${reference} ${status.toLowerCase()}`);
      }
    }
  }

  return ok({ id: payment.id, status: payment.status, paymentRef: payment.paymentRef });
}
