
import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth.fixture';

test.describe('Public Link Sharing', () => {
  let formUrl: string;

  test.beforeEach(async ({ page }) => {
    // Login
    // Note: Reusing the login helper or manual flow if helper not available in this context
    await page.goto('/login');
    await page.click('button:has-text("Dev Admin")');
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  });

  test('should generate and visit a public link for a form', async ({ page, context }) => {
    // 1. Navigate to a Form (Assuming one exists or we click the first one)
    await page.click('text=Forms'); 
    await page.waitForLoadState('networkidle');
    
    // Click the first form card/row if available. 
    // If empty env, this might fail, but "Dev Admin" usually sees seeded data or we create one.
    // Let's assume there is at least one form or we create one quickly.
    // For robustness: Try to create one if empty? Or just click the first "Manage" button.
    
    // Let's try to find a form row. Use a locator that finds the first table row or card.
    // If using the FileBrowser, we might need to click a file.
    // Fallback: Go directly to a known form URL if predictable, but IDs vary.
    // Better: Ensure we are on /forms and click the first item.

    // If FileBrowser is empty, we must create a form.
    const createBtn = page.locator('button:has-text("New Form")');
    if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.fill('input[name="title"]', 'Public Share Test Form');
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000); 
    } else {
        // Assume list is populated, click first folder/file
        // This part is tricky without knowing exact DOM of FileBrowser.
        // Let's assume we can navigate to /forms/1 (Group 1, Form 1) if seeded.
        // Or better, let's just create a test using API if possible, but we are E2E.
    }
    
    // WORKAROUND: Navigate to a likely existing form or create one via UI is safer.
    // Let's go to /forms and pick the first "file-row" or similar.
    // Since I don't know the exact class, I'll rely on text "Form"
    
    // Let's just create a dedicated test form via API in "beforeAll" if possible? 
    // No, let's keep it simple. Navigate to /forms, if we see "Public Share Test Form" click it, else create.
    await page.goto('/forms');
    
    // Wait for "New" button to ensure loaded
    await page.waitForSelector('button:has-text("New")');
    
    // Mock the flow: Creating a new form to ensure we have ownership and ID
    await page.goto('/forms/new');
    await page.fill('input#title', 'Shareable Form');
    await page.click('button:has-text("Create Form")');
    
    // Should redirect to /forms/[slug]
    await expect(page).toHaveURL(/\/forms\/shareable-form/);
    
    // 2. Click Share
    await page.click('button:has-text("Share")');
    
    // 3. Generate Link
    await page.click('button:has-text("Generate Link")');
    
    // 4. Get the link
    const linkInput = page.locator('input#link');
    await expect(linkInput).toBeVisible({ timeout: 5000 });
    const publicUrl = await linkInput.inputValue();
    expect(publicUrl).toContain('/public/form/');
    
    // 5. Visit in new context (Incognito)
    const newContext = await page.context().browser()!.newContext();
    const newPage = await newContext.newPage();
    
    await newPage.goto(publicUrl);
    
    // 6. Verify Content
    await expect(newPage.locator('text=Shareable Form')).toBeVisible();
    await expect(newPage.locator('text=Form Schema Preview')).toBeVisible();
    
    await newContext.close();
  });
});
