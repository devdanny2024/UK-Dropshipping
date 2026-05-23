import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { quoteSchema } from '../../../../lib/schemas';
import { prisma } from '../../../../lib/prisma';
import { getClientSession } from '../../../../lib/auth';
import { getPlatformFeePercent, getShippingRatePerKgNgn } from '../../../../lib/settings';
import { resolveChargeableWeight, calcShippingCostNgn } from '../../../../lib/weight';

export async function POST(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) {
    return fail('UNAUTHORIZED', 'Client session required', 401);
  }

  const { data, error } = await parseBody(request, quoteSchema);
  if (error) return error;

  const snapshot = await prisma.productSnapshot.findUnique({
    where: { id: data.productSnapshotId }
  });

  if (!snapshot) {
    return fail('NOT_FOUND', 'Snapshot not found', 404);
  }

  await prisma.address.upsert({
    where: { id: data.addressId },
    update: {},
    create: {
      id: data.addressId,
      line1: 'Unknown',
      city: 'Unknown',
      postalCode: '00000',
      country: 'GB'
    }
  });

  const unitPrice = data.overridePrice ?? snapshot.price;
  const subtotal = unitPrice * data.qty;

  // Resolve weight-based shipping cost
  const [platformFeePercent, shippingRateNgn] = await Promise.all([
    getPlatformFeePercent(),
    getShippingRatePerKgNgn()
  ]);

  // Try to find the product that matches this snapshot URL
  const matchedProduct = await prisma.product.findFirst({
    where: { externalUrl: snapshot.url },
    select: { id: true, categoryId: true, chargeableWeightGrams: true, category: true }
  });

  let chargeableWeightGrams: number | null = null;
  let itemWeightGrams: number | null = null;
  let weightSource = 'default';

  if (matchedProduct) {
    const resolved = await resolveChargeableWeight(
      matchedProduct.id,
      matchedProduct.categoryId,
      snapshot.title
    );
    chargeableWeightGrams = resolved.chargeableWeightGrams;
    itemWeightGrams = resolved.actualWeightGrams;
    weightSource = resolved.source;
  }

  // shipping: weight-based if we resolved a weight, else flat £9.50
  let shipping: number;
  if (chargeableWeightGrams !== null) {
    shipping = calcShippingCostNgn(chargeableWeightGrams * data.qty, shippingRateNgn);
  } else {
    shipping = 9.5;
  }

  const tax = subtotal * 0.06;
  const platformFee = subtotal * (platformFeePercent / 100);
  const total = subtotal + shipping + tax + platformFee;

  const quote = await prisma.quote.create({
    data: {
      productSnapshotId: data.productSnapshotId,
      addressId: data.addressId,
      size: data.size,
      color: data.color,
      qty: data.qty,
      subtotal,
      shipping,
      tax,
      total,
      currency: snapshot.currency,
      itemWeightGrams: itemWeightGrams ?? undefined,
      chargeableWeightGrams: chargeableWeightGrams ?? undefined
    }
  });

  return ok({
    id: quote.id,
    productSnapshotId: quote.productSnapshotId,
    size: quote.size,
    color: quote.color,
    qty: quote.qty,
    subtotal: quote.subtotal,
    shipping: quote.shipping,
    tax: quote.tax,
    platformFee,
    platformFeePercent,
    total: quote.total,
    currency: quote.currency,
    chargeableWeightGrams: quote.chargeableWeightGrams,
    itemWeightGrams: quote.itemWeightGrams,
    weightSource,
    shippingRatePerKgNgn: shippingRateNgn,
    createdAt: quote.createdAt.toISOString()
  });
}
