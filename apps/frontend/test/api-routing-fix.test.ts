/**
 * Test to verify API routing fix
 * This test confirms that:
 * 1. API_BASE is empty (uses Next.js proxy)
 * 2. buildApiUrl constructs correct URLs
 * 3. No double /api/api/ prefix occurs
 */

import { describe, it, expect } from 'vitest';

describe('API Routing Fix', () => {
  // Mock environment to simulate local development
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    // Ensure NEXT_PUBLIC_API_URL is not set (local dev mode)
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    }
  });

  it('should have empty API_BASE in local development', () => {
    // Re-import to get fresh values
    jest.resetModules();
    const { API_BASE } = require('@/lib/api');
    
    expect(API_BASE).toBe('');
  });

  it('should construct correct URLs without double /api prefix', () => {
    jest.resetModules();
    const { buildApiUrl } = require('@/lib/api');
    
    const url = buildApiUrl('/api/groups/1/forms');
    
    // Should be relative URL (no host, no double /api)
    expect(url).toBe('/api/groups/1/forms');
    expect(url).not.toContain('/api/api/');
  });

  it('should construct correct URLs for different endpoints', () => {
    jest.resetModules();
    const { buildApiUrl } = require('@/lib/api');
    
    const testCases = [
      { input: '/api/health', expected: '/api/health' },
      { input: '/api/groups/1/forms', expected: '/api/groups/1/forms' },
      { input: '/api/forms/123/submissions', expected: '/api/forms/123/submissions' },
    ];

    testCases.forEach(({ input, expected }) => {
      const url = buildApiUrl(input);
      expect(url).toBe(expected);
      expect(url).not.toContain('/api/api/');
    });
  });

  it('should use absolute URL when NEXT_PUBLIC_API_URL is set (production)', () => {
    // Simulate production environment
    process.env.NEXT_PUBLIC_API_URL = 'https://api.worktree.pro';
    
    jest.resetModules();
    const { API_BASE, buildApiUrl } = require('@/lib/api');
    
    expect(API_BASE).toBe('https://api.worktree.pro');
    
    const url = buildApiUrl('/api/groups/1/forms');
    expect(url).toBe('https://api.worktree.pro/api/groups/1/forms');
  });
});
