import crypto from 'node:crypto';
import { getFlutterwaveConfig } from './config';

type InitPaymentParams = {
  txRef: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  customer: { email: string; name?: string | null };
  meta?: Record<string, unknown>;
};

export async function initializeFlutterwavePayment(params: InitPaymentParams) {
  const config = getFlutterwaveConfig();
  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.FLW_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tx_ref: params.txRef,
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.redirectUrl,
      customer: params.customer,
      customizations: {
        title: 'UK2ME Checkout',
        description: 'Order payment'
      },
      meta: params.meta ?? {}
    })
  });

  const payload = await response.json() as any;
  if (!response.ok || payload?.status !== 'success' || !payload?.data?.link) {
    throw new Error(payload?.message ?? 'Flutterwave init failed');
  }
  return payload.data as { link: string; id?: number; tx_ref: string };
}

export function verifyFlutterwaveWebhook(requestSignature: string | null) {
  const config = getFlutterwaveConfig();
  return requestSignature === config.FLW_WEBHOOK_SECRET_HASH;
}

export async function verifyFlutterwaveTransaction(transactionId: string | number) {
  const config = getFlutterwaveConfig();
  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: {
      Authorization: `Bearer ${config.FLW_SECRET_KEY}`
    }
  });

  const payload = await response.json() as any;
  if (!response.ok || payload?.status !== 'success') {
    throw new Error(payload?.message ?? 'Flutterwave verify failed');
  }

  return payload.data as {
    id: number;
    tx_ref: string;
    flw_ref: string;
    status: string;
    amount: number;
    currency: string;
    paid_at?: string;
  };
}

export function newTxRef(prefix = 'UK2ME') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}
