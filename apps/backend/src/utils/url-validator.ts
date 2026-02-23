import { URL } from 'url';

export function isAllowedWebhookUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  // Block non-http(s) schemes (file://, gopher://, ftp://, etc.)
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;

  // In production, only allow HTTPS
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') return false;

  // Normalize: strip IPv6 brackets and trailing FQDN dot
  const hostname = parsed.hostname.toLowerCase()
    .replace(/^\[|\]$/g, '')  // remove IPv6 brackets: [::1] -> ::1
    .replace(/\.$/, '');       // remove trailing dot: localhost. -> localhost

  // Block private/internal IP ranges and hostnames
  const blockedPatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^0\.0\.0\.0$/,
    /^::1$/,                                           // IPv6 loopback (brackets already stripped)
    /^fc00:/i,                                         // IPv6 ULA (brackets already stripped)
    /^fe80:/i,                                         // IPv6 link-local (brackets already stripped)
    /^::ffff:127\./i,                                  // IPv4-mapped loopback
    /^::ffff:7f/i,                                     // IPv4-mapped loopback hex
    /^169\.254\./,                                     // link-local
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,      // CGNAT
  ];

  if (blockedPatterns.some(re => re.test(hostname))) return false;

  return true;
}
