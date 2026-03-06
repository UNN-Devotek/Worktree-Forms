import { TaskEntity, ProjectMemberEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

export class TaskService {
  static async createTask(data: {
    projectId: string;
    createdById: string;
    title: string;
    question?: string;
    taskType?: string;
    status?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
    assignees?: unknown[];
    attachments?: unknown[];
    mentions?: unknown[];
    images?: unknown[];
  }) {
    const { projectId, createdById, title, question, taskType, status, priority, startDate, endDate } = data;

    // Verify membership
    const member = await ProjectMemberEntity.get({ projectId, userId: createdById }).go();
    if (!member.data) throw new Error('Unauthorized: User is not a member of this project');

    const taskId = nanoid();
    const result = await TaskEntity.create({
      taskId,
      projectId,
      title,
      description: question ?? '',
      status: status ?? 'OPEN',
      priority: priority ?? 'MEDIUM',
      dueDate: endDate ?? undefined,
      assignedTo: undefined,
      createdBy: createdById,
    }).go();

    return result.data;
  }

  static async getProjectTasks(projectId: string) {
    const result = await TaskEntity.query.byProject({ projectId }).go();
    return result.data;
  }

  static async getTask(projectId: string, taskId: string) {
    const result = await TaskEntity.get({ projectId, taskId }).go();
    return result.data;
  }

  static async updateTask(projectId: string, taskId: string, updates: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string | null;
    assignedTo?: string;
  }) {
    const setData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (updates.title !== undefined) setData.title = updates.title;
    if (updates.description !== undefined) setData.description = updates.description;
    if (updates.status !== undefined) setData.status = updates.status;
    if (updates.priority !== undefined) setData.priority = updates.priority;
    if (updates.dueDate !== undefined) setData.dueDate = updates.dueDate ?? undefined;
    if (updates.assignedTo !== undefined) setData.assignedTo = updates.assignedTo;

    await TaskEntity.patch({ projectId, taskId }).set(setData).go();
    const result = await TaskEntity.get({ projectId, taskId }).go();
    return result.data;
  }
}
