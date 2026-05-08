import { Worker } from 'bullmq';
import { prisma } from '../lib/prisma';
import { resolveProductFromUrl } from '../lib/adapters';

function getRedisConnection() {
  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');
  const connection = {
    host: url.hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined
  } as const;
  if (url.protocol === 'rediss:') {
    return { ...connection, tls: {} };
  }
  return connection;
}

const connection = getRedisConnection();

new Worker(
  'resolveProduct',
  async (job) => {
    const { snapshotId, url } = job.data as { snapshotId: string; url: string };

    try {
      const resolved = await resolveProductFromUrl(url);

      await prisma.productSnapshot.update({
        where: { id: snapshotId },
        data: {
          title: resolved.title,
          imageUrl: resolved.imageUrl ?? undefined,
          price: resolved.price ?? 0,
          currency: resolved.currency ?? 'GBP',
          raw: resolved.raw as any
        }
      });

      console.log('Resolved product snapshot', { snapshotId, url });
      return { ok: true };
    } catch (error) {
      console.error('Failed to resolve product', { snapshotId, url, error });
      return { ok: false, error: (error as Error).message };
    }
  },
  { connection }
);

new Worker(
  'purchaseAttempt',
  async (job) => {
    const { orderId, attemptId } = job.data as { orderId: string; attemptId: string };

    try {
      await prisma.purchaseAttempt.update({
        where: { id: attemptId },
        data: { status: 'RUNNING' }
      });

      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'AWAITING_PURCHASE' }
      });

      // Placeholder: real purchase automation goes here.
      // For now, mark queued so admin can handle manually.
      console.log('Purchase attempt running — awaiting manual purchase', { orderId, attemptId });

      return { ok: true };
    } catch (error) {
      console.error('Purchase attempt failed', { orderId, attemptId, error });
      await prisma.purchaseAttempt.update({
        where: { id: attemptId },
        data: { status: 'FAILED' }
      }).catch(() => undefined);
      throw error;
    }
  },
  { connection }
);

new Worker(
  'trackShipment',
  async (job) => {
    const { orderId, shipmentId } = job.data as { orderId: string; shipmentId: string };

    try {
      // Placeholder: real carrier API polling goes here.
      console.log('Tracking shipment', { orderId, shipmentId });
      return { ok: true };
    } catch (error) {
      console.error('Track shipment failed', { orderId, shipmentId, error });
      throw error;
    }
  },
  { connection }
);

console.log('Queue workers running');
