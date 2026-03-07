import { test as base, APIRequestContext } from '@playwright/test';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

/**
 * API auth fixture for Express backend JWT authentication.
 *
 * The Express backend has its own JWT secret in apps/backend/.env (separate
 * from the NextAuth AUTH_SECRET in .env.local). This fixture reads that secret
 * and generates Bearer tokens for use in API tests.
 *
 * Usage:
 *   import { test, expect } from '../support/fixtures/api-auth.fixture';
 *   test('admin API test', async ({ adminApi }) => {
 *     const res = await adminApi.get('/api/projects');
 *     expect(res.status()).toBe(200);
 *   });
 */

function getJwtSecret(): string {
  // CI: explicit env var
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  // Local dev: read from apps/backend/.env (backend has its own secret)
  const backendEnv = path.join(process.cwd(), 'apps', 'backend', '.env');
  if (fs.existsSync(backendEnv)) {
    const parsed = dotenv.parse(fs.readFileSync(backendEnv));
    if (parsed.JWT_SECRET) return parsed.JWT_SECRET;
  }

  // Fallback: .env.local
  const rootEnv = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(rootEnv)) {
    const parsed = dotenv.parse(fs.readFileSync(rootEnv));
    if (parsed.JWT_SECRET) return parsed.JWT_SECRET;
  }

  throw new Error(
    'JWT_SECRET not found in apps/backend/.env, .env.local, or environment. ' +
    'Cannot generate API auth tokens for tests.'
  );
}

function makeToken(userId: string, email: string, systemRole: string): string {
  return jwt.sign(
    { sub: userId, email, systemRole },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '1h' }
  );
}

interface ApiAuthFixtures {
  /** Authenticated APIRequestContext for the admin user (admin@worktree.pro) */
  adminApi: APIRequestContext;
  /** Authenticated APIRequestContext for the member user (user@worktree.com) */
  memberApi: APIRequestContext;
}

export const test = base.extend<ApiAuthFixtures>({
  adminApi: async ({ playwright }, use) => {
    const token = makeToken('admin-dev-001', 'admin@worktree.pro', 'ADMIN');
    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3005',
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
        'x-test-mode': 'true',
      },
    });
    await use(ctx);
    await ctx.dispose();
  },

  memberApi: async ({ playwright }, use) => {
    const token = makeToken('user-dev-001', 'user@worktree.com', 'MEMBER');
    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3005',
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
        'x-test-mode': 'true',
      },
    });
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect } from '@playwright/test';
