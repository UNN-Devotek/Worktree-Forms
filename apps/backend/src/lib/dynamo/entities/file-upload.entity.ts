// PK: PROJECT#<projectId> SK: FILE#<fileId>
// GSI1PK: SUBMISSION#<submissionId> GSI1SK: FILE#<fileId>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const FileUploadEntity = new Entity(
  {
    model: { entity: "fileUpload", version: "1", service: "worktree" },
    attributes: {
      fileId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      submissionId: { type: "string" },
      objectKey: { type: "string", required: true },
      originalName: { type: "string" },
      mimeType: { type: "string" },
      sizeBytes: { type: "number" },
      uploadedBy: { type: "string" },
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
          composite: ["fileId"],
          template: "FILE#${fileId}",
        },
      },
      bySubmission: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["submissionId"],
          template: "SUBMISSION#${submissionId}",
        },
        sk: {
          field: "GSI1SK",
          composite: ["fileId"],
          template: "FILE#${fileId}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
