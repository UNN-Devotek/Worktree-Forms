// PK: PROJECT#<projectId> SK: SYNC#<deviceId>#<submissionId>
// GSI1PK: DEVICE#<deviceId> GSI1SK: <syncedAt>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const SyncLedgerEntity = new Entity(
  {
    model: { entity: "syncLedger", version: "1", service: "worktree" },
    attributes: {
      deviceId: { type: "string", required: true },
      submissionId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      syncStatus: { type: "string", default: "PENDING" },
      retryCount: { type: "number", default: 0 },
      errorMessage: { type: "string" },
      syncedAt: { type: "string" },
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
          composite: ["deviceId", "submissionId"],
          template: "SYNC#${deviceId}#${submissionId}",
        },
      },
      byDevice: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["deviceId"],
          template: "DEVICE#${deviceId}",
        },
        sk: {
          field: "GSI1SK",
          composite: ["syncedAt"],
          template: "${syncedAt}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
