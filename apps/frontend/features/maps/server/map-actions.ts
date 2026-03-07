'use server';

import { requireProjectAccessServer } from '@/lib/rbac';
import { RouteEntity, RouteStopEntity } from '@/lib/dynamo';

export async function getProjectRoutes(projectId: string) {
  await requireProjectAccessServer(projectId, 'VIEWER');
  const routes = await RouteEntity.query.byProject({ projectId }).go();
  return routes.data;
}

export async function getRouteStops(projectId: string, routeId: string) {
  await requireProjectAccessServer(projectId, 'VIEWER');
  const stops = await RouteStopEntity.query.primary({ routeId }).go();
  return stops.data;
}
