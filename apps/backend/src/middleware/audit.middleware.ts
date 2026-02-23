import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';

/**
 * Audit log middleware — records successful mutations to the AuditLog table.
 * Apply after auth middleware on routes you want to audit.
 * Usage: router.post('/resource', auditMiddleware('resource.create'), handler)
 */
export function auditMiddleware(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    (res as any).json = function(body: unknown) {
      const result = originalJson(body);

      // Only log successful mutations (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = (req as any).user?.id;
        if (userId) {
          prisma.auditLog.create({
            data: {
              userId,
              action,
              resource: req.path,
              details: JSON.stringify({ method: req.method, body: sanitizeBody(req.body) }),
              ipAddress: req.ip || req.socket?.remoteAddress,
              userAgent: req.headers['user-agent'],
            }
          }).catch((err: Error) => console.error('Audit log write failed (non-blocking):', err.message));
        }
      }

      return result;
    };

    next();
  };
}

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return {};
  const sanitized = { ...(body as Record<string, unknown>) };
  for (const field of ['password', 'token', 'secret', 'key', 'auth']) {
    if (field in sanitized) sanitized[field] = '[REDACTED]';
  }
  return sanitized;
}
