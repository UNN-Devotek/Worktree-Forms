import { Queue } from 'bullmq';

// Parse REDIS_URL (redis://host:port) or fall back to individual vars
const redisUrl = process.env.REDIS_URL;
const parsed = redisUrl ? new URL(redisUrl) : null;
const redisConnection = {
  host: parsed?.hostname || process.env.REDIS_HOST || 'redis',
  port: parsed ? parseInt(parsed.port || '6379') : parseInt(process.env.REDIS_PORT || '6379'),
};

export const fileRenameQueue = new Queue('file-rename', { connection: redisConnection });
export const zipExportQueue = new Queue('zip-export', { connection: redisConnection });
export const webhookQueue = new Queue('webhooks', { connection: redisConnection });
