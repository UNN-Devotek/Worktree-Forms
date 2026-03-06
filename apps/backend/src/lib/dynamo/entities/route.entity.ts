// PK: PROJECT#<projectId> SK: ROUTE#<routeId>
// GSI1PK: ROUTES#<projectId> GSI1SK: <scheduledDate>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const RouteEntity = new Entity(
  {
    model: { entity: "route", version: "1", service: "worktree" },
    attributes: {
      routeId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      name: { type: "string", required: true },
      description: { type: "string" },
      assignedTo: { type: "string" },
      scheduledDate: { type: "string" },
      status: { type: "string", default: "PENDING" },
      geofenceConfig: { type: "any" },
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
          composite: ["routeId"],
          template: "ROUTE#${routeId}",
        },
      },
      byProject: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["projectId"],
          template: "ROUTES#${projectId}",
        },
        sk: {
          field: "GSI1SK",
          composite: ["scheduledDate"],
          template: "${scheduledDate}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
