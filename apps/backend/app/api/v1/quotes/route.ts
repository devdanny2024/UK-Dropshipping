import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { quoteSchema } from '../../../../lib/schemas';
import { prisma } from '../../../../lib/prisma';
import { getClientSession } from '../../../../lib/auth';
import { getPlatformFeePercent } from '../../../../lib/settings';

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

  const subtotal = snapshot.price * data.qty;
  const shipping = 9.5;
  const tax = subtotal * 0.06;
  const platformFeePercent = await getPlatformFeePercent();
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
      currency: snapshot.currency
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
    createdAt: quote.createdAt.toISOString()
  });
}
