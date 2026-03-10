// PK: USER#<userId>           SK: FAVORITE#<itemType>#<itemId>
// GSI1PK: FAVORITE#<itemId>   GSI1SK: USER#<userId>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const FavoriteEntity = new Entity(
  {
    model: { entity: "favorite", version: "1", service: "worktree" },
    attributes: {
      userId: { type: "string", required: true },
      itemId: { type: "string", required: true },
      itemType: { type: "string", required: true },
      itemName: { type: "string" },
      projectId: { type: "string" },
      projectSlug: { type: "string" },
      createdAt: {
        type: "string",
        default: () => new Date().toISOString(),
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
          composite: ["itemType", "itemId"],
          template: "FAVORITE#${itemType}#${itemId}",
        },
      },
      byItem: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["itemId"],
          template: "FAVORITE#${itemId}",
        },
        sk: {
          field: "GSI1SK",
          composite: ["userId"],
          template: "USER#${userId}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
