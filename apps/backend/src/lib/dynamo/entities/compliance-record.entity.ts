// PK: PROJECT#<projectId> SK: COMPLIANCE#<recordId>
// GSI1PK: USER#<userId> GSI1SK: COMPLIANCE#<createdAt>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const ComplianceRecordEntity = new Entity(
  {
    model: { entity: "complianceRecord", version: "1", service: "worktree" },
    attributes: {
      recordId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      userId: { type: "string", required: true },
      type: { type: "string", required: true },
      status: { type: "string", default: "PENDING" },
      data: { type: "any", default: () => ({}) },
      expiresAt: { type: "string" },
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
        sk: {
          field: "SK",
          composite: ["recordId"],
          template: "COMPLIANCE#${recordId}",
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
          template: "COMPLIANCE#${createdAt}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
