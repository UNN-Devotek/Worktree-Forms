
import { prisma } from '../db';
import crypto from 'crypto';

export class WebhookService {
  /**
   * Register a new webhook subscription.
   */
  static async registerWebhook(userId: string, url: string, events: string[], projectId?: string) {
    // Generate secret for HMAC signing
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        userId,
        url,
        events,
        secret,
        projectId,
      }
    });

    return { webhook, secret }; // Return secret once for user to store
  }

  /**
   * List webhooks for a user.
   */
  static async listWebhooks(userId: string, projectId?: string) {
    return prisma.webhook.findMany({
      where: {
        userId,
        ...(projectId && { projectId })
      },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
        projectId: true,
        // secret is excluded for security
      }
    });
  }

  /**
   * Delete a webhook.
   */
  static async deleteWebhook(webhookId: string, userId: string) {
    return prisma.webhook.deleteMany({
      where: { id: webhookId, userId } // Ensure ownership
    });
  }

  /**
   * Trigger an event - finds matching webhooks and queues deliveries.
   */
  static async triggerEvent(event: string, payload: any, projectId?: string) {
    console.log(`🔔 Triggering event: ${event} (projectId: ${projectId || 'global'})`);

    // Find active webhooks subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        events: { has: event },
        ...(projectId && { OR: [{ projectId }, { projectId: null }] }) // Match project-specific or global
      }
    });

    console.log(`📬 Found ${webhooks.length} webhook(s) for event: ${event}`);

    // Create delivery records
    for (const webhook of webhooks) {
      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          status: 'pending'
        }
      });

      // Trigger delivery asynchronously (fire & forget for MVP)
      this.deliverWebhook(delivery.id, webhook).catch(err => 
        console.error(`❌ Webhook delivery failed: ${delivery.id}`, err)
      );
    }
  }

  /**
   * Deliver a webhook with HMAC signature and retry logic.
   */
  static async deliverWebhook(deliveryId: string, webhook?: any) {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true }
    });

    if (!delivery) return;

    const wh = webhook || delivery.webhook;
    const maxAttempts = 3;

    if (delivery.attempts >= maxAttempts) {
      console.log(`⏭️ Max attempts reached for delivery: ${deliveryId}`);
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: { status: 'failed' }
      });
      return;
    }

    try {
      const body = JSON.stringify(delivery.payload);
      const signature = 'sha256=' + crypto
        .createHmac('sha256', wh.secret)
        .update(body)
        .digest('hex');

      console.log(`📤 Delivering webhook to: ${wh.url}`);

      const response = await fetch(wh.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
          'X-Event': delivery.event,
        },
        body,
      });

      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: response.ok ? 'success' : 'failed',
          attempts: delivery.attempts + 1,
          lastAttemptAt: new Date(),
          responseStatus: response.status
        }
      });

      if (!response.ok) {
        console.warn(`⚠️ Webhook delivery failed (${response.status}): ${deliveryId}`);
        // Retry with exponential backoff (simplified for MVP)
        if (delivery.attempts + 1 < maxAttempts) {
          const delay = Math.pow(2, delivery.attempts) * 1000; // 1s, 2s, 4s
          setTimeout(() => this.deliverWebhook(deliveryId), delay);
        }
      } else {
        console.log(`✅ Webhook delivered successfully: ${deliveryId}`);
      }

    } catch (error) {
      console.error(`❌ Webhook delivery error: ${deliveryId}`, error);
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'failed',
          attempts: delivery.attempts + 1,
          lastAttemptAt: new Date()
        }
      });

      // Retry
      if (delivery.attempts + 1 < maxAttempts) {
        const delay = Math.pow(2, delivery.attempts) * 1000;
        setTimeout(() => this.deliverWebhook(deliveryId), delay);
      }
    }
  }
}
