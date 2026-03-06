import { TaskEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

export class ScheduleService {
  /**
   * Get tasks for a project (used as schedule items)
   */
  static async getProjectTasks(projectId: string) {
    const result = await TaskEntity.query.byProject({ projectId }).go();
    return result.data;
  }

  /**
   * Create a new task (schedule entry)
   */
  static async createTask(data: {
    projectId: string;
    title: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    assignedTo?: string;
  }) {
    const taskId = nanoid();
    const result = await TaskEntity.create({
      taskId,
      projectId: data.projectId,
      title: data.title,
      status: data.status || 'OPEN',
      dueDate: data.endDate,
      assignedTo: data.assignedTo,
    }).go();

    return result.data;
  }

  /**
   * Update a task
   */
  static async updateTask(projectId: string, taskId: string, data: {
    title?: string;
    dueDate?: string;
    status?: string;
    assignedTo?: string;
  }) {
    const setData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.title !== undefined) setData.title = data.title;
    if (data.dueDate !== undefined) setData.dueDate = data.dueDate;
    if (data.status !== undefined) setData.status = data.status;
    if (data.assignedTo !== undefined) setData.assignedTo = data.assignedTo;

    await TaskEntity.patch({ projectId, taskId }).set(setData).go();
    const result = await TaskEntity.get({ projectId, taskId }).go();
    return result.data;
  }

  /**
   * Delete a task
   */
  static async deleteTask(projectId: string, taskId: string) {
    await TaskEntity.delete({ projectId, taskId }).go();
  }
}
