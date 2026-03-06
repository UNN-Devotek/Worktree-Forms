// PK: PROJECT#<projectId> SK: WEBHOOK#<webhookId>
// GSI1PK: WEBHOOKS#<projectId> GSI1SK: <createdAt>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const WebhookEntity = new Entity(
  {
    model: { entity: "webhook", version: "1", service: "worktree" },
    attributes: {
      webhookId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      url: { type: "string", required: true },
      events: {
        type: "list",
        items: { type: "string" },
        default: () => [],
      },
      secret: { type: "string" },
      isActive: { type: "boolean", default: true },
      createdBy: { type: "string" },
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
          composite: ["webhookId"],
          template: "WEBHOOK#${webhookId}",
        },
      },
      byProject: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["projectId"],
          template: "WEBHOOKS#${projectId}",
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
