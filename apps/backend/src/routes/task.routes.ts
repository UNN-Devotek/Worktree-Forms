import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authenticate.js';
import { requireProjectAccess } from '../middleware/rbac.js';
import { TaskService } from '../services/task.service.js';

const TASK_STATUSES = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'] as const;
const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  question: z.string().max(5000).optional(),
  taskType: z.string().max(50).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  assignees: z.array(z.string()).optional(),
  attachments: z.array(z.unknown()).optional(),
  mentions: z.array(z.string()).optional(),
  images: z.array(z.unknown()).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assignedTo: z.string().optional(),
});

const router = Router();

// ==========================================
// TASK ENDPOINTS
// ==========================================

// Get Project Tasks
router.get('/projects/:projectId/tasks', requireProjectAccess('VIEWER'), async (req: Request, res: Response) => {
    const { projectId } = req.params;
    try {
        const tasks = await TaskService.getProjectTasks(projectId);
        res.json({ success: true, data: tasks });
    } catch (error) {
        console.error('Fetch Tasks Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
    }
});

// Create Task
router.post('/projects/:projectId/tasks', requireProjectAccess('EDITOR'), async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;

  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
  }

  try {
      const task = await TaskService.createTask({ projectId, createdById: userId, ...parsed.data });
      res.json({ success: true, data: task });
  } catch (error) {
      console.error('Create Task Error:', error);
      res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

// Update Task
router.patch('/projects/:projectId/tasks/:taskId', requireProjectAccess('EDITOR'), async (req: Request, res: Response) => {
    const { projectId, taskId } = req.params;

    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
    }

    try {
        const task = await TaskService.updateTask(projectId, taskId, parsed.data);
        res.json({ success: true, data: task });
    } catch (error) {
        console.error('Update Task Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update task' });
    }
});

export default router;
