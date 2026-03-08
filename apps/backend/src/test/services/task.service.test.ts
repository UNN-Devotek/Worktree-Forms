import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'task-nanoid-001') }));

vi.mock('../../lib/dynamo/index.js', () => ({
  TaskEntity: {
    create: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    query: {
      byProject: vi.fn(),
    },
  },
  ProjectMemberEntity: {
    get: vi.fn(),
  },
}));

import { TaskService } from '../../services/task.service.js';
import { TaskEntity, ProjectMemberEntity } from '../../lib/dynamo/index.js';

const mockTask = TaskEntity as {
  create: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  query: { byProject: ReturnType<typeof vi.fn> };
};
const mockMember = ProjectMemberEntity as { get: ReturnType<typeof vi.fn> };

describe('TaskService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('createTask', () => {
    it('[P0] throws if user is not a project member', async () => {
      mockMember.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: null }) });

      await expect(
        TaskService.createTask({ projectId: 'p1', createdById: 'u1', title: 'Task' })
      ).rejects.toThrow('Unauthorized');

      expect(mockTask.create).not.toHaveBeenCalled();
    });

    it('[P0] creates a task with OPEN/MEDIUM defaults', async () => {
      mockMember.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: { userId: 'u1' } }) });
      mockTask.create.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { taskId: 'task-nanoid-001', status: 'OPEN' } }),
      });

      const result = await TaskService.createTask({
        projectId: 'p1',
        createdById: 'u1',
        title: 'New Task',
      });

      const createArg = mockTask.create.mock.calls[0][0];
      expect(createArg.status).toBe('OPEN');
      expect(createArg.priority).toBe('MEDIUM');
      expect(createArg.title).toBe('New Task');
      expect(result).toBeDefined();
    });

    it('[P1] uses provided status and priority', async () => {
      mockMember.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: { userId: 'u1' } }) });
      mockTask.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await TaskService.createTask({
        projectId: 'p1',
        createdById: 'u1',
        title: 'High Priority',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      });

      const createArg = mockTask.create.mock.calls[0][0];
      expect(createArg.status).toBe('IN_PROGRESS');
      expect(createArg.priority).toBe('HIGH');
    });

    it('[P1] uses endDate as dueDate', async () => {
      mockMember.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: { userId: 'u1' } }) });
      mockTask.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await TaskService.createTask({
        projectId: 'p1',
        createdById: 'u1',
        title: 'Deadline Task',
        endDate: '2026-12-31',
      });

      const createArg = mockTask.create.mock.calls[0][0];
      expect(createArg.dueDate).toBe('2026-12-31');
    });
  });

  describe('getProjectTasks', () => {
    it('[P0] returns tasks for a project via byProject index', async () => {
      const tasks = [{ taskId: 't1', title: 'A' }, { taskId: 't2', title: 'B' }];
      mockTask.query.byProject.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: tasks }) });

      const result = await TaskService.getProjectTasks('proj-1');
      expect(result).toEqual(tasks);
      expect(mockTask.query.byProject).toHaveBeenCalledWith({ projectId: 'proj-1' });
    });
  });

  describe('getTask', () => {
    it('[P0] retrieves a single task by project + taskId', async () => {
      const task = { taskId: 't1', title: 'Single Task' };
      mockTask.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: task }) });

      const result = await TaskService.getTask('proj-1', 't1');
      expect(result).toEqual(task);
      expect(mockTask.get).toHaveBeenCalledWith({ projectId: 'proj-1', taskId: 't1' });
    });
  });

  describe('updateTask', () => {
    it('[P0] patches task fields and returns updated record', async () => {
      const updatedTask = { taskId: 't1', status: 'DONE', title: 'Updated' };
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockTask.patch.mockReturnValue({ set: mockSet });
      mockTask.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: updatedTask }) });

      const result = await TaskService.updateTask('proj-1', 't1', {
        status: 'DONE',
        title: 'Updated',
      });

      expect(mockTask.patch).toHaveBeenCalledWith({ projectId: 'proj-1', taskId: 't1' });
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.status).toBe('DONE');
      expect(setArg.title).toBe('Updated');
      expect(setArg.updatedAt).toBeDefined();
      expect(result).toEqual(updatedTask);
    });

    it('[P1] undefined updates are not included in patch', async () => {
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockTask.patch.mockReturnValue({ set: mockSet });
      mockTask.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await TaskService.updateTask('proj-1', 't1', { status: 'IN_PROGRESS' });

      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.status).toBe('IN_PROGRESS');
      expect('title' in setArg).toBe(false);
      expect('assignedTo' in setArg).toBe(false);
    });
  });
});
