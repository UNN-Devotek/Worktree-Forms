import { Queue } from 'bullmq';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const fileRenameQueue = new Queue('file-rename', { connection: redisConnection });
export const zipExportQueue = new Queue('zip-export', { connection: redisConnection });
export const webhookQueue = new Queue('webhooks', { connection: redisConnection });
