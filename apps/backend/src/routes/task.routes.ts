import { Router, Request, Response } from 'express';
import { TaskService } from '../services/task.service.js';

const router = Router();

// ==========================================
// TASK ENDPOINTS
// ==========================================

// Get Project Tasks
router.get('/projects/:projectId/tasks', async (req: Request, res: Response) => {
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
router.post('/projects/:projectId/tasks', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { title, question, taskType, status, priority, startDate, endDate, assignees, attachments, mentions, images } = req.body;
  const userId = (req as any).user.id;

  try {
      const task = await TaskService.createTask({
          projectId,
          title,
          question,
          taskType,
          status,
          priority,
          startDate,
          endDate,
          assignees,
          attachments,
          mentions,
          images,
          createdById: userId,
      });
      res.json({ success: true, data: task });
  } catch (error) {
      console.error('Create Task Error:', error);
      res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

// Update Task
router.patch('/tasks/:taskId', async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const updates = req.body;
    try {
        const task = await TaskService.updateTask(taskId, updates);
        res.json({ success: true, data: task });
    } catch (error) {
        console.error('Update Task Error:', error);
        res.status(500).json({ success: false, error: 'Failed to update task' });
    }
});

export default router;
