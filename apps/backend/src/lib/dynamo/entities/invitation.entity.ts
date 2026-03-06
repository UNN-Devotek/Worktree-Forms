// PK: PROJECT#<projectId>  SK: INVITE#<invitationId>
// GSI1PK: EMAIL#<email>    GSI1SK: PROJECT#<projectId>  (check if email already invited)
// Access patterns:
//   - List pending invitations for a project: query.primary({ projectId })
//   - Check if email already invited: query.byEmail({ email }) + filter projectId
//   - Accept by token: query by email GSI then filter by token attribute
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const InvitationEntity = new Entity(
  {
    model: { entity: "invitation", version: "1", service: "worktree" },
    attributes: {
      invitationId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      email: { type: "string", required: true },
      roles: {
        type: "list",
        items: { type: "string" },
        default: () => ["VIEWER"],
      },
      token: { type: "string", required: true },
      invitedBy: { type: "string", required: true },
      status: { type: "string", default: "PENDING" }, // PENDING | ACCEPTED | REVOKED
      expiresAt: { type: "string" },
      acceptedAt: { type: "string" },
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
          composite: ["invitationId"],
          template: "INVITE#${invitationId}",
        },
      },
      byEmail: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["email"],
          template: "EMAIL#${email}",
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
