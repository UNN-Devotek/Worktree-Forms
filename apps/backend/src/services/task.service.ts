import { TaskEntity, ProjectMemberEntity, UserEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

// Map ElectroDB task response to frontend Task shape
async function mapTaskResponse(task: Record<string, unknown>) {
  const createdById = task.createdBy as string | undefined;
  const assignedToId = task.assignedTo as string | undefined;

  // Lookup user details for createdBy and assignedTo
  let createdByObj: { id: string; name: string | null; email: string } = {
    id: createdById ?? '',
    name: null,
    email: '',
  };
  let assignedToObj: { id: string; name: string | null; email: string } | null = null;

  const userIds = [createdById, assignedToId].filter(Boolean) as string[];
  if (userIds.length > 0) {
    const lookups = await Promise.all(
      userIds.map((uid) => UserEntity.get({ userId: uid }).go().catch(() => ({ data: null })))
    );
    const userMap = new Map<string, { name: string | null; email: string }>();
    for (const result of lookups) {
      const u = result.data;
      if (u) userMap.set(u.userId, { name: u.name ?? null, email: u.email ?? '' });
    }
    if (createdById && userMap.has(createdById)) {
      const u = userMap.get(createdById)!;
      createdByObj = { id: createdById, name: u.name, email: u.email };
    }
    if (assignedToId && userMap.has(assignedToId)) {
      const u = userMap.get(assignedToId)!;
      assignedToObj = { id: assignedToId, name: u.name, email: u.email };
    }
  }

  return {
    id: task.taskId,
    projectId: task.projectId,
    title: task.title,
    question: task.description ?? '',
    taskType: task.taskType ?? 'GENERAL',
    status: task.status ?? 'ACTIVE',
    priority: task.priority ?? 'MEDIUM',
    startDate: task.startDate ?? null,
    endDate: task.dueDate ?? null,
    assignees: task.assignees ?? [],
    attachments: task.attachments ?? [],
    mentions: task.mentions ?? [],
    images: task.images ?? [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    createdBy: createdByObj,
    assignedTo: assignedToObj,
  };
}

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
    const { projectId, createdById, title, question, taskType, status, priority, startDate, endDate, assignees, attachments, mentions, images } = data;

    // Verify membership
    const member = await ProjectMemberEntity.get({ projectId, userId: createdById }).go();
    if (!member.data) throw new Error('Unauthorized: User is not a member of this project');

    const taskId = nanoid();
    const result = await TaskEntity.create({
      taskId,
      projectId,
      title,
      description: question ?? '',
      taskType: taskType ?? 'GENERAL',
      status: status ?? 'ACTIVE',
      priority: priority ?? 'MEDIUM',
      startDate: startDate ?? undefined,
      dueDate: endDate ?? undefined,
      assignees: assignees ?? [],
      attachments: attachments ?? [],
      mentions: mentions ?? [],
      images: images ?? [],
      assignedTo: undefined,
      createdBy: createdById,
    }).go();

    return mapTaskResponse(result.data as unknown as Record<string, unknown>);
  }

  static async getProjectTasks(projectId: string) {
    const result = await TaskEntity.query.byProject({ projectId }).go();
    return Promise.all(
      result.data.map((t) => mapTaskResponse(t as unknown as Record<string, unknown>))
    );
  }

  static async getTask(projectId: string, taskId: string) {
    const result = await TaskEntity.get({ projectId, taskId }).go();
    if (!result.data) return null;
    return mapTaskResponse(result.data as unknown as Record<string, unknown>);
  }

  static async updateTask(projectId: string, taskId: string, updates: {
    title?: string;
    question?: string;
    taskType?: string;
    status?: string;
    priority?: string;
    startDate?: string | null;
    endDate?: string | null;
    assignees?: unknown[];
    attachments?: unknown[];
    mentions?: unknown[];
    images?: unknown[];
    assignedTo?: string;
  }) {
    const setData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (updates.title !== undefined) setData.title = updates.title;
    if (updates.question !== undefined) setData.description = updates.question;
    if (updates.taskType !== undefined) setData.taskType = updates.taskType;
    if (updates.status !== undefined) setData.status = updates.status;
    if (updates.priority !== undefined) setData.priority = updates.priority;
    if (updates.startDate !== undefined) setData.startDate = updates.startDate ?? undefined;
    if (updates.endDate !== undefined) setData.dueDate = updates.endDate ?? undefined;
    if (updates.assignees !== undefined) setData.assignees = updates.assignees;
    if (updates.attachments !== undefined) setData.attachments = updates.attachments;
    if (updates.mentions !== undefined) setData.mentions = updates.mentions;
    if (updates.images !== undefined) setData.images = updates.images;
    if (updates.assignedTo !== undefined) setData.assignedTo = updates.assignedTo;

    await TaskEntity.patch({ projectId, taskId }).set(setData).go();
    const result = await TaskEntity.get({ projectId, taskId }).go();
    if (!result.data) return null;
    return mapTaskResponse(result.data as unknown as Record<string, unknown>);
  }
}
