import { TaskEntity, ProjectMemberEntity, UserEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';
import type { EntityItem } from 'electrodb';

/** The shape ElectroDB returns for a TaskEntity record. */
type TaskItem = EntityItem<typeof TaskEntity>;

/** Lightweight user info attached to task responses. */
interface TaskUserInfo {
  id: string;
  name: string | null;
  email: string;
}

/** Pre-built lookup of userId -> { name, email }. */
type UserMap = Map<string, { name: string | null; email: string }>;

/** Typed sub-objects that live on a task. */
interface Assignee {
  id: string;
  name: string | null;
}

interface Attachment {
  url: string;
  name: string;
  type: string;
  objectKey: string;
}

interface Mention {
  type: 'sheet' | 'spec';
  id: string;
  label: string;
}

interface TaskImage {
  url: string;
  objectKey: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Batch-fetch users by ID, returning a Map for O(1) lookups. */
async function buildUserMap(userIds: string[]): Promise<UserMap> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const lookups = await Promise.all(
    unique.map((uid) =>
      UserEntity.get({ userId: uid })
        .go()
        .catch(() => ({ data: null }))
    )
  );

  const map: UserMap = new Map();
  for (const result of lookups) {
    const u = result.data;
    if (u) map.set(u.userId, { name: u.name ?? null, email: u.email ?? '' });
  }
  return map;
}

/** Map an ElectroDB task item to the frontend Task shape. */
function mapTaskResponse(task: TaskItem, userMap: UserMap) {
  const createdById = task.createdBy;
  const assignedToId = task.assignedTo;

  let createdByObj: TaskUserInfo = { id: createdById ?? '', name: null, email: '' };
  let assignedToObj: TaskUserInfo | null = null;

  if (createdById && userMap.has(createdById)) {
    const u = userMap.get(createdById)!;
    createdByObj = { id: createdById, name: u.name, email: u.email };
  }
  if (assignedToId && userMap.has(assignedToId)) {
    const u = userMap.get(assignedToId)!;
    assignedToObj = { id: assignedToId, name: u.name, email: u.email };
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
    assignees: (task.assignees ?? []) as Assignee[],
    attachments: (task.attachments ?? []) as Attachment[],
    mentions: (task.mentions ?? []) as Mention[],
    images: (task.images ?? []) as TaskImage[],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    createdBy: createdByObj,
    assignedTo: assignedToObj,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

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
    assignees?: Assignee[];
    attachments?: Attachment[];
    mentions?: Mention[];
    images?: TaskImage[];
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

    const userMap = await buildUserMap([createdById]);
    return mapTaskResponse(result.data as TaskItem, userMap);
  }

  static async getProjectTasks(projectId: string) {
    const result = await TaskEntity.query.byProject({ projectId }).go();
    const tasks = result.data as TaskItem[];

    // Collect all unique user IDs across every task, then batch-fetch once
    const allUserIds: string[] = [];
    for (const t of tasks) {
      if (t.createdBy) allUserIds.push(t.createdBy);
      if (t.assignedTo) allUserIds.push(t.assignedTo);
    }
    const userMap = await buildUserMap(allUserIds);

    return tasks.map((t) => mapTaskResponse(t, userMap));
  }

  static async getTask(projectId: string, taskId: string) {
    const result = await TaskEntity.get({ projectId, taskId }).go();
    if (!result.data) return null;
    const task = result.data as TaskItem;

    const userIds = [task.createdBy, task.assignedTo].filter(Boolean) as string[];
    const userMap = await buildUserMap(userIds);
    return mapTaskResponse(task, userMap);
  }

  static async updateTask(projectId: string, taskId: string, updates: {
    title?: string;
    question?: string;
    taskType?: string;
    status?: string;
    priority?: string;
    startDate?: string | null;
    endDate?: string | null;
    assignees?: Assignee[];
    attachments?: Attachment[];
    mentions?: Mention[];
    images?: TaskImage[];
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
    const task = result.data as TaskItem;

    const userIds = [task.createdBy, task.assignedTo].filter(Boolean) as string[];
    const userMap = await buildUserMap(userIds);
    return mapTaskResponse(task, userMap);
  }
}
