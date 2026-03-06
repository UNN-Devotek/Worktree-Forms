// PK: PROJECT#<projectId> SK: PROJECT
// GSI1PK: <slug> GSI1SK: PROJECT (lookup by slug)
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const ProjectEntity = new Entity(
  {
    model: { entity: "project", version: "1", service: "worktree" },
    attributes: {
      projectId: { type: "string", required: true },
      slug: { type: "string", required: true },
      name: { type: "string", required: true },
      description: { type: "string" },
      ownerId: { type: "string", required: true },
      logoKey: { type: "string" },
      storageUsedBytes: { type: "number", default: 0 },
      storageQuotaBytes: { type: "number", default: 10737418240 },
      settings: { type: "any", default: () => ({}) },
      createdAt: {
        type: "string",
        default: () => new Date().toISOString(),
      },
      updatedAt: {
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
        sk: { field: "SK", composite: [], template: "PROJECT" },
      },
      bySlug: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["slug"],
          template: "${slug}",
        },
        sk: { field: "GSI1SK", composite: [], template: "PROJECT" },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
