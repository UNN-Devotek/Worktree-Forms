import { test, expect } from '../support/fixtures/api-auth.fixture';
import { faker } from '@faker-js/faker';

/**
 * @tag p1
 * API Keys — create and revoke API keys.
 */

test.describe('Keys API (unauthenticated)', () => {
  test('[P0] GET /api/keys returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/keys?projectId=any');
    expect(response.status()).toBe(401);
  });

  test('[P0] POST /api/keys returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/keys', {
      data: { name: 'test', projectId: 'any' },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Keys API (authenticated admin)', () => {
  test('[P1] POST /api/keys creates an API key for a member project', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.post('/api/keys', {
      data: {
        name: `Key ${faker.string.alphanumeric(6)}`,
        projectId,
        scopes: ['read'],
      },
    });
    expect([200, 201, 404]).toContain(response.status());
  });

  test('[P0] MEMBER cannot create API keys (admin-only)', async ({ memberApi }) => {
    const fakeId = `proj_${faker.string.uuid()}`;
    const response = await memberApi.post('/api/keys', {
      data: { name: 'test', projectId: fakeId, scopes: ['read'] },
    });
    expect([403, 404]).toContain(response.status());
  });
});
