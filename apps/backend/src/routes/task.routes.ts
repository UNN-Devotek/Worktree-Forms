import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authenticate.js';
import { requireProjectAccess } from '../middleware/rbac.js';
import { TaskService } from '../services/task.service.js';

const TASK_STATUSES = ['DRAFT', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED'] as const;
const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

// Accepts both date-only (2024-01-15) and full ISO datetime (2024-01-15T00:00:00.000Z)
const isoDateString = z.string().regex(
  /^\d{4}-\d{2}-\d{2}/,
  'Must be an ISO date string (YYYY-MM-DD or full ISO 8601)'
);

const assigneeSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
});

const attachmentSchema = z.object({
  url: z.string(),
  name: z.string(),
  type: z.string(),
  objectKey: z.string(),
});

const mentionSchema = z.object({
  type: z.enum(['sheet', 'spec']),
  id: z.string(),
  label: z.string(),
});

const imageSchema = z.object({
  url: z.string(),
  objectKey: z.string(),
});

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  question: z.string().max(5000).optional(),
  taskType: z.string().max(50).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  startDate: isoDateString.optional(),
  endDate: isoDateString.optional(),
  assignees: z.array(assigneeSchema).optional(),
  attachments: z.array(attachmentSchema).optional(),
  mentions: z.array(mentionSchema).optional(),
  images: z.array(imageSchema).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  question: z.string().max(5000).optional(),
  taskType: z.string().max(50).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  startDate: isoDateString.nullable().optional(),
  endDate: isoDateString.nullable().optional(),
  assignees: z.array(assigneeSchema).optional(),
  attachments: z.array(attachmentSchema).optional(),
  mentions: z.array(mentionSchema).optional(),
  images: z.array(imageSchema).optional(),
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
