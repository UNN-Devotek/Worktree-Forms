// PK: PROJECT#<projectId> SK: SHEET#<sheetId>
// GSI1PK: SHEETS#<projectId> GSI1SK: <createdAt>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const SheetEntity = new Entity(
  {
    model: { entity: "sheet", version: "1", service: "worktree" },
    attributes: {
      sheetId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      name: { type: "string", required: true },
      description: { type: "string" },
      icon: { type: "string" },
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
          composite: ["sheetId"],
          template: "SHEET#${sheetId}",
        },
      },
      byProject: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["projectId"],
          template: "SHEETS#${projectId}",
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
