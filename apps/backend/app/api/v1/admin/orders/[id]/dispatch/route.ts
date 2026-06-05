import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail } from '../../../../../../../lib/response';
import { parseBody } from '../../../../../../../lib/parse';
import { prisma } from '../../../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../../../lib/events';
import { requireAdmin } from '../../../../../../../lib/auth';
import { sendMail } from '../../../../../../../lib/mailer';
import { shipmentDispatchedEmail } from '../../../../../../../lib/emails';

const dispatchSchema = z.object({
  carrier: z.string().min(1),
  trackingNumber: z.string().min(1)
});

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { data, error } = await parseBody(request, dispatchSchema);
  if (error) return error;

  if (!data.carrier || !data.trackingNumber) {
    return fail('MISSING_FIELDS', 'carrier and trackingNumber are required', 400);
  }

  const order = await prisma.order.findUnique({
    where: { id: context.params.id },
    include: { user: { select: { email: true, name: true } } }
  });
  if (!order) return fail('NOT_FOUND', 'Order not found', 404);

  const shipment = await prisma.shipment.create({
    data: {
      orderId: order.id,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      status: 'IN_TRANSIT'
    }
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'SHIPPED' }
  });

  if (order.user?.email) {
    const mail = shipmentDispatchedEmail(order.user.name ?? '', order.id, data.carrier, data.trackingNumber);
    await sendMail({ to: order.user.email, ...mail });
  }

  await createOrderEvent(order.id, 'DISPATCHED', `Dispatched via ${data.carrier} (${data.trackingNumber})`);

  return ok({ shipment });
}
