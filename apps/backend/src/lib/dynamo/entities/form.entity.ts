// PK: PROJECT#<projectId> SK: FORM#<formId>
// GSI1PK: FORMS#<projectId> GSI1SK: <createdAt> (list forms by project)
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const FormEntity = new Entity(
  {
    model: { entity: "form", version: "1", service: "worktree" },
    attributes: {
      formId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      name: { type: "string", required: true },
      description: { type: "string" },
      schema: { type: "any", default: () => ({ pages: [] }) },
      currentVersion: { type: "number", default: 1 },
      status: { type: "string", default: "DRAFT" },
      namingTemplate: { type: "string" },
      targetSheetId: { type: "string" },
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
          composite: ["formId"],
          template: "FORM#${formId}",
        },
      },
      byProject: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["projectId"],
          template: "FORMS#${projectId}",
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
