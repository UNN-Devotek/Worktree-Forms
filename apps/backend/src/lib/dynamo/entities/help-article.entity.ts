// PK: HELPARTICLE#<articleId> SK: HELPARTICLE
// GSI1PK: HELPCATEGORY#<category> GSI1SK: <publishedAt>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const HelpArticleEntity = new Entity(
  {
    model: { entity: "helpArticle", version: "1", service: "worktree" },
    attributes: {
      articleId: { type: "string", required: true },
      title: { type: "string", required: true },
      content: { type: "string" },
      category: { type: "string", default: "general" },
      status: { type: "string", default: "DRAFT" },
      authorId: { type: "string" },
      publishedAt: { type: "string" },
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
          composite: ["articleId"],
          template: "HELPARTICLE#${articleId}",
        },
        sk: { field: "SK", composite: [], template: "HELPARTICLE" },
      },
      byCategory: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["category"],
          template: "HELPCATEGORY#${category}",
        },
        sk: {
          field: "GSI1SK",
          composite: ["publishedAt"],
          template: "${publishedAt}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
