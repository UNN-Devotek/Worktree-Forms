import { test as base, APIRequestContext } from '@playwright/test';

// Pure helper function
export async function apiRequestHelper(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: unknown,
  headers: Record<string, string> = {}
) {
  console.log(`[API] ${method} ${url}`);
  const response = await request.fetch(url, {
    method,
    data,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!response.ok()) {
    const text = await response.text();
    console.error(`[API ERROR] ${response.status()} ${text}`);
    throw new Error(`API request failed: ${response.status()} ${response.statusText()} - ${text}`);
  }

  return response.json();
}

// Fixture
export const test = base.extend<{
  apiRequest: (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: unknown
  ) => Promise<any>;
}>({
  apiRequest: async ({ request }, use) => {
    const baseURL = process.env.API_URL || 'http://127.0.0.1:5005'; // Backend URL (matches running service)

    await use(async (method, url, data) => {
      // Ensure we hit the backend directly for API seeding
      const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
      return apiRequestHelper(request, method, fullUrl, data);
    });
  },
});

export { expect } from '@playwright/test';
