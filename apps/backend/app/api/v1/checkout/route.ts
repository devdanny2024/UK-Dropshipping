import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { checkoutSchema } from '../../../../lib/schemas';
import { getClientSession } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { createOrderEvent } from '../../../../lib/events';
import { sendMail } from '../../../../lib/mailer';
import { orderReceivedEmail } from '../../../../lib/emails';

async function getDeliveryFee(type: 'door' | 'pickup'): Promise<number> {
  const key = type === 'door' ? 'delivery_door_fee_gbp' : 'delivery_pickup_fee_gbp';
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  if (setting) return Number(setting.value) || 0;
  return type === 'door' ? 15 : 0;
}

export async function POST(request: NextRequest) {
  const session = await getClientSession(request);
  if (!session) return fail('UNAUTHORIZED', 'Please log in to checkout', 401);

  const { data, error } = await parseBody(request, checkoutSchema);
  if (error) return error;

  const doorFee = await getDeliveryFee(data.deliveryType);

  const itemsTotal = data.items.reduce((sum, item) => sum + item.priceGBP * item.quantity, 0);
  const total = itemsTotal + doorFee;

  const address = await prisma.address.create({
    data: {
      userId: session.userId,
      label: data.address.recipientName,
      line1: data.address.line1,
      line2: data.address.line2 ?? null,
      city: data.address.city,
      state: data.address.state ?? null,
      postalCode: data.address.postalCode ?? 'N/A',
      country: data.address.country,
      phone: data.address.phone,
      type: 'SHIPPING',
    }
  });

  const snapshots = await Promise.all(
    data.items.map((item) =>
      prisma.productSnapshot.create({
        data: {
          url: item.externalUrl ?? `https://uk2meonline.com/product/${item.productCode ?? item.name.replace(/\s+/g, '-').toLowerCase()}`,
          title: item.name,
          imageUrl: item.imageUrl ?? null,
          price: item.priceGBP,
          currency: 'GBP',
          raw: item as object,
        }
      })
    )
  );

  const order = await prisma.order.create({
    data: {
      userId: session.userId,
      addressId: address.id,
      status: 'PLACED',
      currency: 'GBP',
      total,
      items: {
        create: snapshots.map((snap, i) => ({
          productSnapshotId: snap.id,
          qty: data.items[i].quantity,
          size: 'N/A',
          color: 'N/A',
          unitPrice: data.items[i].priceGBP,
          total: data.items[i].priceGBP * data.items[i].quantity,
        }))
      }
    }
  });

  await createOrderEvent(order.id, 'ORDER', `Order created — ${data.deliveryType === 'door' ? 'door delivery' : 'pickup'}`);
  if (data.notes) {
    await createOrderEvent(order.id, 'NOTE', data.notes);
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (user?.email) {
    const mail = orderReceivedEmail(user.name ?? '', order.id, order.total, order.currency);
    await sendMail({ to: user.email, ...mail });
  }

  return ok({
    orderId: order.id,
    total: order.total,
    currency: order.currency,
    deliveryType: data.deliveryType,
    deliveryFee: doorFee,
  });
}
