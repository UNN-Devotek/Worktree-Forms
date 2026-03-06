import { Request, Response, NextFunction } from 'express';
import { AuditLogEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

/**
 * Audit log middleware -- records successful mutations to the AuditLog table.
 * Apply after auth middleware on routes you want to audit.
 * Usage: router.post('/resource', auditMiddleware('resource.create'), handler)
 */
export function auditMiddleware(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    (res as any).json = function (body: unknown) {
      const result = originalJson(body);

      // Only log successful mutations (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = (req as any).user?.id as string | undefined;
        const projectId = req.params.projectId || req.body?.projectId || 'global';
        if (userId) {
          AuditLogEntity.create({
            auditId: nanoid(),
            projectId,
            userId,
            action,
            entityType: req.path,
            details: { method: req.method, body: sanitizeBody(req.body) },
            ipAddress: req.ip || req.socket?.remoteAddress,
          })
            .go()
            .catch((err: Error) => console.error('Audit log write failed (non-blocking):', err.message));
        }
      }

      return result;
    };

    next();
  };
}

/**
 * Security event middleware -- records 401/403 responses to the AuditLog table.
 * Apply on routes where authentication or authorization failures should be tracked.
 * Usage: router.post('/resource', auditSecurityEvent('resource.access'), handler)
 */
export function auditSecurityEvent(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    (res as any).json = function (body: unknown) {
      const result = originalJson(body);

      if (res.statusCode === 401 || res.statusCode === 403) {
        const userId = ((req as any).user?.id as string) ?? 'anonymous';
        const projectId = req.params.projectId || 'global';
        AuditLogEntity.create({
          auditId: nanoid(),
          projectId,
          userId,
          action: `${action}:${res.statusCode}`,
          entityType: req.path,
          details: { method: req.method, status: res.statusCode, ip: req.ip },
          ipAddress: req.ip || req.socket?.remoteAddress,
        })
          .go()
          .catch((err: Error) => console.error('Security audit log failed:', err.message));
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
