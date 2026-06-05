import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '../../../../../../lib/response';
import { parseBody } from '../../../../../../lib/parse';
import { prisma } from '../../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../../lib/events';
import { requireClient, getClientSession } from '../../../../../../lib/auth';
import { sendMail } from '../../../../../../lib/mailer';
import { weightPriceRequestedAdminEmail } from '../../../../../../lib/emails';

const bodySchema = z.object({
  orderItemIds: z.array(z.string()).optional()
});

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const authError = await requireClient(request);
  if (authError) return authError;

  const session = await getClientSession(request);
  if (!session) return fail('UNAUTHORIZED', 'Client session required', 401);

  const { data, error } = await parseBody(request, bodySchema);
  if (error) return error;

  const order = await prisma.order.findUnique({
    where: { id: context.params.id },
    include: { items: { include: { productSnapshot: true } } }
  });
  if (!order || order.userId !== session.userId) {
    return fail('NOT_FOUND', 'Order not found', 404);
  }

  // Select the items to request a manual weight price for. When specific item
  // ids are given, use those (restricted to this order); otherwise default to
  // every item that does not already have a manual weight price in flight.
  let items = order.items;
  if (data.orderItemIds && data.orderItemIds.length > 0) {
    const ids = new Set(data.orderItemIds);
    items = items.filter((i) => ids.has(i.id));
  } else {
    items = items.filter((i) => i.weightStatus === 'AUTO');
  }

  if (items.length === 0) {
    return fail('NO_ITEMS', 'No eligible items to request a weight price for', 400);
  }

  const requests = [];
  for (const item of items) {
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { weightStatus: 'REQUESTED' }
    });

    const wpr = await prisma.weightPriceRequest.create({
      data: {
        orderId: order.id,
        orderItemId: item.id,
        productUrl: item.productSnapshot.url,
        status: 'REQUESTED',
        requestedById: session.userId
      }
    });
    requests.push(wpr);
  }

  const adminTo =
    process.env.ADMIN_NOTIFY_EMAIL ?? process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '';
  if (adminTo) {
    const mail = weightPriceRequestedAdminEmail(
      order.id,
      requests.map((r) => ({ productUrl: r.productUrl, category: r.category ?? undefined }))
    );
    await sendMail({ to: adminTo, ...mail });
  }

  await createOrderEvent(order.id, 'WEIGHT_PRICE_REQUESTED', `Manual weight price requested for ${requests.length} item(s)`);

  return ok({ requests });
}
