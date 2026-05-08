import crypto from 'node:crypto';
import { getPaystackConfig } from './config';

type InitPaymentParams = {
  reference: string;
  amountKobo: number;
  email: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

export async function initializePaystackPayment(params: InitPaymentParams) {
  const config = getPaystackConfig();
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reference: params.reference,
      amount: params.amountKobo,
      email: params.email,
      callback_url: params.callbackUrl,
      metadata: params.metadata ?? {}
    })
  });

  const payload = await response.json() as any;
  if (!response.ok || !payload?.status || !payload?.data?.authorization_url) {
    throw new Error(payload?.message ?? 'Paystack init failed');
  }
  return payload.data as { authorization_url: string; access_code: string; reference: string };
}

export function verifyPaystackWebhook(signature: string | null, rawBody: string): boolean {
  const config = getPaystackConfig();
  const expected = crypto
    .createHmac('sha512', config.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');
  return signature === expected;
}

export async function verifyPaystackTransaction(reference: string) {
  const config = getPaystackConfig();
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}` }
  });

  const payload = await response.json() as any;
  if (!response.ok || !payload?.status) {
    throw new Error(payload?.message ?? 'Paystack verify failed');
  }

  const data = payload.data as {
    id: number;
    reference: string;
    status: string;
    amount: number;
    currency: string;
    paid_at?: string;
    gateway_response: string;
    metadata?: Record<string, unknown>;
  };
  return data;
}

export function newPaystackRef(prefix = 'UK2ME') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}
