import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { paymentInitSchema } from '../../../../../lib/schemas';
import { getClientSession } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';
import { initializePaystackPayment, newPaystackRef } from '../../../../../lib/paystack';
import { createStripeCheckoutSession } from '../../../../../lib/stripe';
import { getFxRates, convertAmount } from '../../../../../lib/fx';
import { getAllFxOverrides } from '../../../../../lib/settings';
import { getPaidAmount } from '../../../../../lib/wallet';

export async function POST(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) return fail('UNAUTHORIZED', 'Client session required', 401);

  const { data, error } = await parseBody(request, paymentInitSchema);
  if (error) return error;

  const order = await prisma.order.findUnique({ where: { id: data.orderId }, include: { user: true } });
  if (!order || order.userId !== session.userId) return fail('NOT_FOUND', 'Order not found', 404);

  // Charge only what is still outstanding — any wallet credit already applied
  // (M3 R13) reduces the gateway amount. Computed server-side; never trusted from the client.
  const paid = await getPaidAmount(order.id);
  const outstanding = Math.round(Math.max(0, order.total - paid) * 100) / 100;
  if (outstanding <= 0) return fail('ALREADY_PAID', 'This order is already fully paid', 409);

  if (data.provider === 'stripe') {
    const baseUrl = process.env.STRIPE_REDIRECT_URL ?? 'http://localhost:3000/pay/callback';
    const successUrl = `${baseUrl}?orderId=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.CLIENT_ORIGIN ?? 'http://localhost:3000'}/pay?orderId=${encodeURIComponent(order.id)}`;

    // Stripe uses smallest currency unit (pence for GBP)
    const amountPence = Math.round(outstanding * 100);

    const stripeSession = await createStripeCheckoutSession({
      amountPence,
      currency: order.currency,
      successUrl,
      cancelUrl,
      customerEmail: order.user?.email,
      description: `UK2ME Order ${order.id}`,
      metadata: { orderId: order.id, userId: order.userId ?? '' }
    });

    return ok({
      orderId: order.id,
      provider: 'stripe',
      sessionId: stripeSession.id,
      checkoutUrl: stripeSession.url
    });
  }

  // Paystack — convert to NGN
  const ref = data.reference ?? newPaystackRef(order.id);
  const callbackUrl = `${process.env.PAYSTACK_REDIRECT_URL ?? 'http://localhost:3000/pay/callback'}?orderId=${encodeURIComponent(order.id)}`;

  let ngnAmount = outstanding;
  if (order.currency !== 'NGN') {
    const overrides = await getAllFxOverrides();
    const pair = `${order.currency}_NGN`;
    let rate = overrides[pair] ?? null;
    if (!rate) {
      const fxData = await getFxRates(order.currency, ['NGN']);
      rate = fxData.rates['NGN'] ?? null;
    }
    if (!rate) return fail('FX_UNAVAILABLE', 'Could not get exchange rate to NGN', 503);
    ngnAmount = convertAmount(outstanding, rate);
  }

  const payment = await initializePaystackPayment({
    reference: ref,
    amountKobo: Math.round(ngnAmount * 100),
    email: order.user?.email ?? 'customer@uk2meonline.com',
    callbackUrl,
    metadata: { orderId: order.id, userId: order.userId }
  });

  return ok({
    orderId: order.id,
    provider: 'paystack',
    reference: ref,
    checkoutUrl: payment.authorization_url,
    ngnAmount
  });
}
