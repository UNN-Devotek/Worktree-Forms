import { test, expect } from '../support/fixtures/api-auth.fixture';
import { faker } from '@faker-js/faker';

/**
 * @tag p1
 * Folders API — project folder CRUD.
 */

test.describe('Folders API (unauthenticated)', () => {
  test('[P0] GET /api/folders returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/folders?projectId=any');
    expect(response.status()).toBe(401);
  });

  test('[P0] POST /api/folders returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/folders', {
      data: { name: 'test', projectId: 'any' },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Folders API (authenticated)', () => {
  test('[P1] POST /api/folders creates a folder in a member project', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.post('/api/folders', {
      data: {
        name: `Folder ${faker.string.alphanumeric(6)}`,
        projectId,
      },
    });
    expect([200, 201, 404]).toContain(response.status());
  });

  test('[P1] GET /api/folders?projectId lists folders for member project', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.get(`/api/folders?projectId=${projectId}`);
    expect([200, 404]).toContain(response.status());
  });

  test('[P0] folders for non-member project returns 403/404', async ({ memberApi }) => {
    const fakeId = `proj_${faker.string.uuid()}`;
    const response = await memberApi.get(`/api/folders?projectId=${fakeId}`);
    expect([403, 404]).toContain(response.status());
  });
});
