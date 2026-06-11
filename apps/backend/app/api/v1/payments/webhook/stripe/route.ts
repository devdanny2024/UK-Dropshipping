import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../../lib/response';
import { prisma } from '../../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../../lib/events';
import { verifyStripeWebhook } from '../../../../../../lib/stripe';
import { getStripeConfig } from '../../../../../../lib/config';
import { getPaidAmount } from '../../../../../../lib/wallet';
import { sendMail } from '../../../../../../lib/mailer';
import { paymentConfirmedEmail } from '../../../../../../lib/emails';

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Re-fetch the Checkout Session from the Stripe API by id so we trust the
 * gateway's authoritative amount/currency/status — never the (signature-valid
 * but otherwise unverified) webhook body. Mirrors verifyPaystackTransaction.
 */
async function fetchStripeCheckoutSession(sessionId: string) {
  const config = getStripeConfig();
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${config.STRIPE_SECRET_KEY}` } }
  );
  const data = (await response.json()) as any;
  if (!response.ok) {
    throw new Error(data?.error?.message ?? `Stripe session fetch failed (${response.status})`);
  }
  return data as {
    id: string;
    amount_total: number | null;
    currency: string | null;
    payment_status: string | null;
    payment_intent: string | null;
    metadata?: Record<string, string> | null;
  };
}

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

  // Re-fetch authoritative amount/status from Stripe — do NOT trust the body.
  const verified = await fetchStripeCheckoutSession(sessionId);
  const orderId = String(verified.metadata?.orderId ?? '').trim() || null;
  const amountTotal = typeof verified.amount_total === 'number' ? verified.amount_total / 100 : 0;
  const currency = (verified.currency ?? 'gbp').toUpperCase();
  const status = verified.payment_status === 'paid' ? 'CAPTURED' : 'FAILED';

  const payment = await prisma.payment.create({
    data: {
      paymentRef: sessionId,
      provider: 'stripe',
      amount: amountTotal,
      currency,
      status,
      idempotencyKey,
      orderId,
      gatewayRef: verified.payment_intent ?? null,
      gatewayTxId: sessionId,
      paidAt: status === 'CAPTURED' ? new Date() : null,
      rawPayload: event
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
        await createOrderEvent(orderId, 'PAYMENT', `Stripe payment ${sessionId} captured — order fully paid`);
        if (order.user?.email) {
          const mail = paymentConfirmedEmail(order.user.name ?? '', orderId, amountTotal, currency, 'stripe');
          await sendMail({ to: order.user.email, ...mail });
        }
      } else if (status === 'CAPTURED') {
        // Captured but insufficient — record partial payment, leave order as-is.
        const remaining = round2(Math.max(0, order.total - settled));
        await createOrderEvent(
          orderId,
          'PAYMENT',
          `Stripe payment ${sessionId} captured (${currency} ${amountTotal.toFixed(2)}) — partial; ${order.currency} ${remaining.toFixed(2)} remaining`
        );
      } else {
        await createOrderEvent(orderId, 'PAYMENT', `Stripe payment ${sessionId} ${status.toLowerCase()}`);
      }
    }
  }

  return ok({ id: payment.id, status: payment.status, paymentRef: payment.paymentRef });
}
