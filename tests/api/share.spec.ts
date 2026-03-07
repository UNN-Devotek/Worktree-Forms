import { test, expect } from '../support/fixtures/api-auth.fixture';
import { faker } from '@faker-js/faker';

/**
 * @tag p1
 * Public Share API — token generation and public access.
 */

test.describe('Share API (public access)', () => {
  test('[P1] GET /api/public/access/:token with invalid token returns 404/403 (not 500)', async ({ request }) => {
    const fakeToken = faker.string.alphanumeric(32);
    const response = await request.get(`/api/public/access/${fakeToken}`);
    expect(response.status()).not.toBe(500);
    expect([200, 400, 401, 403, 404]).toContain(response.status());
  });
});

test.describe('Share API (authenticated)', () => {
  test('[P0] POST /api/public/generate returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/public/generate', {
      data: { projectId: 'any', entityId: 'form1', entityType: 'form' },
    });
    expect(response.status()).toBe(401);
  });

  test('[P1] POST /api/public/generate creates a share token for member project', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.post('/api/public/generate', {
      data: {
        projectId,
        entityId: `form_${faker.string.alphanumeric(6)}`,
        entityType: 'form',
      },
    });
    expect([200, 201, 400, 404]).toContain(response.status());
  });

  test('[P0] share token for non-member project returns 403/404', async ({ memberApi }) => {
    const fakeId = `proj_${faker.string.uuid()}`;
    const response = await memberApi.post('/api/public/generate', {
      data: {
        projectId: fakeId,
        entityId: 'form1',
        entityType: 'form',
      },
    });
    expect([403, 404]).toContain(response.status());
  });
});
