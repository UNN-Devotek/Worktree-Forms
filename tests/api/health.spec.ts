import { test, expect } from '@playwright/test';

/**
 * @tag p0 @tag smoke
 * Health endpoint — validates service connectivity.
 * P0: Must pass on every commit. Alerts if DynamoDB is down.
 * Note: Current implementation checks DynamoDB only; redis check is future work.
 */
test.describe('Health API', () => {
  test('[P0] GET /api/health returns 200 with DynamoDB connected', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.dynamodb).toMatch(/connected|ok/i);
  });

  test('[P1] GET /api/health does not expose secrets', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();
    expect(body).not.toHaveProperty('AUTH_SECRET');
    expect(body).not.toHaveProperty('PINECONE_API_KEY');
    expect(body).not.toHaveProperty('AWS_SECRET_ACCESS_KEY');
  });
});
