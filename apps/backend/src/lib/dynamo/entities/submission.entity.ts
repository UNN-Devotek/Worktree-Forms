// PK: PROJECT#<projectId> SK: SUBMISSION#<submissionId>
// GSI1PK: FORM#<formId> GSI1SK: <createdAt> (list submissions by form)
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const SubmissionEntity = new Entity(
  {
    model: { entity: "submission", version: "1", service: "worktree" },
    attributes: {
      submissionId: { type: "string", required: true },
      formId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      data: { type: "any", default: () => ({}) },
      status: { type: "string", default: "PENDING" },
      submittedBy: { type: "string" },
      routeStopId: { type: "string" },
      deviceId: { type: "string" },
      syncStatus: { type: "string", default: "SYNCED" },
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
          composite: ["submissionId"],
          template: "SUBMISSION#${submissionId}",
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
          composite: ["createdAt"],
          template: "${createdAt}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
