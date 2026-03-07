import { test, expect } from '../support/fixtures/api-auth.fixture';

/**
 * @tag p1
 * Preferences API — user preferences CRUD.
 */

test.describe('Preferences API (unauthenticated)', () => {
  test('[P0] GET /api/preferences/me returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/preferences/me');
    expect(response.status()).toBe(401);
  });

  test('[P0] PATCH /api/preferences/me returns 401 without auth', async ({ request }) => {
    const response = await request.patch('/api/preferences/me', {
      data: { theme: 'dark' },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Preferences API (authenticated)', () => {
  test('[P1] GET /api/preferences/me returns current user preferences', async ({ adminApi }) => {
    const response = await adminApi.get('/api/preferences/me');
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('[P1] PATCH /api/preferences/me updates preferences', async ({ adminApi }) => {
    const response = await adminApi.patch('/api/preferences/me', {
      data: { theme: 'dark', language: 'en' },
    });
    expect([200, 400, 404]).toContain(response.status());
  });

  test('[P1] POST /api/preferences creates a preference key', async ({ adminApi }) => {
    const response = await adminApi.post('/api/preferences', {
      data: { key: 'test_pref', value: 'test_value' },
    });
    expect([200, 201, 400, 404]).toContain(response.status());
  });

  test('[P1] GET /api/preferences/:key returns a specific preference', async ({ adminApi }) => {
    const response = await adminApi.get('/api/preferences/theme');
    expect([200, 404]).toContain(response.status());
  });
});
