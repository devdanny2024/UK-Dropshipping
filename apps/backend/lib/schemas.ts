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

export const adapterUpdateSchema = z.object({
  enabled: z.boolean(),
  notes: z.string().max(300).optional()
});

export const paymentInitSchema = z.object({
  orderId: z.string(),
  txRef: z.string().optional(),
  redirectPath: z.string().optional()
});

export const platformFeeSchema = z.object({
  feePercent: z.number().min(0).max(100)
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PLACED',
    'PROCESSING',
    'AWAITING_PURCHASE',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ]),
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

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10)
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8)
});

export const resendVerificationSchema = z.object({
  email: z.string().email()
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(6).optional()
});

export const addressSchema = z.object({
  label: z.string().min(2).optional(),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().optional(),
  postalCode: z.string().min(2),
  country: z.string().min(2),
  phone: z.string().min(6).optional(),
  type: z.enum(['SHIPPING', 'BILLING']).default('SHIPPING'),
  isDefault: z.boolean().optional()
});

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  categoryId: z.string().min(5),
  description: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  productCode: z.string().optional(),
  externalUrl: z.string().url().optional(),
  priceGBP: z.number().optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  featuredOrder: z.number().int().optional()
});

export const cartItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().optional(),
  imageUrl: z.string().url().optional(),
  priceGBP: z.number().optional(),
  quantity: z.number().int().min(1),
  externalUrl: z.string().url().optional(),
  productCode: z.string().optional(),
  categoryName: z.string().optional()
});

export const quoteRequestSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  notes: z.string().optional(),
  customItems: z.array(
    z.object({
      name: z.string().min(2),
      url: z.string().url(),
      size: z.string().optional(),
      color: z.string().optional(),
      quantity: z.number().int().min(1)
    })
  ).optional()
});
