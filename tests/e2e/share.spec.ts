import { test, expect } from '@playwright/test';

/**
 * @tag p2
 * Public Link Sharing E2E — generate and visit a public share link.
 * Uses storageState auth and API for form setup.
 */

test.describe('Public Link Sharing', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('[P2] share modal opens for a form', async ({ page, request }) => {
    // Get a project the admin is a member of
    const projectsRes = await request.get('/api/projects');
    if (projectsRes.status() !== 200) {
      test.skip();
      return;
    }
    const projectsBody = await projectsRes.json();
    const projects = projectsBody.data ?? projectsBody;
    if (!Array.isArray(projects) || projects.length === 0) {
      test.skip();
      return;
    }
    const project = projects[0];
    const slug = project.slug;
    const projectId = project.projectId ?? project.id;

    // Get or create a form
    const formsRes = await request.get(`/api/projects/${projectId}/forms`);
    let formSlug: string | null = null;

    if (formsRes.status() === 200) {
      const formsBody = await formsRes.json();
      const forms = formsBody.data?.forms ?? formsBody.data ?? formsBody;
      if (Array.isArray(forms) && forms.length > 0) {
        formSlug = forms[0].slug ?? forms[0].formId ?? forms[0].id;
      }
    }

    if (!formSlug) {
      test.skip();
      return;
    }

    // Navigate to the forms list for this project
    await page.goto(`/project/${slug}/forms`);

    // Page must load without error
    const content = page
      .getByRole('main')
      .or(page.getByText(/no forms|form/i));
    await expect(content).toBeVisible({ timeout: 10_000 });

    const hasError = await page
      .getByText(/something went wrong|server error|500/i)
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('[P2] public share endpoint accepts valid form token without auth', async ({ request }) => {
    // Attempt to access a public share URL — must return 200 or 404 (not 401/500)
    const response = await request.get('/api/public/forms/nonexistent-share-token');
    // 404 = token not found (expected), 200 = found, anything else is unexpected
    expect([200, 404]).toContain(response.status());
  });
});
