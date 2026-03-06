// PK: PROJECT#<projectId> SK: EMBEDDING#<embeddingId>
// GSI1PK: SUBMISSION#<submissionId> GSI1SK: EMBEDDING#<embeddingId>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const VectorEmbeddingEntity = new Entity(
  {
    model: { entity: "vectorEmbedding", version: "1", service: "worktree" },
    attributes: {
      embeddingId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      submissionId: { type: "string" },
      pineconeId: { type: "string", required: true },
      textChunk: { type: "string" },
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
          composite: ["embeddingId"],
          template: "EMBEDDING#${embeddingId}",
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
          composite: ["embeddingId"],
          template: "EMBEDDING#${embeddingId}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
