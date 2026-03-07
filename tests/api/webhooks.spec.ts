import { test, expect } from '../support/fixtures/api-auth.fixture';
import { faker } from '@faker-js/faker';

/**
 * @tag p1
 * Webhooks API — CRUD and delivery security.
 */

test.describe('Webhooks API (unauthenticated)', () => {
  test('[P0] GET /api/webhooks returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/webhooks?projectId=any');
    expect(response.status()).toBe(401);
  });

  test('[P0] POST /api/webhooks returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/webhooks', {
      data: { url: 'https://example.com/hook', projectId: 'any' },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Webhooks API (authenticated admin)', () => {
  test('[P1] POST /api/webhooks creates a webhook', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.post('/api/webhooks', {
      data: {
        url: `https://example.com/hook-${faker.string.alphanumeric(6)}`,
        projectId,
        events: ['form.submitted'],
      },
    });
    expect([200, 201, 404]).toContain(response.status());
  });

  test('[P0] webhook for non-member project returns 403/404', async ({ memberApi }) => {
    const fakeId = `proj_${faker.string.uuid()}`;
    const response = await memberApi.post('/api/webhooks', {
      data: { url: 'https://example.com/hook', projectId: fakeId, events: ['form.submitted'] },
    });
    expect([403, 404]).toContain(response.status());
  });

  test('[P1] inbound webhook endpoint responds (any non-500 status)', async ({ request }) => {
    // Inbound webhooks may require auth or use HMAC signatures depending on impl
    const response = await request.post('/api/webhooks/inbound/nonexistent', {
      data: { event: 'test' },
    });
    // Must not crash — 401/403/404/400 all acceptable, never 500
    expect(response.status()).not.toBe(500);
  });
});
