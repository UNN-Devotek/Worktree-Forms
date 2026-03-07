import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authenticate.js";
import { ProjectMemberEntity } from "../lib/dynamo/index.js";

export type ProjectRole = "VIEWER" | "EDITOR" | "ADMIN" | "OWNER";

const ROLE_HIERARCHY: ProjectRole[] = ["VIEWER", "EDITOR", "ADMIN", "OWNER"];

/**
 * Check whether any of the given user roles meets or exceeds the minimum required role.
 */
export function hasRole(userRoles: string[], minRole: ProjectRole): boolean {
  const minIndex = ROLE_HIERARCHY.indexOf(minRole);
  return userRoles.some(
    (role) => ROLE_HIERARCHY.indexOf(role as ProjectRole) >= minIndex
  );
}

/**
 * Express middleware that enforces project-level RBAC.
 *
 * Extracts `projectId` from route params, body, or query string, then
 * looks up the authenticated user's membership in `ProjectMemberEntity`.
 * Rejects with 401/400/403 when access cannot be verified.
 *
 * On success, attaches `req.projectMember` for downstream handlers.
 */
export function requireProjectAccess(minRole: ProjectRole = "VIEWER") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const projectId =
      req.params.projectId ??
      req.body?.projectId ??
      (req.query.projectId as string | undefined);

    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized" });
    }

    if (!projectId) {
      return res
        .status(400)
        .json({ success: false, error: "Missing projectId" });
    }

    try {
      const result = await ProjectMemberEntity.query
        .primary({ projectId, userId })
        .go();
      const member = result.data[0];

      if (!member) {
        return res
          .status(403)
          .json({ success: false, error: "Not a project member" });
      }

      if (!hasRole(member.roles ?? [], minRole)) {
        return res
          .status(403)
          .json({ success: false, error: `Requires ${minRole} role` });
      }

      // Attach membership info for downstream handlers
      (req as AuthenticatedRequest & { projectMember: typeof member }).projectMember =
        member;
      next();
    } catch (error) {
      console.error("[RBAC]", error);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  };
}
