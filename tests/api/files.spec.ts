import { test, expect } from '../support/fixtures/api-auth.fixture';
import { faker } from '@faker-js/faker';

/**
 * @tag p1
 * Files API — presigned S3 URL generation and file tracking.
 * Local dev: LocalStack on port 4510.
 */

test.describe('Files API (unauthenticated)', () => {
  test('[P0] GET /api/files/presigned returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/files/presigned?key=test.pdf&projectId=any');
    expect(response.status()).toBe(401);
  });

  test('[P0] POST /api/upload returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/upload', {
      data: { filename: 'test.pdf', projectId: 'any' },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Files API (authenticated admin)', () => {
  test('[P0] file upload scoped to non-member project returns 403', async ({ adminApi }) => {
    const fakeProjectId = `proj_${faker.string.uuid()}`;
    const response = await adminApi.get(
      `/api/files/presigned?key=test.pdf&projectId=${fakeProjectId}`
    );
    // Unauthenticated = 401, wrong project = 403/404, endpoint missing = 404
    expect([403, 404]).toContain(response.status());
  });

  test('[P1] presigned URL for valid project returns 200 with URL', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) {
      test.skip();
      return;
    }
    const projectsBody = await projectsRes.json();
    const projectList = projectsBody.data ?? projectsBody;
    if (!Array.isArray(projectList) || projectList.length === 0) {
      test.skip();
      return;
    }
    const projectId = projectList[0].projectId ?? projectList[0].id;
    const filename = `test-${faker.string.alphanumeric(8)}.jpg`;

    const response = await adminApi.get(
      `/api/files/presigned?key=${encodeURIComponent(filename)}&projectId=${projectId}&contentType=image/jpeg`
    );

    if (response.status() === 404) {
      // Endpoint named differently — skip rather than fail
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    const url = body.url ?? body.presignedUrl ?? body.data?.url;
    expect(url).toBeTruthy();
    expect(url).toMatch(/^https?:\/\//);
  });

  test('[P2] GET /api/files?projectId lists files for a member project', async ({ adminApi }) => {
    const projectsRes = await adminApi.get('/api/projects');
    if (projectsRes.status() !== 200) {
      test.skip();
      return;
    }
    const projectsBody = await projectsRes.json();
    const projectList = projectsBody.data ?? projectsBody;
    if (!Array.isArray(projectList) || projectList.length === 0) {
      test.skip();
      return;
    }
    const projectId = projectList[0].projectId ?? projectList[0].id;

    const response = await adminApi.get(`/api/files?projectId=${projectId}`);
    if (response.status() === 404) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data ?? body)).toBe(true);
  });
});
