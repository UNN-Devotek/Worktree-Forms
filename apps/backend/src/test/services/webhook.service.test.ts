import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'wh-nanoid-001') }));

vi.mock('../../lib/dynamo/index.js', () => ({
  WebhookEntity: {
    create: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    query: {
      byProject: vi.fn(),
    },
  },
}));

import { WebhookService } from '../../services/webhook.service.js';
import { WebhookEntity } from '../../lib/dynamo/index.js';

const mockWebhook = WebhookEntity as {
  create: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  query: { byProject: ReturnType<typeof vi.fn> };
};

describe('WebhookService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('registerWebhook', () => {
    it('[P0] creates a webhook and returns raw secret with active status', async () => {
      const fakeRecord = {
        webhookId: 'wh-nanoid-001',
        projectId: 'proj-1',
        url: 'https://example.com/hook',
        isActive: true,
      };
      mockWebhook.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: fakeRecord }) });

      const { rawKey: _rk, webhook, secret } = await WebhookService.registerWebhook(
        'proj-1', 'user-1', 'https://example.com/hook', ['form.submitted']
      ) as { rawKey?: string; webhook: unknown; secret: string };

      expect(webhook).toEqual(fakeRecord);
      // Secret is a 64-char hex string (32 random bytes)
      expect(secret).toMatch(/^[a-f0-9]{64}$/);

      const createArg = mockWebhook.create.mock.calls[0][0];
      expect(createArg.url).toBe('https://example.com/hook');
      expect(createArg.events).toEqual(['form.submitted']);
      expect(createArg.isActive).toBe(true);
      // Secret stored in DB should match what was returned
      expect(createArg.secret).toBe(secret);
    });

    it('[P1] two registrations produce different secrets', async () => {
      mockWebhook.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      const r1 = await WebhookService.registerWebhook('p1', 'u1', 'https://a.com', []);
      const r2 = await WebhookService.registerWebhook('p1', 'u1', 'https://b.com', []);

      expect((r1 as { secret: string }).secret).not.toBe((r2 as { secret: string }).secret);
    });
  });

  describe('listWebhooks', () => {
    it('[P0] excludes secret field from returned webhooks', async () => {
      const records = [
        { webhookId: 'w1', url: 'https://a.com', secret: 'mysecret', isActive: true },
        { webhookId: 'w2', url: 'https://b.com', secret: 'anothersecret', isActive: false },
      ];
      mockWebhook.query.byProject.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: records }),
      });

      const result = await WebhookService.listWebhooks('proj-1');

      expect(result).toHaveLength(2);
      result.forEach((wh) => {
        expect('secret' in wh).toBe(false);
        expect('webhookId' in wh).toBe(true);
      });
    });
  });

  describe('deleteWebhook', () => {
    it('[P0] calls delete with correct projectId and webhookId', async () => {
      mockWebhook.delete.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });

      await WebhookService.deleteWebhook('proj-1', 'wh-abc');

      expect(mockWebhook.delete).toHaveBeenCalledWith({ projectId: 'proj-1', webhookId: 'wh-abc' });
    });
  });

  describe('triggerEvent', () => {
    it('[P0] delivers only to active webhooks subscribed to the event', async () => {
      const webhooks = [
        { webhookId: 'w1', url: 'https://active.com/hook', secret: 'sec1', isActive: true, events: ['form.submitted'] },
        { webhookId: 'w2', url: 'https://inactive.com/hook', secret: 'sec2', isActive: false, events: ['form.submitted'] },
        { webhookId: 'w3', url: 'https://other.com/hook', secret: 'sec3', isActive: true, events: ['task.created'] },
      ];
      mockWebhook.query.byProject.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: webhooks }),
      });

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response(null, { status: 200 }) as Response
      );

      await WebhookService.triggerEvent('form.submitted', { formId: 'f1' }, 'proj-1');

      // Allow fire-and-forget to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Only w1 is active AND subscribed to 'form.submitted'
      expect(fetchSpy).toHaveBeenCalledOnce();
      expect(fetchSpy.mock.calls[0][0]).toBe('https://active.com/hook');

      fetchSpy.mockRestore();
    });

    it('[P1] delivered request includes HMAC signature and event header', async () => {
      const secret = 'test-secret';
      const webhooks = [
        { webhookId: 'w1', url: 'https://example.com/hook', secret, isActive: true, events: ['task.created'] },
      ];
      mockWebhook.query.byProject.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: webhooks }),
      });

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response(null, { status: 200 }) as Response
      );

      const payload = { taskId: 't1', title: 'New task' };
      await WebhookService.triggerEvent('task.created', payload, 'proj-1');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;

      expect(headers['X-Event']).toBe('task.created');
      expect(headers['Content-Type']).toBe('application/json');

      // Verify HMAC
      const body = JSON.stringify(payload);
      const expectedSig = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
      expect(headers['X-Signature']).toBe(expectedSig);

      fetchSpy.mockRestore();
    });
  });
});
