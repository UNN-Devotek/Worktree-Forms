import { Router, Request, Response } from 'express';
import { ScheduleService } from '../services/schedule.service.js';

const router = Router();

// ==========================================
// SCHEDULE ROUTES
// ==========================================

// Get Project Tasks
router.get('/projects/:projectId/schedule', async (req: Request, res: Response) => {
    try {
        const tasks = await ScheduleService.getProjectTasks(req.params.projectId);
        res.json({ success: true, data: tasks });
    } catch (error) {
        console.error('Fetch Schedule Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch schedule' });
    }
});

// Create Task
router.post('/projects/:projectId/schedule', async (req: Request, res: Response) => {
    const { title, startDate, endDate, status, assignedToId } = req.body;
    try {
        const task = await ScheduleService.createTask({
            projectId: req.params.projectId,
            title,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status,
            assignedToId
        });
        res.json({ success: true, data: task });
    } catch (error) {
        console.error('Create Task Error:', error);
        res.status(500).json({ success: false, error: 'Failed to create task' });
    }
});

// Update Task
router.patch('/schedule/:taskId', async (req: Request, res: Response) => {
    const { title, startDate, endDate, status, assignedToId } = req.body;
    try {
        const task = await ScheduleService.updateTask(req.params.taskId, {
            title,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status,
            assignedToId
        });
        res.json({ success: true, data: task });
    } catch (error) {
        console.error('Update Task Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update task' });
    }
});

// Delete Task
router.delete('/schedule/:taskId', async (req: Request, res: Response) => {
    try {
        await ScheduleService.deleteTask(req.params.taskId);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete Task Error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete task' });
    }
});

export default router;
