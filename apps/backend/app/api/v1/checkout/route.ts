import type { NextRequest } from 'next/server';
import { ok, fail } from '../../../../lib/response';
import { parseBody } from '../../../../lib/parse';
import { checkoutSchema } from '../../../../lib/schemas';
import { getClientSession } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { createOrderEvent } from '../../../../lib/events';
import { sendMail } from '../../../../lib/mailer';
import { orderReceivedEmail, adminOrderPlacedEmail, weightPriceRequestedAdminEmail } from '../../../../lib/emails';
import { estimateDelivery } from '../../../../lib/delivery-engine';
import { getDeliveryConfig } from '../../../../lib/settings';
import { resolveChargeableWeight } from '../../../../lib/weight';
import { isNoWeight } from '../../../../lib/weight-request';
import { Prisma } from '@prisma/client';

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

  const doorFee = await getDeliveryFee(data.deliveryType ?? 'door');

  // Region drives the order currency (UK → GBP, US → USD). Derived server-side,
  // never trusted from the client. Item `priceGBP` already holds the price in
  // the basket's region currency (kept under that field name for compatibility).
  const region = data.region;
  const currency = region === 'US' ? 'USD' : 'GBP';

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
      country: data.address.country ?? 'Nigeria',
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
          currency,
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
      region,
      currency,
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

  // M2 R8 — snapshot a delivery estimate on the order so the customer sees a
  // Delivery Note before payment. Best-effort: a failure here must never block
  // an order from being placed.
  try {
    const deliveryConfig = await getDeliveryConfig();
    const estimate = estimateDelivery({
      placedAt: order.createdAt,
      region: order.region,
      leg1Speed: 'STD',
      leg2Speed: 'STD',
      config: deliveryConfig,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: {
        leg1Speed: estimate.leg1Speed,
        leg2Speed: estimate.leg2Speed,
        despatchDate: estimate.despatchDate,
        estDeliveryMin: estimate.deliveryMin,
        estDeliveryMax: estimate.deliveryMax,
        deliveryQuotedAt: new Date(),
        deliveryNote: {
          legs: estimate.legs,
          notices: estimate.notices,
          leg1Speed: estimate.leg1Speed,
          leg2Speed: estimate.leg2Speed,
          expressAvailable: estimate.expressAvailable,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error('Delivery estimate failed for order', order.id, err);
  }

  // M3 R9 — auto-detect items we cannot price by weight (no client-supplied
  // weight, no matching category, or a category flagged for manual weight) and
  // convert them into manual weight-price requests instead of silently
  // mis-pricing with the 500g fallback. Best-effort: a failure here must never
  // block an order — such items simply stay AUTO and the customer can still use
  // the manual "Request Weight Price" button.
  try {
    const createdItems = await prisma.orderItem.findMany({ where: { orderId: order.id } });
    const inputBySnapshot = new Map(snapshots.map((snap, i) => [snap.id, data.items[i]]));
    const weightRequests: { productUrl: string; category?: string }[] = [];

    for (const item of createdItems) {
      const input = inputBySnapshot.get(item.productSnapshotId);
      if (!input) continue;

      // A client-supplied weight means we can price the item automatically.
      if (typeof input.weightKg === 'number' && input.weightKg > 0) continue;

      let source = 'fallback';
      let requiresManualWeight = false;
      if (input.categoryName) {
        const category = await prisma.category.findFirst({
          where: { name: { equals: input.categoryName, mode: 'insensitive' } },
          select: { id: true, requiresManualWeight: true },
        });
        if (category) {
          requiresManualWeight = category.requiresManualWeight;
          const resolved = await resolveChargeableWeight(null, category.id, input.name);
          source = resolved.source;
        }
      }

      if (!isNoWeight(source, requiresManualWeight)) continue;

      const snap = snapshots.find((s) => s.id === item.productSnapshotId);
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { weightStatus: 'REQUESTED' },
      });
      await prisma.weightPriceRequest.create({
        data: {
          orderId: order.id,
          orderItemId: item.id,
          productUrl: snap?.url ?? '',
          category: input.categoryName ?? null,
          status: 'REQUESTED',
          requestedById: session.userId,
        },
      });
      weightRequests.push({ productUrl: snap?.url ?? '', category: input.categoryName ?? undefined });
    }

    if (weightRequests.length > 0) {
      const adminTo =
        process.env.ADMIN_NOTIFY_EMAIL ?? process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '';
      if (adminTo) {
        const mail = weightPriceRequestedAdminEmail(order.id, weightRequests);
        await sendMail({ to: adminTo, ...mail });
      }
      await createOrderEvent(
        order.id,
        'WEIGHT_PRICE_REQUESTED',
        `Auto weight price requested for ${weightRequests.length} item(s)`
      );
    }
  } catch (err) {
    console.error('Weight-price auto-detection failed for order', order.id, err);
  }

  await createOrderEvent(order.id, 'ORDER', `Order created — ${data.deliveryType === 'door' ? 'door delivery' : 'pickup'}`);
  if (data.notes) {
    await createOrderEvent(order.id, 'NOTE', data.notes);
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (user?.email) {
    const mail = orderReceivedEmail(user.name ?? '', order.id, order.total, order.currency);
    await sendMail({ to: user.email, ...mail });
  }

  const adminRecipient = process.env.ADMIN_NOTIFY_EMAIL ?? process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '';
  if (adminRecipient) {
    const productLinks = snapshots.map((snap) => snap.url);
    const adminMail = adminOrderPlacedEmail(order.id, order.region, productLinks);
    await sendMail({ to: adminRecipient, ...adminMail });
  }

  return ok({
    orderId: order.id,
    total: order.total,
    currency: order.currency,
    deliveryType: data.deliveryType,
    deliveryFee: doorFee,
  });
}
