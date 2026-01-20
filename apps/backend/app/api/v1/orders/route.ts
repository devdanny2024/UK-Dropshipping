import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { orderSchema } from '../../../../lib/schemas';
import { prisma } from '../../../../lib/prisma';
import { createOrderEvent } from '../../../../lib/events';

export async function POST(request: NextRequest) {
  const { data, error } = await parseBody(request, orderSchema);
  if (error) return error;

  const quote = await prisma.quote.findUnique({
    where: { id: data.quoteId },
    include: { productSnapshot: true }
  });

  if (!quote) {
    return fail('NOT_FOUND', 'Quote not found', 404);
  }

  const order = await prisma.order.create({
    data: {
      status: 'PLACED',
      currency: quote.currency,
      total: quote.total,
      addressId: quote.addressId,
      items: {
        create: {
          productSnapshotId: quote.productSnapshotId,
          qty: quote.qty,
          size: quote.size,
          color: quote.color,
          unitPrice: quote.subtotal / quote.qty,
          total: quote.subtotal
        }
      }
    },
    include: { items: true }
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      paymentRef: data.paymentRef,
      provider: 'mock',
      amount: order.total,
      currency: order.currency,
      status: 'CAPTURED',
      idempotencyKey: data.paymentRef
    }
  });

  await createOrderEvent(order.id, 'ORDER', 'Order created');

  return ok({
    id: order.id,
    status: order.status,
    total: order.total,
    currency: order.currency,
    createdAt: order.createdAt.toISOString()
  });
}

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return ok(
    orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      currency: order.currency,
      createdAt: order.createdAt.toISOString()
    }))
  );
}
