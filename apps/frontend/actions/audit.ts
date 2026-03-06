"use server";

import { auth } from "@/auth";
import { ProjectEntity, ProjectMemberEntity, AuditLogEntity, UserEntity } from "@/lib/dynamo";

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

  // Get project by slug
  const projectResult = await ProjectEntity.query.bySlug({ slug: projectSlug }).go();
  const project = projectResult.data[0];

  if (!project) {
    return { error: "Project not found" };
  }

  // Check membership and RBAC
  const memberResult = await ProjectMemberEntity.query.primary({ projectId: project.projectId }).go();
  const member = memberResult.data.find((m) => m.userId === session.user!.id);

  if (!member || !(member.roles ?? []).includes("OWNER")) {
    return { error: "Forbidden: Only project owners can view audit logs" };
  }

  // Fetch logs for the project (sorted by SK which includes createdAt)
  let logsResult = await AuditLogEntity.query.primary({ projectId: project.projectId }).go();
  let logs = logsResult.data;

  // Apply action filter if provided
  if (actionFilter) {
    logs = logs.filter((log) => log.action === actionFilter);
  }

  const total = logs.length;

  // Sort descending by createdAt
  logs.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  // Manual pagination
  const paginatedLogs = logs.slice((page - 1) * limit, page * limit);

  // Enrich with user info
  const uniqueUserIds = [...new Set(paginatedLogs.map((l) => l.userId).filter(Boolean))];
  const userResults = await Promise.all(
    uniqueUserIds.map((uid) => UserEntity.query.primary({ userId: uid! }).go())
  );
  const userMap = new Map(
    userResults.map((r) => {
      const u = r.data[0];
      return [u?.userId, { name: u?.name ?? "Unknown", email: u?.email ?? "", image: u?.avatarKey ?? null }];
    })
  );

  const enrichedLogs = paginatedLogs.map((log) => ({
    id: log.auditId,
    timestamp: log.createdAt,
    action: log.action,
    resource: log.entityType ?? "",
    details: log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : null,
    ipAddress: log.ipAddress ?? null,
    user: userMap.get(log.userId ?? "") ?? { name: "Unknown", email: "", image: null },
  }));

  return {
    logs: enrichedLogs,
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

  const projectResult = await ProjectEntity.query.bySlug({ slug: projectSlug }).go();
  const project = projectResult.data[0];

  if (!project) {
    return { error: "Project not found" };
  }

  const memberResult = await ProjectMemberEntity.query.primary({ projectId: project.projectId }).go();
  const member = memberResult.data.find((m) => m.userId === session.user!.id);

  if (!member || !(member.roles ?? []).includes("OWNER")) {
    return { error: "Forbidden: Only project owners can export audit logs" };
  }

  const logsResult = await AuditLogEntity.query.primary({ projectId: project.projectId }).go();
  const logs = logsResult.data.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  // Enrich with user info
  const uniqueUserIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))];
  const userResults = await Promise.all(
    uniqueUserIds.map((uid) => UserEntity.query.primary({ userId: uid! }).go())
  );
  const userMap = new Map(
    userResults.map((r) => {
      const u = r.data[0];
      return [u?.userId, { name: u?.name ?? "Unknown", email: u?.email ?? "" }];
    })
  );

  // Convert to CSV
  const csvRows = [
    'Timestamp,User,Email,Action,Resource,Details,IP Address',
    ...logs.map((log) => {
      const user = userMap.get(log.userId ?? "") ?? { name: "Unknown", email: "" };
      const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
      return `"${log.createdAt ?? ""}","${user.name}","${user.email}","${log.action}","${log.entityType ?? ""}","${details}","${log.ipAddress || 'N/A'}"`;
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

  const projectResult = await ProjectEntity.query.bySlug({ slug: projectSlug }).go();
  const project = projectResult.data[0];

  if (!project) {
    return { error: "Forbidden" };
  }

  const memberResult = await ProjectMemberEntity.query.primary({ projectId: project.projectId }).go();
  const member = memberResult.data.find((m) => m.userId === session.user!.id);

  if (!member || !(member.roles ?? []).includes("OWNER")) {
    return { error: "Forbidden" };
  }

  const logsResult = await AuditLogEntity.query.primary({ projectId: project.projectId }).go();
  const actions = [...new Set(logsResult.data.map((l) => l.action))].sort();

  return { actions };
}
