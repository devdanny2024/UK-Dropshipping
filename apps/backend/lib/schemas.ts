import { z } from 'zod';

export const resolveProductSchema = z.object({
  url: z.string().url()
});

export const quoteSchema = z.object({
  productSnapshotId: z.string(),
  size: z.string(),
  color: z.string(),
  qty: z.number().int().min(1),
  addressId: z.string()
});

export const paymentWebhookSchema = z.object({
  paymentRef: z.string(),
  orderId: z.string().optional(),
  amount: z.number().nonnegative(),
  currency: z.string(),
  provider: z.string().default('mock')
});

export const orderSchema = z.object({
  quoteId: z.string(),
  paymentRef: z.string()
});

export const updateOrderStatusSchema = z.object({
  status: z.string(),
  note: z.string().optional()
});

export const purchaseAttemptSchema = z.object({
  note: z.string().optional()
});

export const shipmentSchema = z.object({
  orderId: z.string(),
  carrier: z.string(),
  trackingNumber: z.string()
});

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
