import { WebhookEntity } from '../lib/dynamo/index.js';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

export class WebhookService {
  /**
   * Register a new webhook subscription.
   */
  static async registerWebhook(projectId: string, createdBy: string, url: string, events: string[]) {
    const secret = crypto.randomBytes(32).toString('hex');
    const webhookId = nanoid();

    const result = await WebhookEntity.create({
      webhookId,
      projectId,
      url,
      events,
      secret,
      createdBy,
      isActive: true,
    }).go();

    return { webhook: result.data, secret };
  }

  /**
   * List webhooks for a project.
   */
  static async listWebhooks(projectId: string) {
    const result = await WebhookEntity.query.byProject({ projectId }).go();
    // Exclude secret from response
    return result.data.map(({ secret: _s, ...rest }) => rest);
  }

  /**
   * Delete a webhook.
   */
  static async deleteWebhook(projectId: string, webhookId: string) {
    await WebhookEntity.delete({ projectId, webhookId }).go();
  }

  /**
   * Trigger an event - finds matching webhooks and delivers.
   */
  static async triggerEvent(event: string, payload: unknown, projectId: string) {
    const result = await WebhookEntity.query.byProject({ projectId }).go();
    const webhooks = result.data.filter((wh) => wh.isActive && (wh.events ?? []).includes(event));

    for (const webhook of webhooks) {
      this.deliverWebhook(webhook, event, payload).catch((err) =>
        console.error(`Webhook delivery failed: ${webhook.webhookId}`, err),
      );
    }
  }

  /**
   * Deliver a webhook with HMAC signature.
   */
  private static async deliverWebhook(
    webhook: { webhookId: string; url: string; secret?: string },
    event: string,
    payload: unknown,
  ) {
    const body = JSON.stringify(payload);
    const signature =
      'sha256=' +
      crypto.createHmac('sha256', webhook.secret ?? '').update(body).digest('hex');

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-Event': event,
      },
      body,
    });

    if (!response.ok) {
      console.warn(`Webhook delivery failed (${response.status}): ${webhook.webhookId}`);
    }
  }
}
