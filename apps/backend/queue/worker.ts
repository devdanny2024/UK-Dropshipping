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
      // Leave the original snapshot data in place so the client still has a record.
      return { ok: false, error: (error as Error).message };
    }
  },
  { connection }
);

new Worker(
  'purchaseAttempt',
  async (job) => {
    console.log('Purchase attempt', job.data);
    return { ok: true };
  },
  { connection }
);

new Worker(
  'trackShipment',
  async (job) => {
    console.log('Track shipment', job.data);
    return { ok: true };
  },
  { connection }
);

console.log('Queue workers running');
