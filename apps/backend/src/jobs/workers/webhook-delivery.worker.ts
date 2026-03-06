import { Worker } from 'bullmq';
import { WebhookEntity } from '../../lib/dynamo/index.js';
import crypto from 'crypto';

const _redisUrl = process.env.REDIS_URL;
const _parsed = _redisUrl ? new URL(_redisUrl) : null;
const connection = {
  host: _parsed?.hostname || process.env.REDIS_HOST || 'redis',
  port: _parsed ? parseInt(_parsed.port || '6379') : parseInt(process.env.REDIS_PORT || '6379'),
  ...(_parsed?.password ? { password: decodeURIComponent(_parsed.password) } : {}),
};

new Worker(
  'webhooks',
  async (job) => {
    const { projectId, webhookId, event, payload } = job.data;
    const result = await WebhookEntity.get({ projectId, webhookId }).go();
    const webhook = result.data;
    if (!webhook?.isActive) return;

    const body = JSON.stringify(payload);
    const sig = 'sha256=' + crypto.createHmac('sha256', webhook.secret ?? '').update(body).digest('hex');

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': sig,
        'X-Event': event,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Delivery failed: HTTP ${response.status}`);
    }
  },
  { connection },
);
