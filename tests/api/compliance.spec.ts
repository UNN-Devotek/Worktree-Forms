import { test, expect } from '../support/fixtures/api-auth.fixture';
import { faker } from '@faker-js/faker';

/**
 * @tag p1
 * Compliance API — project compliance status and submissions.
 */

test.describe('Compliance API (unauthenticated)', () => {
  test('[P0] GET /api/projects/:id/compliance/status returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/projects/any/compliance/status');
    expect(response.status()).toBe(401);
  });

  test('[P0] POST /api/projects/:id/compliance/submit returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/projects/any/compliance/submit', {
      data: { answers: {} },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Compliance API (authenticated)', () => {
  test('[P1] GET compliance status for member project returns 200 or 404', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.get(`/api/projects/${projectId}/compliance/status`);
    expect([200, 404]).toContain(response.status());
  });

  test('[P0] compliance status for non-member project returns 403/404', async ({ memberApi }) => {
    const fakeId = `proj_${faker.string.uuid()}`;
    const response = await memberApi.get(`/api/projects/${fakeId}/compliance/status`);
    expect([403, 404]).toContain(response.status());
  });

  test('[P1] POST compliance submit for member project returns non-401', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.post(`/api/projects/${projectId}/compliance/submit`, {
      data: { answers: { q1: 'yes' } },
    });
    expect(response.status()).not.toBe(401);
  });
});
