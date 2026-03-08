import { describe, it, expect, afterEach, vi } from 'vitest';
import { isAllowedWebhookUrl } from '../../utils/url-validator.js';

/**
 * isAllowedWebhookUrl — SSRF blocklist validation.
 * Pure function: no DynamoDB, no mocks needed.
 */
describe('isAllowedWebhookUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // --- Valid URLs ---
  it('[P0] allows public HTTPS URLs', () => {
    expect(isAllowedWebhookUrl('https://example.com/hook')).toBe(true);
    expect(isAllowedWebhookUrl('https://api.github.com/webhooks')).toBe(true);
    expect(isAllowedWebhookUrl('https://hooks.slack.com/services/T00/B00/xxx')).toBe(true);
  });

  it('[P0] allows public HTTP URLs in non-production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isAllowedWebhookUrl('http://example.com/hook')).toBe(true);
  });

  // --- Blocked: localhost / loopback ---
  it('[P0] blocks localhost', () => {
    expect(isAllowedWebhookUrl('http://localhost/hook')).toBe(false);
    expect(isAllowedWebhookUrl('https://localhost:8080/hook')).toBe(false);
  });

  it('[P0] blocks 127.x.x.x loopback', () => {
    expect(isAllowedWebhookUrl('http://127.0.0.1/secret')).toBe(false);
    expect(isAllowedWebhookUrl('http://127.1.2.3/secret')).toBe(false);
  });

  it('[P0] blocks IPv6 loopback ::1', () => {
    expect(isAllowedWebhookUrl('http://[::1]/hook')).toBe(false);
  });

  // --- Blocked: private ranges ---
  it('[P0] blocks 10.x.x.x private range', () => {
    expect(isAllowedWebhookUrl('http://10.0.0.1/internal')).toBe(false);
    expect(isAllowedWebhookUrl('https://10.255.255.255/api')).toBe(false);
  });

  it('[P0] blocks 192.168.x.x private range', () => {
    expect(isAllowedWebhookUrl('http://192.168.1.1/router')).toBe(false);
  });

  it('[P0] blocks 172.16-31.x.x private range', () => {
    expect(isAllowedWebhookUrl('http://172.16.0.1/internal')).toBe(false);
    expect(isAllowedWebhookUrl('http://172.31.255.255/internal')).toBe(false);
  });

  it('[P1] allows 172.15.x.x (outside private range)', () => {
    expect(isAllowedWebhookUrl('http://172.15.0.1/ok')).toBe(true);
  });

  it('[P1] allows 172.32.x.x (outside private range)', () => {
    expect(isAllowedWebhookUrl('http://172.32.0.1/ok')).toBe(true);
  });

  // --- Blocked: other dangerous ranges ---
  it('[P0] blocks 0.0.0.0', () => {
    expect(isAllowedWebhookUrl('http://0.0.0.0/hook')).toBe(false);
  });

  it('[P1] blocks link-local 169.254.x.x (metadata service)', () => {
    expect(isAllowedWebhookUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
  });

  it('[P1] blocks CGNAT 100.64-127.x range', () => {
    expect(isAllowedWebhookUrl('http://100.64.0.1/hook')).toBe(false);
    expect(isAllowedWebhookUrl('http://100.127.255.255/hook')).toBe(false);
  });

  // --- Blocked: bad schemes ---
  it('[P0] blocks file:// scheme', () => {
    expect(isAllowedWebhookUrl('file:///etc/passwd')).toBe(false);
  });

  it('[P0] blocks ftp:// scheme', () => {
    expect(isAllowedWebhookUrl('ftp://example.com/file')).toBe(false);
  });

  it('[P0] blocks unparseable URLs', () => {
    expect(isAllowedWebhookUrl('not-a-url')).toBe(false);
    expect(isAllowedWebhookUrl('')).toBe(false);
    expect(isAllowedWebhookUrl('://broken')).toBe(false);
  });

  // --- Production: HTTP blocked ---
  it('[P1] blocks plain HTTP in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(isAllowedWebhookUrl('http://example.com/hook')).toBe(false);
  });
});
