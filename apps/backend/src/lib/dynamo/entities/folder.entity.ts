// Folders organize documents, specs, and files within a project.
// PK: PROJECT#<projectId>  SK: FOLDER#<folderId>
// GSI1PK: FOLDERS#<projectId>  GSI1SK: <name>  (list all folders, alphabetical)
// Subfolders: parentFolderId attribute (no nested PK -- use DynamoDB item collections)
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const FolderEntity = new Entity(
  {
    model: { entity: "folder", version: "1", service: "worktree" },
    attributes: {
      folderId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      name: { type: "string", required: true },
      parentFolderId: { type: "string" },
      description: { type: "string" },
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
          composite: ["folderId"],
          template: "FOLDER#${folderId}",
        },
      },
      byProject: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["projectId"],
          template: "FOLDERS#${projectId}",
        },
        sk: {
          field: "GSI1SK",
          composite: ["name"],
          template: "${name}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
