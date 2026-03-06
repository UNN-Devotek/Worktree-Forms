

import { test, expect } from '@playwright/test';

test.describe('Field Operations (Mobile)', () => {
    
    test.use({ 
        viewport: { width: 375, height: 667 },
        geolocation: { latitude: 37.7749, longitude: -122.4194 },
        permissions: ['geolocation']
    });

    test('should load daily route and navigate to stop', async ({ page }) => {
        // Mock API
        await page.route('**/api/projects/*/routes/my-daily*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        route: {
                            id: 1,
                            date: new Date().toISOString(),
                            stops: [
                                { id: 101, title: 'Stop 1: Foundation', address: '123 Main St', status: 'pending', priority: 'high', order: 1 }
                            ]
                        }
                    }
                })
            });
        });

        await page.goto('/project/demo/routes/my-daily');
        await expect(page.getByText('Stop 1: Foundation')).toBeVisible();
    });

    test('should allow form entry and offline queue', async ({ page }) => {
        // Mock Stop
        await page.route('**/api/routes/stops/101', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        stop: {
                            id: 101, 
                            title: 'Stop 1', 
                            status: 'arrived',
                            form: { id: 50, title: 'Safety Check' }
                        }
                    }
                })
            });
        });

        // Mock Form
        await page.route('**/api/forms/50', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        id: 50,
                        title: 'Safety Check',
                        form_schema: {
                            pages: [{
                                sections: [{
                                    fields: [{
                                        id: 'f1', type: 'text', name: 'notes', label: 'Notes', required: true
                                    }]
                                }]
                            }]
                        }
                    }
                })
            });
        });

        await page.goto('/project/demo/route/stop/101/perform');

        // Check for Heading
        await expect(page.getByText('Safety Check')).toBeVisible({ timeout: 10000 });
        
        // Offline
        await page.context().setOffline(true);
        
        // Fill
        await page.getByLabel('Notes').fill('Test Offline');
        
        // Mock API (even if offline, to prevent hanging if logic leaks)
        await page.route('**/api/forms/50/submissions', async route => route.abort());

        // Click Submit
        await page.getByRole('button', { name: /Submit/i }).click();

        // Check Redirect
        await expect(page).toHaveURL(/.*routes\/my-daily/);
    });
});
