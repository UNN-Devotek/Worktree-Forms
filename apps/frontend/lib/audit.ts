"use server";

import { headers } from 'next/headers';
import { auth } from '@/auth';
import { db } from '@/lib/database';
import type { AuditEventDetails } from './audit-types';

/**
 * Extracts client IP address from request headers.
 * Handles proxy chains, IPv6, and edge cases.
 * 
 * Priority order:
 * 1. X-Forwarded-For (takes FIRST IP = client, not last = proxy)
 * 2. X-Real-IP (single proxy)
 * 3. null (localhost/dev)
 */
function extractIpAddress(): string | null {
  try {
    const headersList = headers();
    
    // Check X-Forwarded-For (proxy chain)
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
      // Take FIRST IP (client), not last (proxy)
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      const clientIp = ips[0];
      if (clientIp && clientIp.length > 0) {
        return clientIp;
      }
    }
    
    // Check X-Real-IP (single proxy)
    const realIp = headersList.get('x-real-ip');
    if (realIp) {
      return realIp;
    }
    
    // Fallback (localhost in dev)
    return null;
  } catch (error) {
    // If header extraction fails, return null gracefully
    console.warn('[Audit] Failed to extract IP:', error);
    return null;
  }
}

/**
 * Creates an audit log entry.
 * 
 * IMPORTANT: This function fails silently if logging fails.
 * Audit logging should NEVER block user actions.
 * 
 * @param action - Action type (use AUDIT_ACTIONS constants)
 * @param resource - Resource type (e.g., "User", "Project")
 * @param details - Typed event details (optional)
 * @param projectId - Project ID for project-scoped events (optional, null for global)
 */
export async function createAuditLog({
  action,
  resource,
  details,
  projectId,
}: {
  action: string;
  resource: string;
  details?: AuditEventDetails;
  projectId?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.warn('[Audit] No session - skipping audit log');
      return;
    }

    const ipAddress = extractIpAddress();

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        projectId: projectId || null,
        action,
        resource,
        details: details || null,
        ipAddress,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should never block user actions
    console.error('[Audit] Failed to create audit log:', error);
  }
}
