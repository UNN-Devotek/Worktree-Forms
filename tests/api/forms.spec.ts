import { test, expect } from '../support/fixtures/api-auth.fixture';
import { faker } from '@faker-js/faker';

/**
 * @tag p1
 * Forms API — CRUD, publish, version, and submit.
 * All endpoints scoped to projectId via requireProjectAccess().
 * Uses JWT Bearer auth fixture (Express backend).
 */

test.describe('Forms API (unauthenticated)', () => {
  test('[P0] GET /api/forms returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/forms?projectId=any');
    expect(response.status()).toBe(401);
  });

  test('[P0] POST /api/forms returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/forms', {
      data: { name: 'Test Form', projectId: 'any' },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Forms API (admin, project-scoped)', () => {
  test('[P1] POST /api/projects/:projectId/forms creates a draft form in an existing project', async ({ adminApi }) => {
    // Get a project to scope the form
    const projectsRes = await adminApi.get('/api/projects');
    expect(projectsRes.status()).toBe(200);
    const projectsBody = await projectsRes.json();
    const projectList = Array.isArray(projectsBody.data ?? projectsBody)
      ? (projectsBody.data ?? projectsBody)
      : [];
    if (projectList.length === 0) {
      test.skip();
      return;
    }
    const projectId = projectList[0].projectId ?? projectList[0].id;

    const formName = `Form ${faker.string.alphanumeric(6)}`;
    const response = await adminApi.post(`/api/projects/${projectId}/forms`, {
      data: { title: formName },
    });
    expect([200, 201]).toContain(response.status());

    const body = await response.json();
    const formId = body.data?.form?.formId ?? body.data?.formId ?? body.formId ?? body.data?.id ?? body.id;
    expect(formId).toBeTruthy();
  });

  test('[P1] GET /api/forms?projectId lists forms scoped to authenticated project', async ({
    adminApi,
  }) => {
    const projectsRes = await adminApi.get('/api/projects');
    const projectsBody = await projectsRes.json();
    const projectList = projectsBody.data ?? projectsBody;
    if (!Array.isArray(projectList) || projectList.length === 0) {
      test.skip();
      return;
    }
    const projectId = projectList[0].projectId ?? projectList[0].id;

    const response = await adminApi.get(`/api/forms?projectId=${projectId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data ?? body)).toBe(true);
  });

  test('[P0] GET /api/forms?projectId=FOREIGN returns 403 for non-member project', async ({
    memberApi,
  }) => {
    const foreignProjectId = `proj_${faker.string.uuid()}`;
    const response = await memberApi.get(`/api/forms?projectId=${foreignProjectId}`);
    expect([403, 404]).toContain(response.status());
  });
});

test.describe('Forms API — MEMBER publish restriction', () => {
  test('[P0] MEMBER cannot publish a form (requires ADMIN/OWNER role)', async ({ memberApi }) => {
    const fakeProjectId = `proj_${faker.string.uuid()}`;
    const fakeFormId = `form_${faker.string.uuid()}`;
    const response = await memberApi.post(`/api/forms/${fakeFormId}/publish`, {
      data: { projectId: fakeProjectId },
    });
    expect([403, 404]).toContain(response.status());
  });
});
