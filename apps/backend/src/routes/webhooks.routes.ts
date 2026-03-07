import { Router, Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { AuthenticatedRequest } from '../middleware/authenticate.js';
import { requireProjectAccess } from '../middleware/rbac.js';
import { WebhookService } from '../services/webhook.service.js';
import { EmailIngestionService } from '../services/email-ingestion.service.js';
import { isAllowedWebhookUrl } from '../utils/url-validator.js';
import { webhookInboundLimiter } from '../middleware/rateLimiter.js';

function sanitizeEmailField(value: unknown, maxLength: number): string {
  const str = String(value ?? '').slice(0, maxLength);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const router = Router();

// ============================================
// Webhook Management Routes (Outbound)
// ============================================

// Register Webhook (Auth Required)
router.post('/', requireProjectAccess('ADMIN'), async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { url, events, projectId } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Missing url or events array' });
    }

    if (!isAllowedWebhookUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook URL. Must be a publicly accessible HTTP(S) URL.'
      });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    // WebhookService.registerWebhook(projectId, createdBy, url, events)
    const { webhook, secret } = await WebhookService.registerWebhook(projectId, userId, url, events);

    res.json({
      success: true,
      webhook: {
        id: webhook.webhookId,
        url: webhook.url,
        events: webhook.events,
        createdAt: webhook.createdAt
      },
      secret // WARN: Only shown once
    });
  } catch (error) {
    console.error('Webhook Registration Error:', error);
    res.status(500).json({ error: 'Failed to register webhook' });
  }
});

// List Webhooks (Auth Required)
router.get('/', requireProjectAccess('ADMIN'), async (req: Request, res: Response) => {
  try {
    const projectId = req.query.projectId as string;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId query parameter required' });
    }

    const webhooks = await WebhookService.listWebhooks(projectId);
    res.json(webhooks);
  } catch (error) {
    console.error('Webhook List Error:', error);
    res.status(500).json({ error: 'Failed to list webhooks' });
  }
});

// Delete Webhook (Auth Required)
router.delete('/:webhookId', requireProjectAccess('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const projectId = req.query.projectId as string || req.body.projectId;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    await WebhookService.deleteWebhook(projectId, webhookId);
    res.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    console.error('Webhook Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// ============================================
// Inbound Webhooks
// ============================================

// Email Ingestion Webhook
router.post('/inbound-email', webhookInboundLimiter, async (req: Request, res: Response) => {
    try {
      // HMAC-SHA256 signature verification (when secret is configured)
      const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
      if (secret) {
        const signature = req.headers['x-webhook-signature'] as string | undefined;
        if (!signature) {
          return res.status(401).json({ error: 'Missing webhook signature' });
        }
        const payload = JSON.stringify(req.body);
        const expected = createHmac('sha256', secret).update(payload).digest('hex');
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          return res.status(401).json({ error: 'Invalid webhook signature' });
        }
      }

      const { from, subject, text } = req.body;

      if (!from || !subject) {
          return res.status(400).json({ error: 'Missing from or subject' });
      }

      const sanitized = {
        from: sanitizeEmailField(from, 255),
        subject: sanitizeEmailField(subject, 500),
        text: sanitizeEmailField(text, 50000),
      };

      const result = await EmailIngestionService.processInboundEmail({ from: sanitized.from, subject: sanitized.subject, text: sanitized.text });
      res.json(result);

    } catch (error) {
      console.error('Email Webhook Error:', error);
      res.status(500).json({ error: 'Failed to process email' });
    }
  });

export default router;
