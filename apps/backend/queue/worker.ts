import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379');

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
