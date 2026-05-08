import crypto from 'node:crypto';
import { getStripeConfig } from './config';

// Stripe API uses application/x-www-form-urlencoded with nested key syntax
function encodeForm(obj: Record<string, unknown>, prefix = ''): string {
  return Object.entries(obj)
    .flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}[${key}]` : key;
      if (value === null || value === undefined) return [];
      if (typeof value === 'object' && !Array.isArray(value)) {
        return [encodeForm(value as Record<string, unknown>, fullKey)];
      }
      if (Array.isArray(value)) {
        return value.map((item, i) =>
          typeof item === 'object'
            ? encodeForm(item as Record<string, unknown>, `${fullKey}[${i}]`)
            : `${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(String(item))}`
        );
      }
      return [`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`];
    })
    .join('&');
}

async function stripePost(path: string, params: Record<string, unknown>) {
  const config = getStripeConfig();
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: encodeForm(params)
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data?.error?.message ?? `Stripe error on ${path}`);
  return data;
}

type CreateCheckoutParams = {
  amountPence: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string | null;
  metadata?: Record<string, string>;
  description?: string;
};

export async function createStripeCheckoutSession(params: CreateCheckoutParams) {
  const session = await stripePost('/checkout/sessions', {
    mode: 'payment',
    payment_method_types: ['card', 'link'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: params.currency.toLowerCase(),
          unit_amount: params.amountPence,
          product_data: { name: params.description ?? 'UK2ME Order' }
        }
      }
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail ?? undefined,
    metadata: params.metadata ?? {}
  });

  return session as { id: string; url: string; payment_intent: string | null };
}

export function verifyStripeWebhook(signature: string | null, rawBody: string): boolean {
  if (!signature) return false;
  const config = getStripeConfig();
  const parts = Object.fromEntries(
    signature.split(',').map((part) => part.split('=') as [string, string])
  );
  const timestamp = parts['t'];
  const v1 = parts['v1'];
  if (!timestamp || !v1) return false;

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (ageSeconds > 300) return false;

  const expected = crypto
    .createHmac('sha256', config.STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'));
}
