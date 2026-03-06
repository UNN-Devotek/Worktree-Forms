import { test } from '../support/fixtures/auth.fixture';
import { expect } from '@playwright/test';
import { createProject } from '../support/factories/project.factory';

test.describe('Functional Coverage: RFI, Help, Specs', () => {
    test('should allow creating functionality across modules', async ({ page, authenticatedUser }) => {
        
        // --- 1. Project Creation ---
        await page.getByRole('button', { name: /create project/i }).first().click();
        
        const projectName = `FuncTest-${Date.now()}`;
        await page.getByLabel('Project Name').fill(projectName);
        await page.getByLabel('Description').fill('End-to-end verification');
        
        await page.locator('div[role="dialog"] button[type="submit"]').click(); 
        await expect(page.getByText('Project created successfully')).toBeVisible();
        await expect(page.getByText(projectName)).toBeVisible();

        // Click into the project
        await page.getByText(projectName).click();
        await expect(page).toHaveURL(/\/project\//);

        // --- 2. RFI Module ---
        // Find RFI in sidebar (assuming "RFIs" or similar)
        // If sidebar is collapsed/responsive, this might be tricky, but assuming desktop view.
        await page.getByRole('link', { name: /rfis/i }).click();
        await expect(page.getByText('Project RFIs')).toBeVisible(); // Header check

        // Create RFI
        await page.getByRole('button', { name: /new rfi/i }).click();
        await page.getByLabel('Title').fill('Clarify Wall Paint');
        await page.getByLabel('Question').fill('What color is the north wall?');
        // Submit
        await page.locator('div[role="dialog"] button[type="submit"]').click();
        
        await expect(page.getByText('RFI created')).toBeVisible();
        await expect(page.getByText('Clarify Wall Paint')).toBeVisible(); // In list

        // --- 3. Specifications Module ---
        await page.getByRole('link', { name: /specifications/i }).click();
        await expect(page.getByText('Specifications')).toBeVisible();
        // Smoke check upload button exists
        await expect(page.getByRole('button', { name: /upload spec/i })).toBeVisible();

        // --- 4. Help Center (Global) ---
        // Navigate to Help page. Is it in sidebar? Or global nav.
        // Assuming /help route.
        await page.goto('/help');
        await expect(page.getByText('Help Center')).toBeVisible();
        
        // Check for article (we created one in Story 11.1 verification script)
        // "How to Use Safety Equipment" might be there if DB persisted.
        // If not, just check the components render.
        
        // Navigate to Mobile Reader
        await page.goto('/help/mobile');
        await expect(page.getByText('Mobile Offline Help')).toBeVisible();
         // Verify sync button exists
        await expect(page.getByRole('button', { name: /sync now/i })).toBeVisible();
    });
});
