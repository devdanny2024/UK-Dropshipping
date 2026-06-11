import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '../../../../../../../lib/response';
import { parseBody } from '../../../../../../../lib/parse';
import { prisma } from '../../../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../../../lib/events';
import { requireAdmin } from '../../../../../../../lib/auth';
import { sendMail } from '../../../../../../../lib/mailer';
import { weightPriceResolvedEmail } from '../../../../../../../lib/emails';

const resolveSchema = z.object({
  resolvedPrice: z.number(),
  currency: z.string()
});

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, resolveSchema);
  if (error) return error;

  const existing = await prisma.weightPriceRequest.findUnique({
    where: { id: context.params.id }
  });
  if (!existing) return fail('NOT_FOUND', 'Weight price request not found', 404);

  const wpr = await prisma.weightPriceRequest.update({
    where: { id: existing.id },
    data: {
      status: 'PRICED',
      resolvedPrice: data.resolvedPrice,
      currency: data.currency,
      resolvedAt: new Date()
    }
  });

  if (existing.orderItemId) {
    await prisma.orderItem.update({
      where: { id: existing.orderItemId },
      data: {
        weightStatus: 'PRICED',
        manualDeliveryPrice: data.resolvedPrice,
        manualPriceCurrency: data.currency
      }
    });
  }

  const order = await prisma.order.findUnique({
    where: { id: existing.orderId },
    include: { user: { select: { email: true, name: true } } }
  });

  if (order?.user?.email) {
    const mail = weightPriceResolvedEmail(order.user.name ?? '', existing.orderId);
    await sendMail({ to: order.user.email, ...mail });
  }

  await createOrderEvent(
    existing.orderId,
    'WEIGHT_PRICE_RESOLVED',
    `Manual weight price set: ${data.currency} ${data.resolvedPrice}`
  );

  return ok({ request: wpr });
}
