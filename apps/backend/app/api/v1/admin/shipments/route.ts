import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { shipmentSchema } from '../../../../lib/schemas';
import { prisma } from '../../../../lib/prisma';
import { createOrderEvent } from '../../../../lib/events';
import { trackShipmentQueue } from '../../../../lib/queue';
import { requireAdmin } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const { data, error } = await parseBody(request, shipmentSchema);
  if (error) return error;

  const order = await prisma.order.findUnique({ where: { id: data.orderId } });
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

  await trackShipmentQueue.add('trackShipment', {
    orderId: data.orderId,
    shipmentId: shipment.id
  });

  await createOrderEvent(data.orderId, 'SHIPMENT', `Shipment created: ${shipment.trackingNumber}`);

  return ok({ id: shipment.id, status: shipment.status });
}
