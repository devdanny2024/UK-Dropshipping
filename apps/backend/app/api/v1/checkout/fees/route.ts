import { ok } from '../../../../../lib/response';
import { prisma } from '../../../../../lib/prisma';

export async function GET() {
  const settings = await prisma.appSetting.findMany({
    where: { key: { in: ['delivery_door_fee_gbp', 'delivery_pickup_fee_gbp'] } }
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, Number(s.value)]));
  return ok({
    doorFee: map['delivery_door_fee_gbp'] ?? 15,
    pickupFee: map['delivery_pickup_fee_gbp'] ?? 0,
  });
}
