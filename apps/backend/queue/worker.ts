import { Worker } from 'bullmq';

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
    console.log('Resolving product', job.data);
    return { ok: true };
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
