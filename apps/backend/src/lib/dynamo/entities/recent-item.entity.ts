// PK: USER#<userId>           SK: RECENT#<accessedAt>#<itemId>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const RecentItemEntity = new Entity(
  {
    model: { entity: "recentItem", version: "1", service: "worktree" },
    attributes: {
      userId: { type: "string", required: true },
      itemId: { type: "string", required: true },
      itemType: { type: "string", required: true },
      itemName: { type: "string" },
      projectId: { type: "string" },
      projectSlug: { type: "string" },
      accessedAt: {
        type: "string",
        default: () => new Date().toISOString(),
      },
      ttl: {
        type: "number",
        default: () => Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
    },
    indexes: {
      primary: {
        pk: {
          field: "PK",
          composite: ["userId"],
          template: "USER#${userId}",
        },
        sk: {
          field: "SK",
          composite: ["accessedAt", "itemId"],
          template: "RECENT#${accessedAt}#${itemId}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
