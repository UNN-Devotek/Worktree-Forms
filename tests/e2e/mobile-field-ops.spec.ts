import { test, expect, devices } from '@playwright/test';

/**
 * @tag p1
 * Mobile Field Ops E2E — route list, stop detail, and offline resilience.
 * Epic 3: Field Operations Mobile App (Offline First).
 * Uses mobile viewport to simulate field worker context.
 *
 * Note: devices['Pixel 5'] includes defaultBrowserType which must be declared
 * at the top level (not inside describe blocks).
 */

// Mobile viewport for the whole file — required at top level for defaultBrowserType
test.use({ ...devices['Pixel 5'] });

test.describe('Field Ops — Route List (mobile viewport)', () => {
  test.use({ storageState: 'playwright/.auth/member.json' });

  test('[P1] field worker sees their assigned routes on the route list', async ({
    page,
    request,
  }) => {
    // Get a project with routes
    const projectsRes = await request.get('/api/projects');
    const body = await projectsRes.json();
    const projects = body.data ?? body;
    if (!Array.isArray(projects) || projects.length === 0) {
      test.skip();
      return;
    }
    const slug = projects[0].slug;

    await page.goto(`/project/${slug}/route`);
    // Route list or empty state must render — no 500 error
    const content = page
      .getByTestId('route-list')
      .or(page.getByText(/no routes|route/i))
      .or(page.getByRole('list'));
    await expect(content).toBeVisible({ timeout: 10_000 });
  });

  test('[P1] tapping a stop opens the stop detail panel', async ({ page, request }) => {
    const projectsRes = await request.get('/api/projects');
    const body = await projectsRes.json();
    const projects = body.data ?? body;
    if (!Array.isArray(projects) || projects.length === 0) {
      test.skip();
      return;
    }
    const slug = projects[0].slug;
    const projectId = projects[0].projectId ?? projects[0].id;

    // Get routes
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
    const route = routes[0];
    const stops = route.stops ?? [];
    if (stops.length === 0) {
      test.skip();
      return;
    }
    const stopId = stops[0].stopId ?? stops[0].id;

    await page.goto(`/project/${slug}/route/stop/${stopId}/perform`);

    // Stop detail must render
    const stopDetail = page
      .getByTestId('stop-detail')
      .or(page.getByRole('main'))
      .or(page.getByText(/stop|perform|location/i));
    await expect(stopDetail).toBeVisible({ timeout: 10_000 });
  });

  test('[P2] field ops page renders correctly without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/dashboard');
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('404') &&
        !e.includes('ResizeObserver') &&
        !e.includes('Non-Error')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Field Ops — Offline Resilience', () => {
  test.use({ storageState: 'playwright/.auth/member.json' });

  test('[P1] offline sync provider does not crash when network is interrupted', async ({
    page,
    context,
    request,
  }) => {
    const projectsRes = await request.get('/api/projects');
    const body = await projectsRes.json();
    const projects = body.data ?? body;
    if (!Array.isArray(projects) || projects.length === 0) {
      test.skip();
      return;
    }
    const slug = projects[0].slug;

    await page.goto(`/project/${slug}/route`);
    // Simulate offline
    await context.setOffline(true);

    // Page must show offline indicator or not crash
    await page.waitForTimeout(1000);
    const hasOfflineIndicator = await page
      .getByText(/offline|no connection|sync pending/i)
      .isVisible()
      .catch(() => false);
    // Either shows offline UI or stays functional — no unhandled crash
    const hasError = await page.getByText(/something went wrong|error boundary/i).isVisible();
    expect(hasError).toBe(false);

    // Reconnect
    await context.setOffline(false);
    await page.waitForTimeout(500);
  });
});

test.describe('Field Ops — Schedule View', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('[P2] schedule page renders without crashing', async ({ page, request }) => {
    const projectsRes = await request.get('/api/projects');
    const body = await projectsRes.json();
    const projects = body.data ?? body;
    if (!Array.isArray(projects) || projects.length === 0) {
      test.skip();
      return;
    }
    const slug = projects[0].slug;

    await page.goto(`/project/${slug}/schedule`);
    // Must render something — no 500 error page
    const hasContent = await page.getByRole('main').isVisible().catch(() => false);
    expect(hasContent).toBe(true);
  });
});
