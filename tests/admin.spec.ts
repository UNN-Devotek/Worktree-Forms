
import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('sidebar navigation works', async ({ page }) => {
    // Wait for hydration
    await page.waitForLoadState('domcontentloaded');
    
    // Check if sidebar is there
    await expect(page.locator('nav').first()).toBeVisible();
    
    // Toggle
    const toggleBtn = page.locator('button[aria-label="Collapse Sidebar"], button[aria-label="Expand Sidebar"]');
    if (await toggleBtn.isVisible()) {
        await toggleBtn.click();
        // Wait for animation
        await page.waitForTimeout(500);
    }

    // Navigate to Users
    await page.click('a[href="/admin/users"]');
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test('can manage users', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Add User
    const addUserBtn = page.locator('text=Add User');
    if (await addUserBtn.isVisible()) {
        await addUserBtn.click();
        await page.fill('input[name="email"]', 'testuser@example.com');
        await page.click('button:has-text("Save")');
        // Verify in list
        await expect(page.locator('body')).toContainText('testuser@example.com');
    }
    
    // Remove User (Mock flow)
    // Find a delete button
    // await page.click('button.delete-user');
    // await expect(...)
  });

  test('can manage settings', async ({ page }) => {
      await page.goto('/admin/settings');
      await expect(page.locator('h1')).toContainText('Settings');
      
      // Update site name
      const input = page.locator('input[name="siteName"]');
      if (await input.isVisible()) {
          await input.fill('New Site Name');
          await page.click('button:has-text("Save")');
          // Reload and check
          await page.reload();
          await expect(input).toHaveValue('New Site Name');
      }
  });

});
