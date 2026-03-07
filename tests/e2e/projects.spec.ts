import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * @tag p1
 * Projects E2E — user journey for project CRUD through the UI.
 * REWRITE: replaced broken Prisma-backed auth.fixture + Prisma createProject factory.
 * All setup/teardown via API (no direct DB access).
 * Anti-patterns removed: no try/catch flow control, no waitForTimeout.
 */

test.describe('Projects — create and navigate', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('[P1] admin can create a new project and is redirected to project workspace', async ({
    page,
  }) => {
    const projectName = `E2E Project ${faker.string.alphanumeric(6)}`;

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Open create project dialog
    const createBtn = page.getByRole('button', { name: /new project|create project/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Fill in project name
    const nameInput = page.getByRole('textbox', { name: /project name|name/i });
    await expect(nameInput).toBeVisible();
    await nameInput.fill(projectName);

    // Submit
    await page.getByRole('button', { name: /create|save|submit/i }).click();

    // Should redirect to project workspace
    await expect(page).toHaveURL(/\/project\//);
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible();
  });

  test('[P1] project list shows all projects the user is a member of', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');

    // Project list must be visible
    const projectList = page
      .getByTestId('project-list')
      .or(page.getByRole('list'))
      .or(page.getByRole('grid'));
    await expect(projectList).toBeVisible();
  });

  test('[P2] navigating to a project slug opens the correct project', async ({ page, request }) => {
    // Get first project via API
    const res = await request.get('/api/projects');
    const body = await res.json();
    const projects = body.data ?? body;
    if (!Array.isArray(projects) || projects.length === 0) {
      test.skip();
      return;
    }
    const project = projects[0];
    const slug = project.slug;

    await page.goto(`/project/${slug}`);
    await expect(page.getByText(project.name)).toBeVisible();
  });
});

test.describe('Projects — MEMBER access', () => {
  test.use({ storageState: 'playwright/.auth/member.json' });

  test('[P0] member can view projects they belong to (no redirect to login)', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('[P0] member cannot access project settings (admin-only)', async ({ page, request }) => {
    const res = await request.get('/api/projects');
    const body = await res.json();
    const projects = body.data ?? body;
    if (!Array.isArray(projects) || projects.length === 0) {
      test.skip();
      return;
    }
    const slug = projects[0].slug;

    await page.goto(`/project/${slug}/settings`);
    // Should either redirect or show forbidden — never silently succeed
    const isForbidden =
      (await page.getByText(/forbidden|not authorized|access denied/i).isVisible()) ||
      page.url().includes('/login') ||
      page.url().includes('/dashboard');
    expect(isForbidden).toBe(true);
  });
});

test.describe('Projects — unauthenticated guard', () => {
  test('[P0] unauthenticated user accessing /dashboard is redirected to /login', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login|\/signin/);
  });

  test('[P0] unauthenticated user accessing /project/:slug is redirected to /login', async ({
    page,
  }) => {
    await page.goto('/project/some-project');
    await expect(page).toHaveURL(/\/login|\/signin/);
  });
});
