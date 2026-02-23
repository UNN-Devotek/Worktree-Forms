import { Router, Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service.js';
import { EmailIngestionService } from '../services/email-ingestion.service.js';

const router = Router();

// ============================================
// Webhook Management Routes (Outbound)
// ============================================

// Register Webhook (Auth Required)
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { url, events, projectId } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Missing url or events array' });
    }

    const { webhook, secret } = await WebhookService.registerWebhook(userId, url, events, projectId);

    res.json({
      success: true,
      webhook: {
        id: webhook.id,
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
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const projectId = req.query.projectId as string | undefined;

    const webhooks = await WebhookService.listWebhooks(userId, projectId);
    res.json(webhooks);
  } catch (error) {
    console.error('Webhook List Error:', error);
    res.status(500).json({ error: 'Failed to list webhooks' });
  }
});

// Delete Webhook (Auth Required)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await WebhookService.deleteWebhook(id, userId);
    res.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    console.error('Webhook Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// ============================================
// Inbound Webhooks
// ============================================

// Email Ingestion Webhook (Simulated)
router.post('/inbound-email', async (req: Request, res: Response) => {
    try {
      const { from, subject, text } = req.body;
      
      if (!from || !subject) {
          return res.status(400).json({ error: 'Missing from or subject' });
      }
  
      const result = await EmailIngestionService.processInboundEmail({ from, subject, text: text || '' });
      res.json(result);
  
    } catch (error) {
      console.error('Email Webhook Error:', error);
      res.status(500).json({ error: 'Failed to process email' });
    }
  });

export default router;
