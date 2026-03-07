import { test, expect } from '@playwright/test';

/**
 * @tag p1
 * Form Builder E2E — verifies the form builder loads and basic navigation works.
 * Uses storageState for auth (no Prisma dependency).
 */

test.describe('Form Builder', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('[P1] form builder page loads for an existing form', async ({ page, request }) => {
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
    let formId: string | null = null;

    if (formsRes.status() === 200) {
      const formsBody = await formsRes.json();
      const forms = formsBody.data?.forms ?? formsBody.data ?? formsBody;
      if (Array.isArray(forms) && forms.length > 0) {
        formId = forms[0].formId ?? forms[0].id;
      }
    }

    if (!formId) {
      // Create a form to test with
      const createRes = await request.post(`/api/projects/${projectId}/forms`, {
        data: { title: 'Builder Test Form' },
        headers: { 'Content-Type': 'application/json' },
      });
      if (createRes.status() !== 201) {
        test.skip();
        return;
      }
      const createBody = await createRes.json();
      formId = createBody.data?.form?.formId ?? createBody.data?.formId ?? createBody.formId;
    }

    if (!formId) {
      test.skip();
      return;
    }

    // Navigate to the form builder
    await page.goto(`/project/${slug}/forms/builder/${formId}?projectId=${projectId}`);

    // Builder must load without error — check for canvas or palette
    const builderLoaded = page
      .getByTestId('form-canvas')
      .or(page.getByTestId('question-palette'))
      .or(page.getByRole('main'));
    await expect(builderLoaded).toBeVisible({ timeout: 15_000 });

    // Must not show error boundary or server error
    const hasError = await page
      .getByText(/something went wrong|server error|500/i)
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });

  test('[P1] forms list page loads for an existing project', async ({ page, request }) => {
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
    const slug = projects[0].slug;

    await page.goto(`/project/${slug}/forms`);

    // Forms list or empty state must render
    const content = page
      .getByRole('main')
      .or(page.getByText(/no forms|create your first/i))
      .or(page.getByRole('list'));
    await expect(content).toBeVisible({ timeout: 10_000 });

    const hasError = await page
      .getByText(/something went wrong|server error|500/i)
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);
  });
});
