import { prisma } from './prisma';

export async function createOrderEvent(orderId: string, type: string, message: string) {
  return prisma.orderEvent.create({
    data: {
      orderId,
      type,
      message
    }
  });
}
