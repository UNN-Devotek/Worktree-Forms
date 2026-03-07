import { test, expect } from '@playwright/test';

/**
 * @tag p0 @tag security
 * Auth API — validates NextAuth v5 session layer.
 * Note: This app uses Microsoft SSO + Dev login buttons (no email/password form).
 * Tests cover: session API, unauthenticated state, sign-out.
 */

test.describe('Auth API (unauthenticated)', () => {
  test('[P0] GET /api/auth/session returns no user for unauthenticated requests', async ({
    request,
  }) => {
    const response = await request.get('/api/auth/session');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Unauthenticated: session is null or no user property
    const hasNoUser = body === null || !body.user;
    expect(hasNoUser).toBe(true);
  });

  test('[P0] GET /api/auth/csrf returns a CSRF token', async ({ request }) => {
    const response = await request.get('/api/auth/csrf');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.csrfToken).toBeTruthy();
    expect(typeof body.csrfToken).toBe('string');
  });

  test('[P0] GET /api/auth/providers returns available providers', async ({ request }) => {
    const response = await request.get('/api/auth/providers');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Must have at least one provider configured
    expect(Object.keys(body).length).toBeGreaterThan(0);
  });
});

test.describe('Auth API (authenticated admin)', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('[P1] GET /api/auth/session returns authenticated admin user', async ({ request }) => {
    const response = await request.get('/api/auth/session');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBeTruthy();
    // Must not leak password hash to session consumer
    expect(body.user.passwordHash).toBeUndefined();
  });

  test('[P2] POST /api/auth/signout with CSRF token clears session', async ({ request }) => {
    const csrfResponse = await request.get('/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();

    const response = await request.post('/api/auth/signout', {
      form: { csrfToken },
    });
    expect([200, 302]).toContain(response.status());
  });
});

test.describe('Auth API (authenticated member)', () => {
  test.use({ storageState: 'playwright/.auth/member.json' });

  test('[P1] GET /api/auth/session returns authenticated member user', async ({ request }) => {
    const response = await request.get('/api/auth/session');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBeTruthy();
  });
});
