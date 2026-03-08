import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'task-nanoid-001') }));

vi.mock('../../lib/dynamo/index.js', () => ({
  TaskEntity: {
    create: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    query: {
      byProject: vi.fn(),
    },
  },
}));

import { ScheduleService } from '../../services/schedule.service.js';
import { TaskEntity } from '../../lib/dynamo/index.js';

const mockEntity = TaskEntity as {
  create: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  query: { byProject: ReturnType<typeof vi.fn> };
};

describe('ScheduleService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── getProjectTasks ───────────────────────────────────────────────────────

  describe('getProjectTasks', () => {
    it('[P0] queries TaskEntity.query.byProject with the given projectId', async () => {
      const tasks = [
        { taskId: 't1', projectId: 'proj-1', title: 'Meeting', status: 'OPEN' },
        { taskId: 't2', projectId: 'proj-1', title: 'Follow-up', status: 'IN_PROGRESS' },
      ];
      mockEntity.query.byProject.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: tasks }) });

      const result = await ScheduleService.getProjectTasks('proj-1');

      expect(mockEntity.query.byProject).toHaveBeenCalledWith({ projectId: 'proj-1' });
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Meeting');
    });

    it('[P1] returns empty array when no tasks exist', async () => {
      mockEntity.query.byProject.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });

      const result = await ScheduleService.getProjectTasks('proj-empty');
      expect(result).toHaveLength(0);
    });
  });

  // ─── createTask ────────────────────────────────────────────────────────────

  describe('createTask', () => {
    it('[P0] creates task with OPEN default status and nanoid', async () => {
      const fakeTask = { taskId: 'task-nanoid-001', projectId: 'proj-1', title: 'Plan sprint', status: 'OPEN' };
      mockEntity.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: fakeTask }) });

      const result = await ScheduleService.createTask({
        projectId: 'proj-1',
        title: 'Plan sprint',
      });

      const arg = mockEntity.create.mock.calls[0][0];
      expect(arg.taskId).toBe('task-nanoid-001');
      expect(arg.projectId).toBe('proj-1');
      expect(arg.title).toBe('Plan sprint');
      expect(arg.status).toBe('OPEN');
      expect(result).toEqual(fakeTask);
    });

    it('[P0] passes custom status when provided', async () => {
      mockEntity.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await ScheduleService.createTask({
        projectId: 'proj-1',
        title: 'Urgent task',
        status: 'IN_PROGRESS',
      });

      const arg = mockEntity.create.mock.calls[0][0];
      expect(arg.status).toBe('IN_PROGRESS');
    });

    it('[P1] maps endDate to dueDate on the entity', async () => {
      mockEntity.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await ScheduleService.createTask({
        projectId: 'proj-1',
        title: 'Deadline task',
        endDate: '2026-04-01',
      });

      const arg = mockEntity.create.mock.calls[0][0];
      expect(arg.dueDate).toBe('2026-04-01');
    });

    it('[P1] stores assignedTo when provided', async () => {
      mockEntity.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await ScheduleService.createTask({
        projectId: 'proj-1',
        title: 'Assigned task',
        assignedTo: 'user-abc',
      });

      const arg = mockEntity.create.mock.calls[0][0];
      expect(arg.assignedTo).toBe('user-abc');
    });
  });

  // ─── updateTask ────────────────────────────────────────────────────────────

  describe('updateTask', () => {
    it('[P0] patches the task and returns updated data', async () => {
      const updated = { taskId: 't1', projectId: 'proj-1', title: 'Updated', status: 'DONE' };
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockEntity.patch.mockReturnValue({ set: mockSet });
      mockEntity.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: updated }) });

      const result = await ScheduleService.updateTask('proj-1', 't1', { status: 'DONE' });

      expect(mockEntity.patch).toHaveBeenCalledWith({ projectId: 'proj-1', taskId: 't1' });
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.status).toBe('DONE');
      expect(setArg.updatedAt).toBeDefined();
      expect(result).toEqual(updated);
    });

    it('[P0] always sets updatedAt even when no other fields change', async () => {
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockEntity.patch.mockReturnValue({ set: mockSet });
      mockEntity.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await ScheduleService.updateTask('proj-1', 't1', {});

      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.updatedAt).toBeDefined();
    });

    it('[P1] only patches fields that are explicitly provided', async () => {
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockEntity.patch.mockReturnValue({ set: mockSet });
      mockEntity.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await ScheduleService.updateTask('proj-1', 't1', { title: 'New title' });

      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.title).toBe('New title');
      expect('status' in setArg).toBe(false);
      expect('assignedTo' in setArg).toBe(false);
    });

    it('[P1] maps dueDate update correctly', async () => {
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockEntity.patch.mockReturnValue({ set: mockSet });
      mockEntity.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await ScheduleService.updateTask('proj-1', 't1', { dueDate: '2026-05-15' });

      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.dueDate).toBe('2026-05-15');
    });
  });

  // ─── deleteTask ────────────────────────────────────────────────────────────

  describe('deleteTask', () => {
    it('[P0] deletes the task by projectId and taskId', async () => {
      mockEntity.delete.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });

      await ScheduleService.deleteTask('proj-1', 't1');

      expect(mockEntity.delete).toHaveBeenCalledWith({ projectId: 'proj-1', taskId: 't1' });
    });
  });
});
