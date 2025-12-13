
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Worktree/);
});

// Since we don't have a real backend running for auth in this environment usually,
// we might mock this or skip. For now, let's assume a basic check.
// If the app redirects to login, we check that.

test('loads dashboard without auth (dev mode)', async ({ page }) => {
    await page.goto('/dashboard');
    // Expect to access dashboard directly in dev
    await expect(page).toHaveTitle(/Worktree/);
    await expect(page.locator('h1')).toBeVisible(); 
});
