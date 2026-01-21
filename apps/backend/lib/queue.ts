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

const connection = getRedisConnection();

export const resolveProductQueue = new Queue('resolveProduct', { connection });
export const purchaseAttemptQueue = new Queue('purchaseAttempt', { connection });
export const trackShipmentQueue = new Queue('trackShipment', { connection });
