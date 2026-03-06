
import { test, expect } from '@playwright/test';
// import { generateUser } from '../fixtures/user.factory';

test.describe('Onboarding (Visa Wizard)', () => {

  test.beforeEach(async ({ page }) => {
    // Login as Admin (who is VERIFIED by default, but we can access /onboarding)
    // If we wanted to test PENDING, we'd need to mock or seed a PENDING user.
    // For now, we test the Page Load and Submission flow regardless of redirect.
    await page.goto('/login');
    // Use Dev Admin button
    await page.click('button:has-text("Dev Admin")');
    // Wait for redirect to dashboard or similar
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  });

  test('User can access onboarding and submit insurance', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('body')).toContainText('Account Verification');
    
    // Upload File
    // We need a dummy file.
    await page.setInputFiles('input[type="file"]', {
      name: 'insurance.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('dummy pdf content')
    });
    
    await page.click('button:has-text("Submit")');
    
    // Check for success or error
    const success = page.locator('text=Verification Complete');
    const error = page.locator('.text-red-500');

    await Promise.race([
        success.waitFor({ state: 'visible', timeout: 30000 }),
        error.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {})
    ]);

    if (await error.isVisible()) {
        const text = await error.textContent();
        throw new Error(`Upload Failed: ${text}`);
    }

    await expect(success).toBeVisible();
            
    // Should fail?
    // The backend `ComplianceService.submitInsurance` calls `prisma.user.update`.
    // If the USER ID from the bypass (e.g. "user-1" or whatever is in the cookie) does not exist in DB, Prisma will throw "Record to update not found".
    // The current Bypass Mock in `auth.ts` returns ID `userId` (from cookie). 
    // If I use `test-user-1`, I need to make sure that row exists in Postgres.
    
    // I can assume "user-123" exists or use the seeding.
    // Or I can just try it.
    
  });


  test('New user (PENDING) is forced to onboarding', async ({ page }) => {
      // 1. Register/Login as new user (triggers auto-creation with default PENDING)
      const uniqueId = Date.now();
      const email = `newuser${uniqueId}@worktree.pro`;
      
      await page.goto('/login');
      // Fill Credentials Form (assuming standard NextAuth setup)
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill('password');
      await page.getByRole('button', { name: 'Sign In' }).click();

      // 2. Should be redirected to /onboarding (not dashboard)
      await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });
      
      // 3. Verify accessing dashboard redirects back
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/onboarding/);
  });
});
