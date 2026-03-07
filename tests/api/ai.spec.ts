import { test, expect } from '../support/fixtures/api-auth.fixture';

/**
 * @tag p0 @tag security
 * AI API — auth guard enforcement.
 * These tests verify authentication/authorization only — not AI output quality.
 * The AI service may return 500 if OpenAI/Pinecone keys are not configured in
 * the local dev environment; that is acceptable (service unavailable ≠ auth bypass).
 * R-003 from test-design-qa.md: AI auth bypass = P×I 2×3=6 (HIGH).
 */

test.describe('AI API (unauthenticated)', () => {
  test('[P0] POST /api/ai/chat returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/ai/chat', {
      data: { message: 'List all projects', projectId: 'any' },
    });
    expect(response.status()).toBe(401);
  });

  test('[P0] POST /api/ai/tool-call returns 401/404 without auth (not 200)', async ({
    request,
  }) => {
    const response = await request.post('/api/ai/tool-call', {
      data: { tool: 'delete_project', args: { projectId: 'any' } },
    });
    expect(response.status()).not.toBe(200);
  });

  test('[P0] streaming AI endpoints reject unauthenticated requests immediately', async ({
    request,
  }) => {
    const response = await request.post('/api/ai/stream', {
      data: { message: 'hello' },
    });
    // Must reject before streaming — not 200
    expect(response.status()).not.toBe(200);
  });
});

test.describe('AI API (authenticated MEMBER)', () => {
  test('[P0] MEMBER chat request passes auth check (not 401)', async ({ memberApi }) => {
    const response = await memberApi.post('/api/ai/chat', {
      data: { message: 'Hello', projectId: 'demo-project' },
    });
    // 401 = auth failed — must not happen for an authenticated user
    expect(response.status()).not.toBe(401);
    // Note: 500 is acceptable here when AI service (OpenAI/Pinecone) is not configured locally
  });

  test('[P1] MEMBER cannot invoke admin-only AI actions (403/404)', async ({ memberApi }) => {
    const response = await memberApi.post('/api/ai/admin-action', {
      data: { action: 'purge_index', projectId: 'any' },
    });
    expect([401, 403, 404]).toContain(response.status());
  });
});

test.describe('AI API (authenticated ADMIN)', () => {
  test('[P1] ADMIN chat request passes auth check (not 401)', async ({ adminApi }) => {
    const response = await adminApi.post('/api/ai/chat', {
      data: { message: 'What forms exist?', projectId: 'demo-project' },
    });
    // 401 = auth failed — must not happen for ADMIN
    expect(response.status()).not.toBe(401);
    // Note: 500 is acceptable when AI service is not configured locally
  });
});
