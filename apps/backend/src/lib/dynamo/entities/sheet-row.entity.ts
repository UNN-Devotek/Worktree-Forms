// PK: SHEET#<sheetId> SK: ROW#<rowId>
// GSI1PK: ROWS#<sheetId> GSI1SK: <createdAt>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const SheetRowEntity = new Entity(
  {
    model: { entity: "sheetRow", version: "1", service: "worktree" },
    attributes: {
      rowId: { type: "string", required: true },
      sheetId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      data: { type: "any", default: () => ({}) },
      parentRowId: { type: "string" },
      order: { type: "number", default: 0 },
      assignedTo: { type: "string" },
      status: { type: "string" },
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
          composite: ["sheetId"],
          template: "SHEET#${sheetId}",
        },
        sk: {
          field: "SK",
          composite: ["rowId"],
          template: "ROW#${rowId}",
        },
      },
      bySheet: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["sheetId"],
          template: "ROWS#${sheetId}",
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
