// PK: PROJECT#<projectId> SK: MEMBER#<userId>
// GSI1PK: USER#<userId> GSI1SK: PROJECT#<projectId> (list projects for user)
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const ProjectMemberEntity = new Entity(
  {
    model: { entity: "projectMember", version: "1", service: "worktree" },
    attributes: {
      projectId: { type: "string", required: true },
      userId: { type: "string", required: true },
      roles: {
        type: "list",
        items: { type: "string" },
        default: () => ["VIEWER"],
      },
      invitedBy: { type: "string" },
      email: { type: "string" },
      joinedAt: {
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
          composite: ["userId"],
          template: "MEMBER#${userId}",
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
          composite: ["projectId"],
          template: "PROJECT#${projectId}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
