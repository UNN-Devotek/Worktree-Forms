// PK: ROUTE#<routeId> SK: STOP#<stopId>
// GSI1PK: PROJECT#<projectId> GSI1SK: ROUTESTOP#<routeId>#<stopId>
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client.js";

export const RouteStopEntity = new Entity(
  {
    model: { entity: "routeStop", version: "1", service: "worktree" },
    attributes: {
      stopId: { type: "string", required: true },
      routeId: { type: "string", required: true },
      projectId: { type: "string", required: true },
      name: { type: "string" },
      address: { type: "string" },
      latitude: { type: "number" },
      longitude: { type: "number" },
      order: { type: "number", default: 0 },
      formId: { type: "string" },
      status: { type: "string", default: "PENDING" },
      completedAt: { type: "string" },
      createdAt: {
        type: "string",
        default: () => new Date().toISOString(),
      },
    },
    indexes: {
      primary: {
        pk: {
          field: "PK",
          composite: ["routeId"],
          template: "ROUTE#${routeId}",
        },
        sk: {
          field: "SK",
          composite: ["stopId"],
          template: "STOP#${stopId}",
        },
      },
      byProject: {
        index: "GSI1",
        pk: {
          field: "GSI1PK",
          composite: ["projectId"],
          template: "PROJECT#${projectId}",
        },
        sk: {
          field: "GSI1SK",
          composite: ["routeId", "stopId"],
          template: "ROUTESTOP#${routeId}#${stopId}",
        },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
