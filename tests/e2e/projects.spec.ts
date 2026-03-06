import { test } from '../support/fixtures/auth.fixture';
import { expect } from '@playwright/test';
import { createProject } from '../support/factories/project.factory';

test.describe('Project Management', () => {
    test('should allow a user to create a project', async ({ page, authenticatedUser }) => {
        // 1. Auth and Nav (handled by fixture)
        // const user = authenticatedUser; // already on dashboard
        
        // 3. Open Create Dialog
        await page.getByRole('button', { name: /create project/i }).first().click();
        
        // 4. Fill Form
        const projectData = createProject();
        await page.getByLabel('Project Name').fill(projectData.name);
        await page.getByLabel('Description').fill(projectData.description || '');
        
        // 5. Submit
        await page.locator('div[role="dialog"] button[type="submit"]').click(); 
        
        try {
            await expect(page.getByText('Project created successfully')).toBeVisible({ timeout: 5000 });
        } catch (e) {
            // ... debug logic kept for safety ...
            const errorToast = page.locator('.toast[data-type="error"]');
            if (await errorToast.isVisible()) {
                console.log('Error Toast:', await errorToast.textContent());
            }
             const dialog = page.locator('div[role="dialog"]');
            if (await dialog.isVisible()) {
                console.log('Dialog still open. Content:', await dialog.textContent());
            }
            throw e;
        }

        // 6. Verify
        // await page.reload(); // NOT NEEDED if router.refresh works
        await expect(page.getByText(projectData.name)).toBeVisible();
    });
});
