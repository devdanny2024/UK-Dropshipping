import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379');

export const resolveProductQueue = new Queue('resolveProduct', { connection });
export const purchaseAttemptQueue = new Queue('purchaseAttempt', { connection });
export const trackShipmentQueue = new Queue('trackShipment', { connection });
