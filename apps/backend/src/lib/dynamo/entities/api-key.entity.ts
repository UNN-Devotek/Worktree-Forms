// PK: APIKEY#<keyHash> SK: APIKEY
// GSI1PK: PROJECT#<projectId> GSI1SK: APIKEY#<createdAt>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const ApiKeyEntity = new Entity(
  {
    model: { entity: "apiKey", version: "1", service: "worktree" },
    attributes: {
      keyHash: { type: "string", required: true },
      projectId: { type: "string", required: true },
      name: { type: "string" },
      scopes: {
        type: "list",
        items: { type: "string" },
        default: () => ["READ"],
      },
      lastUsedAt: { type: "string" },
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
          composite: ["keyHash"],
          template: "APIKEY#${keyHash}",
        },
        sk: { field: "SK", composite: [], template: "APIKEY" },
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
          composite: ["createdAt"],
          template: "APIKEY#${createdAt}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
