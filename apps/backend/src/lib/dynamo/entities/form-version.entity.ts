// PK: PROJECT#<projectId> SK: FORMVERSION#<formId>#<version>
// GSI1PK: FORM#<formId> GSI1SK: VERSION#<version>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const FormVersionEntity = new Entity(
  {
    model: { entity: "formVersion", version: "1", service: "worktree" },
    attributes: {
      formId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      version: { type: "number", required: true },
      schema: { type: "any", required: true },
      changelog: { type: "string" },
      createdBy: { type: "string" },
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
          composite: ["formId", "version"],
          template: "FORMVERSION#${formId}#${version}",
        },
      },
      byForm: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["formId"],
          template: "FORM#${formId}",
        },
        sk: {
          field: "GSI1SK",
          composite: ["version"],
          template: "VERSION#${version}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
