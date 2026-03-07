import { Router, Request, Response } from 'express';
import { RouteService } from '../services/route-service.js';
import { authenticate } from '../middleware/authenticate.js';
import type { AuthenticatedRequest } from '../types/express.js';
import { requireProjectAccess, hasRole } from '../middleware/rbac.js';
import { ProjectMemberEntity } from '../lib/dynamo/index.js';

const router = Router();

// ==========================================
// MOBILE ROUTES (Field App)
// ==========================================

router.get('/projects/:projectId/routes/my-daily', requireProjectAccess('VIEWER'), async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    // Derive userId from the authenticated session — never trust client-supplied userId
    const userId = (req as AuthenticatedRequest).user.id;
    const dateStr = req.query.date as string || new Date().toISOString();

    try {
        const route = await RouteService.getDailyRoute(projectId, userId, new Date(dateStr));
        res.json({ success: true, data: { route } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Failed to fetch route' });
    }
});

router.post('/projects/:projectId/routes', requireProjectAccess('EDITOR'), async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    const userId = (req as AuthenticatedRequest).user.id;
    const { date, stops } = req.body;

    try {
        const route = await RouteService.createRoute(projectId, userId, new Date(date), stops);
        res.json({ success: true, data: { route } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Failed to create route' });
    }
});

router.get('/routes/:routeId/stops/:stopId', authenticate, async (req: Request, res: Response) => {
    try {
        const stop = await RouteService.getStop(req.params.routeId, req.params.stopId);
        if (!stop) return res.status(404).json({ success: false, error: 'Stop not found' });

        // Verify the authenticated user is a member of the stop's project
        const userId = (req as AuthenticatedRequest).user.id;
        const membership = await ProjectMemberEntity.query.primary({ projectId: stop.projectId, userId }).go();
        if (!membership.data.length) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        res.json({ success: true, data: { stop } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Failed to fetch stop' });
    }
});

const ALLOWED_STOP_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] as const;

router.patch('/routes/:routeId/stops/:stopId/status', authenticate, async (req: Request, res: Response) => {
    const { status, location } = req.body;

    if (!ALLOWED_STOP_STATUSES.includes(status as typeof ALLOWED_STOP_STATUSES[number])) {
        return res.status(400).json({ success: false, error: `status must be one of: ${ALLOWED_STOP_STATUSES.join(', ')}` });
    }

    try {
        // Fetch once: used for both project membership check and the update
        const stop = await RouteService.getStop(req.params.routeId, req.params.stopId);
        if (!stop) return res.status(404).json({ success: false, error: 'Stop not found' });

        // Verify the authenticated user is a member of the stop's project with EDITOR+ role
        const userId = (req as AuthenticatedRequest).user.id;
        const membership = await ProjectMemberEntity.query.primary({ projectId: stop.projectId, userId }).go();
        if (!membership.data.length || !hasRole(membership.data[0].roles ?? [], 'EDITOR')) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        const updatedStop = await RouteService.updateStopStatus(req.params.routeId, req.params.stopId, status, location);
        res.json({ success: true, data: { stop: updatedStop } });
    } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : 'Failed to update status';
        res.status(500).json({ success: false, error: message });
    }
});

export default router;
