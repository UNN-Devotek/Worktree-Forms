// PK: PROJECT#<projectId> SK: TASK#<taskId>
// GSI1PK: TASKS#<projectId> GSI1SK: <dueDate>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const TaskEntity = new Entity(
  {
    model: { entity: "task", version: "1", service: "worktree" },
    attributes: {
      taskId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      title: { type: "string", required: true },
      description: { type: "string" },
      taskType: { type: "string", default: "GENERAL" },
      status: { type: "string", default: "ACTIVE" },
      priority: { type: "string", default: "MEDIUM" },
      assignedTo: { type: "string" },
      dueDate: { type: "string" },
      startDate: { type: "string" },
      assignees: { type: "any" },
      attachments: { type: "any" },
      mentions: { type: "any" },
      images: { type: "any" },
      linkedEntityId: { type: "string" },
      linkedEntityType: { type: "string" },
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
          composite: ["taskId"],
          template: "TASK#${taskId}",
        },
      },
      byProject: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["projectId"],
          template: "TASKS#${projectId}",
        },
        sk: {
          field: "GSI1SK",
          composite: ["dueDate"],
          template: "${dueDate}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
