import { test, expect } from '../support/fixtures/api-auth.fixture';
import { faker } from '@faker-js/faker';

/**
 * @tag p1
 * Schedule API — route/stop scheduling endpoints.
 */

test.describe('Schedule API (unauthenticated)', () => {
  test('[P0] GET /api/schedule returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/schedule?projectId=any');
    expect(response.status()).toBe(401);
  });
});

test.describe('Schedule API (authenticated)', () => {
  test('[P1] GET schedule for a member project returns 200 or 404', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.get(`/api/schedule?projectId=${projectId}`);
    expect([200, 404]).toContain(response.status());
  });

  test('[P0] schedule for non-member project returns 403/404', async ({ memberApi }) => {
    const fakeId = `proj_${faker.string.uuid()}`;
    const response = await memberApi.get(`/api/schedule?projectId=${fakeId}`);
    expect([403, 404]).toContain(response.status());
  });
});
