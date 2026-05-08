import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../../lib/response';
import { parseBody } from '../../../../../lib/parse';
import { shipmentSchema } from '../../../../../lib/schemas';
import { prisma } from '../../../../../lib/prisma';
import { createOrderEvent } from '../../../../../lib/events';
import { getQueues } from '../../../../../lib/queue';
import { requireAdmin } from '../../../../../lib/auth';
import { sendMail } from '../../../../../lib/mailer';
import { shipmentDispatchedEmail } from '../../../../../lib/emails';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const shipments = await prisma.shipment.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return ok(
    shipments.map((s: (typeof shipments)[number]) => ({
      id: s.id,
      orderId: s.orderId,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      status: s.status,
      createdAt: s.createdAt.toISOString()
    }))
  );
}

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const { data, error } = await parseBody(request, shipmentSchema);
  if (error) return error;

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { user: { select: { email: true, name: true } } }
  });
  if (!order) {
    return fail('NOT_FOUND', 'Order not found', 404);
  }

  const shipment = await prisma.shipment.create({
    data: {
      orderId: data.orderId,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      status: 'CREATED'
    }
  });

  const { trackShipmentQueue } = getQueues();
  await trackShipmentQueue.add('trackShipment', {
    orderId: data.orderId,
    shipmentId: shipment.id
  });

  await createOrderEvent(data.orderId, 'SHIPMENT', `Shipment created: ${shipment.trackingNumber}`);

  if (order.user?.email) {
    const mail = shipmentDispatchedEmail(order.user.name ?? '', data.orderId, data.carrier, data.trackingNumber);
    await sendMail({ to: order.user.email, ...mail });
  }

  return ok({ id: shipment.id, status: shipment.status });
}
