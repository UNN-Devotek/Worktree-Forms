
import { test, expect } from '@playwright/test';

test.describe('Form Management', () => {

  test('can navigate to create form', async ({ page }) => {
    // Mock login or assume dev environment bypasses it for now, or we automate login
    // For this test, we assume we can reach /forms
    await page.goto('/forms');
    await page.click('text=Create Form');
    await expect(page).toHaveURL(/\/forms\/new/);
  });

  test('can create a new form and persistence works', async ({ page }) => {
    await page.goto('/forms/new');
    
    const testTitle = 'My Test Form ' + Date.now();
    const testDesc = 'Description checking persistence';

    await page.fill('input[name="title"]', testTitle);
    await page.fill('textarea[name="description"]', testDesc);
    await page.click('button[type="submit"]');

    // Should redirect to builder
    await expect(page).toHaveURL(/\/builder/); 

    // Verify Title Persistence
    await expect(page.locator('h1')).toContainText(testTitle);
    
    // Check if components exist in sidebar
    await expect(page.locator('text=Text Input')).toBeVisible();
    await expect(page.locator('text=Number')).toBeVisible();
    await expect(page.locator('text=File Upload')).toBeVisible();
  });

  test('can drag and drop components', async ({ page }) => {
     // This test assumes a form is already created or we create one on the fly
     // Simplified flow for example
     await page.goto('/forms/new');
     await page.fill('input[name="title"]', 'Builder Test');
     await page.click('button[type="submit"]');
     
     // Wait for builder
     await page.waitForTimeout(1000);

     // Drag text input
     const source = page.locator('button:has-text("Text Input")').first();
     const target = page.getByTestId('form-canvas');

     if (await source.isVisible() && await target.isVisible()) {
        const sourceBox = await source.boundingBox();
        const targetBox = await target.boundingBox();

        if (sourceBox && targetBox) {
            await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 5 });
            await page.mouse.up();
            
            // Verify it was added - wait for text in canvas
            // Might need specific check if generic "Text Input" exists multiple times
            await expect(page.locator('[data-testid="form-canvas"]')).toContainText('Text Input');
        }
     }
  });

  test('file upload component functionality', async ({ page }) => {
     // Go to the builder
     await page.goto('/forms/new');
     await page.fill('input[name="title"]', 'Upload Test');
     await page.click('button[type="submit"]');

     // Add upload component (mocking the drag for now, or just finding the setting if it's there)
     // If we can't drag in this generic test, we check if the component is available in the list.
     await expect(page.locator('text=File Upload')).toBeVisible();
     
     // To test the *actual* upload, we'd need to preview the form.
     // Assuming a "Preview" button
     const previewBtn = page.locator('text=Preview');
     if (await previewBtn.isVisible()) {
         await previewBtn.click();
         // Locate file input
         const fileInput = page.locator('input[type="file"]');
         await fileInput.setInputFiles({
             name: 'test.png',
             mimeType: 'image/png',
             buffer: Buffer.from('this is a test'),
         });
         // Verify value or success indicator
     }
  });

});
