// PK: TOKEN#<token> SK: TOKEN
// GSI1PK: PROJECT#<projectId> GSI1SK: TOKEN#<token>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const PublicTokenEntity = new Entity(
  {
    model: { entity: "publicToken", version: "1", service: "worktree" },
    attributes: {
      token: { type: "string", required: true },
      projectId: { type: "string", required: true },
      entityId: { type: "string" },
      entityType: { type: "string" },
      permissions: {
        type: "list",
        items: { type: "string" },
        default: () => ["READ"],
      },
      expiresAt: { type: "string" },
      createdBy: { type: "string" },
      createdAt: {
        type: "string",
        default: () => new Date().toISOString(),
      },
    },
    indexes: {
      primary: {
        pk: {
          field: "PK",
          composite: ["token"],
          template: "TOKEN#${token}",
        },
        sk: { field: "SK", composite: [], template: "TOKEN" },
      },
      byProject: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["projectId"],
          template: "PROJECT#${projectId}",
        },
        sk: {
          field: "GSI1SK",
          composite: ["token"],
          template: "TOKEN#${token}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
