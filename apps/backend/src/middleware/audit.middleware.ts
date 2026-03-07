import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate.js';
import { AuditLogEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

/**
 * Audit log middleware -- records successful mutations to the AuditLog table.
 * Uses res.on('finish') to avoid monkey-patching res.json, which can conflict
 * with other middleware that also wraps the response.
 * Usage: router.post('/resource', auditMiddleware('resource.create'), handler)
 */
export function auditMiddleware(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      // Only log successful mutations (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = (req as AuthenticatedRequest).user?.id;
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
    });

    next();
  };
}

/**
 * Security event middleware -- records 401/403 responses to the AuditLog table.
 * Uses res.on('finish') to avoid monkey-patching res.json.
 * Usage: router.post('/resource', auditSecurityEvent('resource.access'), handler)
 */
export function auditSecurityEvent(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        const userId = (req as AuthenticatedRequest).user?.id ?? 'anonymous';
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
    });

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
