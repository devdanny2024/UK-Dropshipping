import { z } from 'zod';

const flwConfigSchema = z.object({
  FLW_SECRET_KEY: z.string().min(10),
  FLW_PUBLIC_KEY: z.string().min(10).optional(),
  FLW_WEBHOOK_SECRET_HASH: z.string().min(6),
  FLW_REDIRECT_URL: z.string().url()
});

const paystackConfigSchema = z.object({
  PAYSTACK_SECRET_KEY: z.string().min(10),
  PAYSTACK_REDIRECT_URL: z.string().url()
});

const stripeConfigSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(10),
  STRIPE_WEBHOOK_SECRET: z.string().min(10),
  STRIPE_REDIRECT_URL: z.string().url()
});

export function getFlutterwaveConfig() {
  return flwConfigSchema.parse(process.env);
}

export function getPaystackConfig() {
  return paystackConfigSchema.parse(process.env);
}

export function getStripeConfig() {
  return stripeConfigSchema.parse(process.env);
}
