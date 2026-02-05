/**
 * Type-safe audit event definitions.
 * Each event type has a specific structure to ensure consistency.
 */
export type AuditEventDetails =
  | { type: 'INVITE_SENT'; email: string; roles: string[] }
  | { type: 'INVITE_REVOKED'; email: string }
  | { type: 'ROLE_CHANGED'; userId: string; oldRoles: string[]; newRoles: string[] }
  | { type: 'USER_REMOVED'; userId: string; userName: string }
  | { type: 'PROJECT_CREATED'; projectName: string; slug: string }
  | { type: 'PROJECT_DELETED'; projectName: string; slug: string }
  | { type: 'PROJECT_RENAMED'; oldName: string; newName: string }
  | { type: 'USER_REGISTERED'; email: string }; // Global event (projectId = null)

/**
 * Audit action constants for consistency.
 */
export const AUDIT_ACTIONS = {
  INVITE_SENT: 'INVITE_SENT',
  INVITE_REVOKED: 'INVITE_REVOKED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  USER_REMOVED: 'USER_REMOVED',
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_DELETED: 'PROJECT_DELETED',
  PROJECT_RENAMED: 'PROJECT_RENAMED',
  USER_REGISTERED: 'USER_REGISTERED',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
