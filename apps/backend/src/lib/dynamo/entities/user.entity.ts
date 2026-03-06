// GSI1PK: email | GSI1SK: "USER" (lookup by email)
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const UserEntity = new Entity(
  {
    model: { entity: "user", version: "1", service: "worktree" },
    attributes: {
      userId: { type: "string", required: true },
      email: { type: "string", required: true },
      name: { type: "string" },
      passwordHash: { type: "string" },
      avatarKey: { type: "string" },
      role: { type: "string", default: "USER" },
      theme: { type: "string", default: "system" },
      locale: { type: "string", default: "en" },
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
          composite: ["userId"],
          template: "USER#${userId}",
        },
        sk: { field: "SK", composite: [], template: "USER" },
      },
      byEmail: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["email"],
          template: "${email}",
        },
        sk: { field: "GSI1SK", composite: [], template: "USER" },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
