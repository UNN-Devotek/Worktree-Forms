import { Request, Response, NextFunction } from 'express';

/**
 * CSRF protection via Origin/Referer header validation.
 * For state-changing requests (POST, PUT, PATCH, DELETE), verifies that the
 * request originates from an allowed domain. Requests with no Origin/Referer
 * are rejected unless they come from a trusted server-side context (no browser header at all).
 *
 * Note: This provides defence-in-depth alongside SameSite cookies. It does NOT
 * require a CSRF token because the app uses JWT Bearer tokens (not cookies) for auth.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS || '';
  if (!raw) return [];
  return raw.split(',').map(o => o.trim()).filter(Boolean);
}

export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip safe methods
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  // Skip if no origin header (server-to-server calls, curl, Swagger UI with no origin)
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (!origin && !referer) {
    // No browser context — allow (API clients, internal services)
    next();
    return;
  }

  const allowedOrigins = getAllowedOrigins();

  // In development with no ALLOWED_ORIGINS configured, skip check
  if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  // Check origin header first
  if (origin) {
    if (allowedOrigins.includes(origin)) {
      next();
      return;
    }
    res.status(403).json({ success: false, error: 'CSRF check failed: origin not allowed' });
    return;
  }

  // Fall back to referer header
  if (referer) {
    const refererOrigin = (() => {
      try {
        const url = new URL(referer);
        return `${url.protocol}//${url.host}`;
      } catch {
        return null;
      }
    })();

    if (refererOrigin && allowedOrigins.includes(refererOrigin)) {
      next();
      return;
    }
    res.status(403).json({ success: false, error: 'CSRF check failed: referer not allowed' });
    return;
  }

  next();
}
