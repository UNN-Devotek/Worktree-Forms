/**
 * DEPRECATED - PostgreSQL RLS helper
 *
 * This module was used with Prisma + PostgreSQL Row-Level Security.
 * The project has migrated to DynamoDB with ElectroDB.
 *
 * Access control is now enforced at the application layer via:
 * - Partition key scoping (projectId in PK/SK)
 * - requireProjectAccess() middleware
 * - ProjectMemberEntity membership checks
 *
 * This file is kept as a no-op stub to avoid breaking any remaining imports.
 */

export function getAuthenticatedDb(_userId: string, _projectId?: string): never {
  throw new Error(
    "getAuthenticatedDb() is deprecated. Use ElectroDB entities with projectId-scoped queries instead."
  );
}
