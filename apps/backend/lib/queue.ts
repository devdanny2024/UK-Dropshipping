import { Queue } from 'bullmq';

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

let queues:
  | {
      resolveProductQueue: Queue;
      purchaseAttemptQueue: Queue;
      trackShipmentQueue: Queue;
    }
  | null = null;

export function getQueues() {
  if (!queues) {
    const connection = getRedisConnection();
    queues = {
      resolveProductQueue: new Queue('resolveProduct', { connection }),
      purchaseAttemptQueue: new Queue('purchaseAttempt', { connection }),
      trackShipmentQueue: new Queue('trackShipment', { connection })
    };
  }
  return queues;
}
