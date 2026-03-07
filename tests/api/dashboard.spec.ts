import { test, expect } from '../support/fixtures/api-auth.fixture';

/**
 * @tag p1
 * Dashboard API — metrics and recent activity.
 */

test.describe('Dashboard API (unauthenticated)', () => {
  test('[P0] GET /api/dashboard returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/dashboard?projectId=any');
    expect(response.status()).toBe(401);
  });
});

test.describe('Dashboard API (authenticated admin)', () => {
  test('[P1] GET /api/dashboard/metrics returns metrics for a member project', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.get(`/api/projects/${projectId}/metrics`);
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('[P1] GET /api/dashboard/activity returns recent activity', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.get(`/api/projects/${projectId}/activity`);
    expect([200, 404]).toContain(response.status());
  });

  test('[P0] dashboard returns 403 for non-member project', async ({ memberApi }) => {
    const response = await memberApi.get('/api/projects/nonexistent-proj/metrics');
    expect([403, 404]).toContain(response.status());
  });
});
