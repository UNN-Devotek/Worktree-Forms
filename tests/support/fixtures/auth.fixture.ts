import { test as base } from './api.fixture';
import { expect } from '@playwright/test';
import { createUser, User } from '../factories/user.factory';

type AuthFixture = {
  seedUser: (overrides?: Partial<User>) => Promise<User & { token: string }>;
  authenticatedUser: User & { token: string };
};

export const test = base.extend<AuthFixture>({
  seedUser: async ({ apiRequest }, use) => {
    const seedUser = async (overrides: Partial<User> = {}) => {
      // Use fixed ID for robust Mock Auth (matches auth.ts hardcoded ID)
      const userData = createUser({ ...overrides, id: 'e2e-test-user' });
      const password = userData.password || 'password123';

      // Register the user via backend API
      const response = await apiRequest('POST', '/api/auth/register', {
        email: userData.email,
        password: password,
        name: userData.name,
      });

      // The register response returns the created user and likely a token or we need to login
      // Looking at index.ts, register returns { success: true, data: { user: ... } }
      // It DOES NOT return a token. We need to login to get a token.

      // Login to get token
      const loginResponse = await apiRequest('POST', '/api/auth/login', {
        email: userData.email,
        password: password,
      });

      return {
        ...userData,
        id: response.data.user.id, // Use actual ID from DB
        token: loginResponse.data.token,
      };
    };

    await use(seedUser);
  },

  authenticatedUser: async ({ page, seedUser }, use) => {
    // 1. Create and Seed User in DB
    const user = await seedUser();

    // 2. Mock the Session API
    // Instead of logging in, we tell the browser that we are already logged in
    await page.route('**/api/auth/session', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                user: {
                    name: 'Test User',
                    email: user.email,
                    image: null,
                    id: user.id,
                    systemRole: 'ADMIN' // Important for RBAC
                },
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            })
        });
    });

    console.log(`[TEST] Mocked Auth Session for ${user.email}`);

    // 3. Set Bypass Cookie via Browser Context (Better than Headers)
    await page.context().addCookies([{
        name: 'worktree-test-bypass',
        value: user.id,
        domain: 'localhost',
        path: '/',
        expires: Date.now() / 1000 + 3600
    }]);

    console.log(`[TEST] Bypassing Auth with Cookie, UserID=${user.id}`);

    // 4. Navigate Directly to Dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // 5. Provide the user object to the test
    await use(user);
  },
});
