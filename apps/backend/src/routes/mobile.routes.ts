import { Router, Request, Response } from 'express';
import { RouteService } from '../services/route-service.js';

const router = Router();

// ==========================================
// MOBILE ROUTES (Field App)
// ==========================================

router.get('/projects/:projectId/routes/my-daily', async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    const userId = req.query.userId as string; // TODO: Get from Auth Context
    const dateStr = req.query.date as string || new Date().toISOString();
    
    if (!userId) {
         return res.status(400).json({ success: false, error: 'userId required' });
    }

    try {
        const route = await RouteService.getDailyRoute(projectId, userId, new Date(dateStr));
        res.json({ success: true, data: { route } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Failed to fetch route' });
    }
});

router.post('/projects/:projectId/routes', async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    const { userId, date, stops } = req.body;

    try {
        const route = await RouteService.createRoute(projectId, userId, new Date(date), stops);
        res.json({ success: true, data: { route } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Failed to create route' });
    }
});

router.get('/routes/stops/:stopId', async (req: Request, res: Response) => {
    try {
        const stop = await RouteService.getStop(parseInt(req.params.stopId));
        if (!stop) return res.status(404).json({ success: false, error: 'Stop not found' });
        res.json({ success: true, data: { stop } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Failed to fetch stop' });
    }
});

router.patch('/routes/stops/:stopId/status', async (req: Request, res: Response) => {
    const { status, location } = req.body;
    try {
        const stop = await RouteService.updateStopStatus(parseInt(req.params.stopId), status, location);
        res.json({ success: true, data: { stop } });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message || 'Failed to update status' });
    }
});

export default router;
