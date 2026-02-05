import { prisma } from '../db.js';
import { SheetIntegrationService } from './sheet-integration.service.js';

const sheetIntegrationService = new SheetIntegrationService();

export class RouteService {
    
    /**
     * Get the route for a specific user and date.
     */
    static async getDailyRoute(projectIdOrSlug: string, userId: string, date: Date) {
        // Resolve Project ID from Slug if needed
        const project = await prisma.project.findFirst({
             where: { 
                 OR: [
                     { id: projectIdOrSlug },
                     { slug: projectIdOrSlug }
                 ]
             },
             select: { id: true }
        });

        if (!project) {
            throw new Error(`Project not found: ${projectIdOrSlug}`);
        }
        
        // Start of day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const route = await prisma.route.findFirst({
            where: {
                projectId: project.id,
                assigneeId: userId,
                date: startOfDay
            },
            include: {
                stops: {
                    orderBy: { order: 'asc' },
                    include: { form: { select: { id: true, title: true } } }
                }
            }
        });

        return route;
    }

    /**
     * Create a route (Helper for dispatch/seeding)
     */
    static async createRoute(projectId: string, userId: string, date: Date, stops: any[]) {
         const startOfDay = new Date(date);
         startOfDay.setHours(0, 0, 0, 0);

         return await prisma.route.create({
             data: {
                 projectId,
                 assigneeId: userId,
                 date: startOfDay,
                 status: 'published',
                 stops: {
                     create: stops.map((stop, index) => ({
                         ...stop,
                         order: index
                     }))
                 }
             },
             include: { stops: true }
         });
    }

    /**
     * Get a single route stop by ID, ensuring user access (via project).
     * For now, simplistic access check or assume middleware handles it.
     */
    static async getStop(stopId: number) {
        return await prisma.routeStop.findUnique({
            where: { id: stopId },
            include: {    
                route: {
                    include: {
                        project: true,
                        assignee: { select: { name: true, email: true, image: true } }
                    }
                },
                form: { select: { id: true, title: true } }
            }
        });
    }

    /**
     * Update status of a stop with validation
     */
    static async updateStopStatus(stopId: number, status: string, location?: { lat: number, lng: number }) {
        // Find current stop
        const stop = await prisma.routeStop.findUnique({ where: { id: stopId } });
        if (!stop) throw new Error('Stop not found');

        const validStatuses = ['pending', 'en-route', 'arrived', 'in-progress', 'completed', 'skipped'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status: ${status}`);
        }

        const updates: any = { status };
        
        // Timestamp logic
        if (status === 'completed' && !stop.completedAt) {
            updates.completedAt = new Date();
        }

        // Location update if provided (for Contextual Compass / Audit)
        if (location) {
             updates.latitude = location.lat;
             updates.longitude = location.lng;
        }

        const updatedStop = await prisma.routeStop.update({
            where: { id: stopId },
            data: updates
        });

        // Sync to Smart Sheet
        if (updatedStop.sheetRowId) {
            sheetIntegrationService.syncRouteStopToSheet(stopId, updates).catch(err => {
                console.error('Stop-to-Sheet sync failed:', err);
            });
        }

        return updatedStop;
    }
}
