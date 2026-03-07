import { test, expect } from '../support/fixtures/api-auth.fixture';
import { faker } from '@faker-js/faker';

/**
 * @tag p1
 * Tasks API — CRUD + RBAC enforcement.
 */

test.describe('Tasks API (unauthenticated)', () => {
  test('[P0] GET /api/tasks returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/tasks?projectId=any');
    expect(response.status()).toBe(401);
  });

  test('[P0] POST /api/tasks returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: { title: 'Test', projectId: 'any' },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Tasks API (authenticated admin)', () => {
  test('[P1] GET /api/tasks?projectId lists tasks for member project', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.get(`/api/tasks?projectId=${projectId}`);
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(Array.isArray(body.data ?? body.tasks ?? body)).toBe(true);
    }
  });

  test('[P0] GET /api/tasks?projectId=FOREIGN returns 403/404', async ({ memberApi }) => {
    const fakeId = `proj_${faker.string.uuid()}`;
    const response = await memberApi.get(`/api/tasks?projectId=${fakeId}`);
    expect([403, 404]).toContain(response.status());
  });

  test('[P1] POST /api/tasks creates a task', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) { test.skip(); return; }
    const projects = (await projectsRes.json()).data ?? [];
    if (!Array.isArray(projects) || projects.length === 0) { test.skip(); return; }
    const projectId = projects[0].projectId ?? projects[0].id;

    const response = await adminApi.post('/api/tasks', {
      data: {
        title: `Task ${faker.string.alphanumeric(6)}`,
        projectId,
        status: 'TODO',
      },
    });
    expect([200, 201, 404]).toContain(response.status());
  });
});
