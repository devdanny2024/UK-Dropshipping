import { prisma } from './prisma';

/**
 * M3 R9 — a no-weight item is one whose weight resolved via the absolute
 * fallback (no real weight data) OR whose category is flagged as requiring a
 * manual weight class. Either condition triggers a manual weight-price request.
 */
export function isNoWeight(source: string, requiresManualWeight: boolean): boolean {
  return source === 'fallback' || requiresManualWeight;
}

/**
 * M3 R9 — true when any item on the order is still awaiting a manual weight
 * price (weightStatus === 'REQUESTED'). Used to block invoicing/payment until
 * every manual weight has been resolved.
 */
export async function orderHasUnresolvedWeight(orderId: string): Promise<boolean> {
  const pending = await prisma.orderItem.count({
    where: { orderId, weightStatus: 'REQUESTED' }
  });
  return pending > 0;
}
