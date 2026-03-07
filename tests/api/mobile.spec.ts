import { test, expect } from '../support/fixtures/api-auth.fixture';
import { faker } from '@faker-js/faker';

/**
 * @tag p1
 * Mobile / Field-Ops API — routes and stops for field workers.
 */

test.describe('Mobile API (unauthenticated)', () => {
  test('[P0] GET /api/projects/:id/routes/my-daily returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/projects/any/routes/my-daily');
    expect(response.status()).toBe(401);
  });

  test('[P0] GET /api/routes/:routeId/stops/:stopId returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/routes/r1/stops/s1');
    expect(response.status()).toBe(401);
  });
});

test.describe('Mobile API (authenticated)', () => {
  test('[P1] GET my-daily route for member project returns 200 or 404', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.get(`/api/projects/${projectId}/routes/my-daily`);
    expect([200, 404]).toContain(response.status());
  });

  test('[P0] my-daily route for non-member project returns 403/404', async ({ memberApi }) => {
    const fakeId = `proj_${faker.string.uuid()}`;
    const response = await memberApi.get(`/api/projects/${fakeId}/routes/my-daily`);
    expect([403, 404]).toContain(response.status());
  });

  test('[P1] GET stop detail for nonexistent route returns 404 (not 500)', async ({ adminApi }) => {
    const response = await adminApi.get(`/api/routes/nonexistent/stops/nonexistent`);
    expect(response.status()).not.toBe(500);
    expect([404, 403]).toContain(response.status());
  });

  test('[P0] PATCH stop status requires auth', async ({ request }) => {
    const response = await request.patch('/api/routes/r1/stops/s1/status', {
      data: { status: 'completed' },
    });
    expect(response.status()).toBe(401);
  });
});
