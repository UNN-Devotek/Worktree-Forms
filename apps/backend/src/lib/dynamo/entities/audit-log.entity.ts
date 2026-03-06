// PK: PROJECT#<projectId> SK: AUDIT#<createdAt>#<auditId>
// GSI1PK: USER#<userId> GSI1SK: <createdAt>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const AuditLogEntity = new Entity(
  {
    model: { entity: "auditLog", version: "1", service: "worktree" },
    attributes: {
      auditId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      userId: { type: "string" },
      action: { type: "string", required: true },
      entityType: { type: "string" },
      entityId: { type: "string" },
      details: { type: "any" },
      ipAddress: { type: "string" },
      createdAt: {
        type: "string",
        default: () => new Date().toISOString(),
      },
    },
    indexes: {
      primary: {
        pk: {
          field: "PK",
          composite: ["projectId"],
          template: "PROJECT#${projectId}",
        },
        sk: {
          field: "SK",
          composite: ["createdAt", "auditId"],
          template: "AUDIT#${createdAt}#${auditId}",
        },
      },
      byUser: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["userId"],
          template: "USER#${userId}",
        },
        sk: {
          field: "GSI1SK",
          composite: ["createdAt"],
          template: "${createdAt}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
