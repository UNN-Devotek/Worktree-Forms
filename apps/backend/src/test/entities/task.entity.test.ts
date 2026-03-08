import { describe, it, expect, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { Entity } from 'electrodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  setupDynamoDBTests,
  getTestDocClient,
  TEST_TABLE,
} from '../setup/dynamodb.js';

function makeTestTaskEntity(docClient: DynamoDBDocumentClient) {
  return new Entity(
    {
      model: { entity: 'task', version: '1', service: 'worktree' },
      attributes: {
        taskId: { type: 'string' as const, required: true },
        projectId: { type: 'string' as const, required: true },
        title: { type: 'string' as const, required: true },
        description: { type: 'string' as const },
        status: { type: 'string' as const, default: 'OPEN' },
        priority: { type: 'string' as const, default: 'MEDIUM' },
        assignedTo: { type: 'string' as const },
        dueDate: { type: 'string' as const },
        linkedEntityId: { type: 'string' as const },
        linkedEntityType: { type: 'string' as const },
        createdBy: { type: 'string' as const },
        createdAt: { type: 'string' as const, default: () => new Date().toISOString() },
        updatedAt: { type: 'string' as const, default: () => new Date().toISOString() },
      },
      indexes: {
        primary: {
          pk: { field: 'PK', composite: ['projectId'], template: 'PROJECT#${projectId}' },
          sk: { field: 'SK', composite: ['taskId'], template: 'TASK#${taskId}' },
        },
        byProject: {
          index: 'GSI1',
          pk: { field: 'GSI1PK', composite: ['projectId'], template: 'TASKS#${projectId}' },
          sk: { field: 'GSI1SK', composite: ['dueDate'], template: '${dueDate}' },
        },
      },
    },
    { table: TEST_TABLE, client: docClient }
  );
}

describe('TaskEntity — CRUD + project-scoped GSI1', () => {
  setupDynamoDBTests();

  it('[P0] creates a task and retrieves it by primary key', async () => {
    const docClient = getTestDocClient();
    const TaskEntity = makeTestTaskEntity(docClient);

    const projectId = uuidv4();
    const taskId = uuidv4();

    await TaskEntity.create({ taskId, projectId, title: 'Fix login bug' }).go();

    const result = await TaskEntity.get({ projectId, taskId }).go();
    expect(result.data?.taskId).toBe(taskId);
    expect(result.data?.projectId).toBe(projectId);
    expect(result.data?.title).toBe('Fix login bug');
    expect(result.data?.status).toBe('OPEN');
    expect(result.data?.priority).toBe('MEDIUM');
  });

  it('[P0] primary query — lists all tasks for a project', async () => {
    const docClient = getTestDocClient();
    const TaskEntity = makeTestTaskEntity(docClient);

    const projectId = uuidv4();

    await TaskEntity.create({ taskId: uuidv4(), projectId, title: 'Task A' }).go();
    await TaskEntity.create({ taskId: uuidv4(), projectId, title: 'Task B' }).go();
    await TaskEntity.create({ taskId: uuidv4(), projectId, title: 'Task C' }).go();

    const result = await TaskEntity.query.primary({ projectId }).go();
    expect(result.data.length).toBe(3);
    result.data.forEach((t) => expect(t.projectId).toBe(projectId));
  });

  it('[P0] cross-project isolation — tasks from different projects do not bleed through', async () => {
    const docClient = getTestDocClient();
    const TaskEntity = makeTestTaskEntity(docClient);

    const projectA = uuidv4();
    const projectB = uuidv4();

    await TaskEntity.create({ taskId: uuidv4(), projectId: projectA, title: 'A Task' }).go();
    await TaskEntity.create({ taskId: uuidv4(), projectId: projectB, title: 'B Task' }).go();

    const resultA = await TaskEntity.query.primary({ projectId: projectA }).go();
    expect(resultA.data.length).toBe(1);
    expect(resultA.data[0].projectId).toBe(projectA);

    const resultB = await TaskEntity.query.primary({ projectId: projectB }).go();
    expect(resultB.data.length).toBe(1);
    expect(resultB.data[0].projectId).toBe(projectB);
  });

  it('[P1] update — status and assignedTo can be changed', async () => {
    const docClient = getTestDocClient();
    const TaskEntity = makeTestTaskEntity(docClient);

    const projectId = uuidv4();
    const taskId = uuidv4();

    await TaskEntity.create({ taskId, projectId, title: 'Unassigned task' }).go();
    await TaskEntity.update({ projectId, taskId })
      .set({ status: 'IN_PROGRESS', assignedTo: 'user-abc' })
      .go();

    const result = await TaskEntity.get({ projectId, taskId }).go();
    expect(result.data?.status).toBe('IN_PROGRESS');
    expect(result.data?.assignedTo).toBe('user-abc');
  });

  it('[P1] linked entity — stores linkedEntityId and linkedEntityType', async () => {
    const docClient = getTestDocClient();
    const TaskEntity = makeTestTaskEntity(docClient);

    const projectId = uuidv4();
    const taskId = uuidv4();

    await TaskEntity.create({
      taskId,
      projectId,
      title: 'Linked task',
      linkedEntityId: 'form-xyz',
      linkedEntityType: 'form',
    }).go();

    const result = await TaskEntity.get({ projectId, taskId }).go();
    expect(result.data?.linkedEntityId).toBe('form-xyz');
    expect(result.data?.linkedEntityType).toBe('form');
  });

  it('[P2] delete — removes task from project listing', async () => {
    const docClient = getTestDocClient();
    const TaskEntity = makeTestTaskEntity(docClient);

    const projectId = uuidv4();
    const taskId = uuidv4();

    await TaskEntity.create({ taskId, projectId, title: 'To be deleted' }).go();
    await TaskEntity.delete({ projectId, taskId }).go();

    const result = await TaskEntity.query.primary({ projectId }).go();
    expect(result.data.find((t) => t.taskId === taskId)).toBeUndefined();
  });
});
