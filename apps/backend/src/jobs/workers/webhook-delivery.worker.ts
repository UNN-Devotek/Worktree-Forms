import { Worker } from 'bullmq';
import { prisma } from '../../db.js';
import crypto from 'crypto';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

new Worker('webhooks', async (job) => {
  const { webhookId, event, payload } = job.data;
  const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook?.isActive) return;

  const body = JSON.stringify(payload);
  const sig = 'sha256=' + crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');

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

  await prisma.webhookDelivery.create({
    data: {
      webhookId,
      event,
      payload,
      status: response.ok ? 'success' : 'failed',
      attempts: (job.attemptsMade ?? 0) + 1,
      responseStatus: response.status,
      lastAttemptAt: new Date(),
    },
  });

  if (!response.ok) {
    throw new Error(`Delivery failed: HTTP ${response.status}`);
  }
}, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
  },
});
