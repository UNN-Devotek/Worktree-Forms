// PK: SHEET#<sheetId> SK: COLUMN#<columnId>
// GSI1PK: SHEET#<sheetId> GSI1SK: COLORDER#<order>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const SheetColumnEntity = new Entity(
  {
    model: { entity: "sheetColumn", version: "1", service: "worktree" },
    attributes: {
      columnId: { type: "string", required: true },
      sheetId: { type: "string", required: true },
      name: { type: "string", required: true },
      type: { type: "string", default: "TEXT" },
      order: { type: "number", default: 0 },
      width: { type: "number", default: 150 },
      projectId: { type: "string" },
      config: { type: "any", default: () => ({}) },
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
          composite: ["columnId"],
          template: "COLUMN#${columnId}",
        },
      },
      byOrder: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["sheetId"],
          template: "SHEET#${sheetId}",
        },
        sk: {
          field: "GSI1SK",
          composite: ["order"],
          template: "COLORDER#${order}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
