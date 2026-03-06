import { auth } from "@/auth";
import { ProjectMemberEntity } from "@/lib/dynamo";

export type ProjectRole = "VIEWER" | "EDITOR" | "ADMIN" | "OWNER";

const ROLE_HIERARCHY: ProjectRole[] = ["VIEWER", "EDITOR", "ADMIN", "OWNER"];

/**
 * Check whether any of the given user roles meets or exceeds the minimum required role.
 * Exported for use in Server Actions and for unit testing.
 */
export function hasRole(userRoles: string[], minRole: ProjectRole): boolean {
  const minIndex = ROLE_HIERARCHY.indexOf(minRole);
  return userRoles.some(
    (role) => ROLE_HIERARCHY.indexOf(role as ProjectRole) >= minIndex
  );
}

/**
 * Server-side RBAC guard for Next.js Server Actions and Route Handlers.
 *
 * Verifies the current session user is a member of the given project
 * and holds at least the specified minimum role. Throws on failure.
 *
 * @returns The matched membership record and the authenticated userId.
 */
export async function requireProjectAccessServer(
  projectId: string,
  minRole: ProjectRole = "VIEWER"
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const result = await ProjectMemberEntity.query
    .primary({ projectId, userId: session.user.id })
    .go();
  const member = result.data[0];

  if (!member) {
    throw new Error("Forbidden: Not a project member");
  }

  if (!hasRole(member.roles ?? [], minRole)) {
    throw new Error(`Forbidden: Requires ${minRole} role`);
  }

  return { member, userId: session.user.id };
}
