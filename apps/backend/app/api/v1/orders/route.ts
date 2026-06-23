import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { orderSchema } from '../../../../lib/schemas';
import { prisma } from '../../../../lib/prisma';
import { createOrderEvent } from '../../../../lib/events';
import { getClientSession } from '../../../../lib/auth';
import { sendMail } from '../../../../lib/mailer';
import { orderReceivedEmail, adminOrderPlacedEmail } from '../../../../lib/emails';

export async function POST(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) {
    return fail('UNAUTHORIZED', 'Client session required', 401);
  }

  const { data, error } = await parseBody(request, orderSchema);
  if (error) return error;

  const quote = await prisma.quote.findUnique({
    where: { id: data.quoteId },
    include: { productSnapshot: true, address: true }
  });

  if (!quote) {
    return fail('NOT_FOUND', 'Quote not found', 404);
  }

  // IDOR guard — a quote may only be ordered by the user who created it.
  // Return 404 (not 403) so quote ids aren't enumerable across accounts.
  if (quote.userId && quote.userId !== session.userId) {
    return fail('NOT_FOUND', 'Quote not found', 404);
  }

  // Defense in depth — the snapshotted shipping address must belong to the
  // session user (an address with no owner is a shared/placeholder address).
  if (quote.address?.userId && quote.address.userId !== session.userId) {
    return fail('NOT_FOUND', 'Quote not found', 404);
  }

  const order = await prisma.order.create({
    data: {
      userId: session.userId,
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

  await createOrderEvent(order.id, 'ORDER', 'Order created');

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (user?.email) {
    const mail = orderReceivedEmail(user.name ?? '', order.id, order.total, order.currency);
    await sendMail({ to: user.email, ...mail });
  }

  const adminRecipient = process.env.ADMIN_NOTIFY_EMAIL ?? process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '';
  if (adminRecipient) {
    const productLinks = quote.productSnapshot?.url ? [quote.productSnapshot.url] : [];
    const adminMail = adminOrderPlacedEmail(order.id, order.region, productLinks);
    await sendMail({ to: adminRecipient, ...adminMail });
  }

  return ok({
    id: order.id,
    status: order.status,
    total: order.total,
    currency: order.currency,
    createdAt: order.createdAt.toISOString()
  });
}

export async function GET(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) {
    return fail('UNAUTHORIZED', 'Client session required', 401);
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: { productSnapshot: { select: { title: true, url: true, imageUrl: true } } }
      }
    }
  });

  return ok(
    orders.map((order: (typeof orders)[number]) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      productTitle: order.items[0]?.productSnapshot?.title ?? null,
      productUrl: order.items[0]?.productSnapshot?.url ?? null,
      productImage: order.items[0]?.productSnapshot?.imageUrl ?? null,
      items: order.items.map((item) => ({
        id: item.id,
        qty: item.qty,
        size: item.size,
        color: item.color,
        unitPrice: item.unitPrice,
        total: item.total,
        title: item.productSnapshot?.title ?? null,
        imageUrl: item.productSnapshot?.imageUrl ?? null,
        url: item.productSnapshot?.url ?? null,
      }))
    }))
  );
}
