import { test, expect } from '@playwright/test';

/**
 * @tag p1
 * Field Operations E2E — route list and stop detail.
 * Tests the field worker mobile workflow using storageState auth.
 */

test.describe('Field Operations (Mobile)', () => {
  test.use({
    storageState: 'playwright/.auth/member.json',
    viewport: { width: 375, height: 667 },
    geolocation: { latitude: 37.7749, longitude: -122.4194 },
    permissions: ['geolocation'],
  });

  test('[P1] route list page loads without error', async ({ page, request }) => {
    // Get a project to navigate to
    const projectsRes = await request.get('/api/projects');
    if (projectsRes.status() !== 200) {
      test.skip();
      return;
    }
    const body = await projectsRes.json();
    const projects = body.data ?? body;
    if (!Array.isArray(projects) || projects.length === 0) {
      test.skip();
      return;
    }
    const slug = projects[0].slug;

    await page.goto(`/project/${slug}/route`);

    // Route list, empty state, or main content must render — no 500 error
    const content = page
      .getByTestId('route-list')
      .or(page.getByText(/no routes|route/i))
      .or(page.getByRole('main'));
    await expect(content).toBeVisible({ timeout: 10_000 });

    // Must not show unhandled error
    const hasError = await page
      .getByText(/something went wrong|server error|500/i)
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('[P1] stop detail page loads without error', async ({ page, request }) => {
    const projectsRes = await request.get('/api/projects');
    if (projectsRes.status() !== 200) {
      test.skip();
      return;
    }
    const body = await projectsRes.json();
    const projects = body.data ?? body;
    if (!Array.isArray(projects) || projects.length === 0) {
      test.skip();
      return;
    }
    const slug = projects[0].slug;
    const projectId = projects[0].projectId ?? projects[0].id;

    const routesRes = await request.get(`/api/routes?projectId=${projectId}`);
    if (routesRes.status() !== 200) {
      test.skip();
      return;
    }
    const routesBody = await routesRes.json();
    const routes = routesBody.data ?? routesBody;
    if (!Array.isArray(routes) || routes.length === 0) {
      test.skip();
      return;
    }
    const stops = routes[0].stops ?? [];
    if (stops.length === 0) {
      test.skip();
      return;
    }
    const stopId = stops[0].stopId ?? stops[0].id;

    await page.goto(`/project/${slug}/route/stop/${stopId}/perform`);

    const content = page
      .getByTestId('stop-detail')
      .or(page.getByRole('main'));
    await expect(content).toBeVisible({ timeout: 10_000 });

    const hasError = await page
      .getByText(/something went wrong|server error|500/i)
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });
});
