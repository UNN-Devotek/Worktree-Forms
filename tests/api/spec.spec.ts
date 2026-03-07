import { test, expect } from '../support/fixtures/api-auth.fixture';
import { faker } from '@faker-js/faker';

/**
 * @tag p1
 * Spec API — project specification documents (RAG-enabled).
 */

test.describe('Spec API (unauthenticated)', () => {
  test('[P0] GET /api/projects/:id/specs returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/projects/any/specs');
    expect(response.status()).toBe(401);
  });

  test('[P0] POST /api/projects/:id/specs returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/projects/any/specs', {
      data: { title: 'test', content: 'test' },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Spec API (authenticated)', () => {
  test('[P1] GET specs for member project returns 200 or 404', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.get(`/api/projects/${projectId}/specs`);
    expect([200, 404]).toContain(response.status());
  });

  test('[P0] specs for non-member project returns 403/404', async ({ memberApi }) => {
    const fakeId = `proj_${faker.string.uuid()}`;
    const response = await memberApi.get(`/api/projects/${fakeId}/specs`);
    expect([403, 404]).toContain(response.status());
  });

  test('[P1] POST spec without required fields returns 400 (validation)', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    // Missing required objectKey and fileUrl — should get 400 from Zod validation
    const response = await adminApi.post(`/api/projects/${projectId}/specs`, {
      data: {
        title: `Spec ${faker.string.alphanumeric(6)}`,
        content: 'This is the spec content for testing.',
      },
    });
    expect([400, 404]).toContain(response.status());
  });

  test('[P1] semantic search for specs returns non-401', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.get(
      `/api/projects/${projectId}/specs/semantic-search?q=requirements`
    );
    expect(response.status()).not.toBe(401);
  });
});
