import { test } from '../support/fixtures/auth.fixture';
import { expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow logging in as dev admin', async ({ page }) => {
    // 2. Go to Login Page
    await page.goto('/login');

    // 3. Click Dev Admin (only visible in dev)
    const devButton = page.getByRole('button', { name: 'Dev Admin' });
    
    // Ensure we are in dev mode or mock it.
    // If the button is not there, it might be because of NODE_ENV.
    // But we expect it to be there in local dev.
    await expect(devButton).toBeVisible();
    await devButton.click();

    // 4. Assert Redirect
    // Expect to eventually be on dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
  });
});
