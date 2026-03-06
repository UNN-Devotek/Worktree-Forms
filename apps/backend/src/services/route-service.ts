import { ProjectEntity, RouteEntity, RouteStopEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

export class RouteService {
  /**
   * Get the route for a specific user and date.
   */
  static async getDailyRoute(projectIdOrSlug: string, userId: string, date: Date) {
    // Resolve Project ID from Slug if needed
    let projectId = projectIdOrSlug;
    const projectResult = await ProjectEntity.get({ projectId: projectIdOrSlug }).go();
    if (!projectResult.data) {
      // Try slug lookup
      const slugResult = await ProjectEntity.query.bySlug({ slug: projectIdOrSlug }).go();
      if (slugResult.data.length === 0) {
        throw new Error(`Project not found: ${projectIdOrSlug}`);
      }
      projectId = slugResult.data[0].projectId;
    }

    const dateStr = date.toISOString().slice(0, 10);

    // Query routes for project and filter by assignee and date
    const routeResult = await RouteEntity.query.byProject({ projectId }).go();
    const route = routeResult.data.find(
      (r) => r.assignedTo === userId && r.scheduledDate?.startsWith(dateStr),
    );

    if (!route) return null;

    // Get stops for this route
    const stopsResult = await RouteStopEntity.query.primary({ routeId: route.routeId }).go();
    const stops = stopsResult.data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return { ...route, stops };
  }

  /**
   * Create a route (Helper for dispatch/seeding)
   */
  static async createRoute(projectId: string, userId: string, date: Date, stops: Array<Record<string, unknown>>) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const routeId = nanoid();
    const routeResult = await RouteEntity.create({
      routeId,
      projectId,
      name: `Route for ${startOfDay.toISOString().slice(0, 10)}`,
      assignedTo: userId,
      scheduledDate: startOfDay.toISOString(),
      status: 'PUBLISHED',
    }).go();

    const createdStops = [];
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const stopResult = await RouteStopEntity.create({
        stopId: nanoid(),
        routeId,
        projectId,
        name: (stop.title as string) ?? `Stop ${i + 1}`,
        address: stop.address as string,
        latitude: stop.latitude as number,
        longitude: stop.longitude as number,
        order: i,
        formId: stop.formId as string,
        status: 'PENDING',
      }).go();
      createdStops.push(stopResult.data);
    }

    return { ...routeResult.data, stops: createdStops };
  }

  /**
   * Get a single route stop by ID.
   */
  static async getStop(routeId: string, stopId: string) {
    const result = await RouteStopEntity.get({ routeId, stopId }).go();
    return result.data;
  }

  /**
   * Update status of a stop with validation
   */
  static async updateStopStatus(routeId: string, stopId: string, status: string, location?: { lat: number; lng: number }) {
    const stopResult = await RouteStopEntity.get({ routeId, stopId }).go();
    if (!stopResult.data) throw new Error('Stop not found');

    const validStatuses = ['PENDING', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'];
    const normalizedStatus = status.toUpperCase().replace('-', '_');
    if (!validStatuses.includes(normalizedStatus)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const updates: Record<string, unknown> = { status: normalizedStatus };
    if (normalizedStatus === 'COMPLETED' && !stopResult.data.completedAt) {
      updates.completedAt = new Date().toISOString();
    }
    if (location) {
      updates.latitude = location.lat;
      updates.longitude = location.lng;
    }

    await RouteStopEntity.patch({ routeId, stopId }).set(updates).go();
    const updated = await RouteStopEntity.get({ routeId, stopId }).go();
    return updated.data;
  }
}
