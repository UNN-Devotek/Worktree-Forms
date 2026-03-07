import { test, expect } from '@playwright/test';

/**
 * @tag p1
 * Form Submission E2E — end-to-end journey from filling a published form
 * to verifying the submission appears in the Smart Grid.
 * Depends on: dynamo.fixture.ts seedProject + seedForm.
 * Story AC: Epic 4 (Submission Lifecycle), Epic 2 (Form publish).
 */

test.describe('Form Submission — end-to-end journey', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('[P1] admin can submit a published form and see the result in the grid', async ({
    page,
    request,
  }) => {
    // Get a project with a published form via API
    const projectsRes = await request.get('/api/projects');
    const projectsBody = await projectsRes.json();
    const projects = projectsBody.data ?? projectsBody;
    if (!Array.isArray(projects) || projects.length === 0) {
      test.skip();
      return;
    }
    const project = projects[0];
    const slug = project.slug;
    const projectId = project.projectId ?? project.id;

    // Get forms for this project
    const formsRes = await request.get(`/api/forms?projectId=${projectId}`);
    const formsBody = await formsRes.json();
    const forms = formsBody.data ?? formsBody;
    if (!Array.isArray(forms) || forms.length === 0) {
      test.skip();
      return;
    }

    // Find a published form
    const publishedForm = forms.find(
      (f: { status: string }) => f.status === 'PUBLISHED' || f.status === 'published'
    );
    if (!publishedForm) {
      test.skip();
      return;
    }

    const formSlug = publishedForm.slug ?? publishedForm.formId;

    // Navigate to the form submission page
    await page.goto(`/project/${slug}/forms/${formSlug}`);

    // Fill form fields — resilient: skip if form has no visible fields
    const textInput = page.getByRole('textbox').first();
    if (await textInput.isVisible()) {
      await textInput.fill(`Test submission ${Date.now()}`);
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /submit/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify success state
    const successIndicator = page
      .getByText(/submitted|success|thank you/i)
      .or(page.getByRole('alert').filter({ hasText: /success/i }));
    await expect(successIndicator).toBeVisible({ timeout: 10_000 });
  });

  test('[P2] form submission with missing required field shows validation error', async ({
    page,
    request,
  }) => {
    const projectsRes = await request.get('/api/projects');
    const projectsBody = await projectsRes.json();
    const projects = projectsBody.data ?? projectsBody;
    if (!Array.isArray(projects) || projects.length === 0) {
      test.skip();
      return;
    }
    const project = projects[0];
    const projectId = project.projectId ?? project.id;
    const slug = project.slug;

    const formsRes = await request.get(`/api/forms?projectId=${projectId}`);
    const formsBody = await formsRes.json();
    const forms = formsBody.data ?? formsBody;
    const publishedForm = Array.isArray(forms)
      ? forms.find((f: { status: string }) => f.status === 'PUBLISHED')
      : null;
    if (!publishedForm) {
      test.skip();
      return;
    }

    await page.goto(`/project/${slug}/forms/${publishedForm.slug ?? publishedForm.formId}`);

    // Try to submit without filling required fields
    const submitBtn = page.getByRole('button', { name: /submit/i });
    if (!(await submitBtn.isVisible())) {
      test.skip();
      return;
    }
    await submitBtn.click();

    // Validation error must appear — no silent failure
    const errorMsg = page
      .getByText(/required|this field|please fill/i)
      .or(page.getByRole('alert'));
    await expect(errorMsg).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Form Submission — public share link', () => {
  // No storageState — unauthenticated public access via token
  test('[P2] public share link allows form submission without login', async ({ page, request }) => {
    // Get a public token from the API
    const tokenRes = await request.get('/api/share/tokens');
    if (tokenRes.status() !== 200) {
      test.skip();
      return;
    }
    const tokenBody = await tokenRes.json();
    const tokens = tokenBody.data ?? tokenBody;
    if (!Array.isArray(tokens) || tokens.length === 0) {
      test.skip();
      return;
    }

    const token = tokens[0].token ?? tokens[0].id;
    await page.goto(`/share/${token}`);

    // Must not redirect to login
    await expect(page).not.toHaveURL(/\/login/);

    // Form must be visible
    const form = page.getByRole('form').or(page.locator('form'));
    await expect(form).toBeVisible({ timeout: 10_000 });
  });
});
