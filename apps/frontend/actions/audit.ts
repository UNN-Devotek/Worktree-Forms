"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Fetches audit logs for a project.
 * 
 * SECURITY: Only project owners can access audit logs.
 * Non-owners will receive a 403 Forbidden error.
 * 
 * @param projectSlug - Project slug
 * @param page - Page number (1-indexed)
 * @param limit - Results per page
 * @param actionFilter - Optional filter by action type
 */
export async function getAuditLogs(
  projectSlug: string,
  page = 1,
  limit = 50,
  actionFilter?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Get project and verify ownership
  const project = await db.project.findUnique({
    where: { slug: projectSlug },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  // RBAC Check: Only owners can view audit logs
  const member = project.members[0];
  if (!member || !member.roles.includes("OWNER")) {
    return { error: "Forbidden: Only project owners can view audit logs" };
  }

  // Fetch logs with pagination and filtering
  const where = {
    projectId: project.id,
    ...(actionFilter && { action: actionFilter }),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { 
        user: { 
          select: { 
            name: true, 
            email: true,
            image: true,
          } 
        } 
      },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Exports audit logs as CSV for compliance.
 * 
 * SECURITY: Only project owners can export.
 * 
 * @param projectSlug - Project slug
 */
export async function exportAuditLogs(projectSlug: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Verify ownership (same as getAuditLogs)
  const project = await db.project.findUnique({
    where: { slug: projectSlug },
    include: { 
      members: { 
        where: { userId: session.user.id } 
      } 
    },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  if (!project.members[0]?.roles.includes("OWNER")) {
    return { error: "Forbidden: Only project owners can export audit logs" };
  }

  const logs = await db.auditLog.findMany({
    where: { projectId: project.id },
    include: { 
      user: { 
        select: { 
          name: true, 
          email: true 
        } 
      } 
    },
    orderBy: { timestamp: 'desc' },
  });

  // Convert to CSV
  const csvRows = [
    'Timestamp,User,Email,Action,Resource,Details,IP Address',
    ...logs.map(log => {
      const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
      return `"${log.timestamp.toISOString()}","${log.user.name || 'Unknown'}","${log.user.email}","${log.action}","${log.resource}","${details}","${log.ipAddress || 'N/A'}"`;
    }),
  ];

  const csv = csvRows.join('\n');

  return { csv, filename: `audit-log-${project.slug}-${new Date().toISOString().split('T')[0]}.csv` };
}

/**
 * Gets unique action types for filter dropdown.
 * 
 * SECURITY: Only project owners can access.
 */
export async function getAuditActionTypes(projectSlug: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const project = await db.project.findUnique({
    where: { slug: projectSlug },
    include: { members: { where: { userId: session.user.id } } },
  });

  if (!project || !project.members[0]?.roles.includes("OWNER")) {
    return { error: "Forbidden" };
  }

  const actions = await db.auditLog.findMany({
    where: { projectId: project.id },
    select: { action: true },
    distinct: ['action'],
    orderBy: { action: 'asc' },
  });

  return { actions: actions.map(a => a.action) };
}
