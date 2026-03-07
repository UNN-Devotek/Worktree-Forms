import { test, expect } from '@playwright/test';

/**
 * @tag p2
 * Onboarding E2E — Visa Wizard / verification page.
 * Uses storageState auth (no email/password form — app uses dev buttons).
 */

test.describe('Onboarding (Visa Wizard)', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('[P2] onboarding page loads and renders verification step', async ({ page }) => {
    await page.goto('/onboarding');

    // Page must load — main content must be visible
    await expect(page.getByRole('main')).toBeVisible({ timeout: 10_000 });

    // Must not show unhandled error boundary
    const hasError = await page
      .getByText(/something went wrong|server error|500/i)
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('[P2] verified admin accessing /onboarding is not blocked', async ({ page }) => {
    await page.goto('/onboarding');
    // Verified users may be redirected to dashboard or shown onboarding — neither is a crash
    const urlOk = page.url().includes('/onboarding') || page.url().includes('/dashboard');
    expect(urlOk).toBe(true);
  });
});

test.describe('Onboarding — unauthenticated access', () => {
  test('[P1] unauthenticated user accessing /onboarding sees the page or is redirected to login', async ({
    page,
  }) => {
    await page.goto('/onboarding');
    // Onboarding may be publicly accessible (for new user signup flow) or redirect to login
    const urlOk =
      page.url().includes('/onboarding') ||
      page.url().includes('/login') ||
      page.url().includes('/signin');
    expect(urlOk).toBe(true);
  });
});
