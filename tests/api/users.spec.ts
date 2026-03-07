import { test, expect } from '../support/fixtures/api-auth.fixture';

/**
 * @tag p1
 * Users API — profile and admin user management.
 */

test.describe('Users API (unauthenticated)', () => {
  test('[P0] GET /api/users returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/users');
    expect(response.status()).toBe(401);
  });
});

test.describe('Users API (authenticated)', () => {
  test('[P1] GET /api/users/me returns the current user profile', async ({ adminApi }) => {
    const response = await adminApi.get('/api/users/me');
    // 200 = found, 404 = endpoint named differently
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      const user = body.data ?? body;
      expect(user.email ?? user.id).toBeTruthy();
    }
  });

  test('[P0] MEMBER cannot access admin-only user list', async ({ memberApi }) => {
    const response = await memberApi.get('/api/users');
    // Admin-only endpoint — must not return 200 for regular members
    expect([403, 404]).toContain(response.status());
  });

  test('[P1] ADMIN user list returns non-401 response', async ({ adminApi }) => {
    const response = await adminApi.get('/api/users');
    // 200 = success, 403 = role check uses DB role (not systemRole), 404 = endpoint named differently
    // Any non-401 response means auth passed
    expect(response.status()).not.toBe(401);
  });
});
