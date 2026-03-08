import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { Entity } from 'electrodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  setupDynamoDBTests,
  getTestDocClient,
  TEST_TABLE,
} from '../setup/dynamodb.js';

function makeTestSubmissionEntity(docClient: DynamoDBDocumentClient) {
  return new Entity(
    {
      model: { entity: 'submission', version: '1', service: 'worktree' },
      attributes: {
        submissionId: { type: 'string' as const, required: true },
        formId: { type: 'string' as const, required: true },
        projectId: { type: 'string' as const, required: true },
        data: { type: 'any' as const, default: () => ({}) },
        status: { type: 'string' as const, default: 'PENDING' },
        submittedBy: { type: 'string' as const },
        routeStopId: { type: 'string' as const },
        deviceId: { type: 'string' as const },
        syncStatus: { type: 'string' as const, default: 'SYNCED' },
        createdAt: { type: 'string' as const, default: () => new Date().toISOString() },
        updatedAt: { type: 'string' as const, default: () => new Date().toISOString() },
      },
      indexes: {
        primary: {
          pk: { field: 'PK', composite: ['projectId'], template: 'PROJECT#${projectId}' },
          sk: { field: 'SK', composite: ['submissionId'], template: 'SUBMISSION#${submissionId}' },
        },
        byForm: {
          index: 'GSI1',
          pk: { field: 'GSI1PK', composite: ['formId'], template: 'FORM#${formId}' },
          sk: { field: 'GSI1SK', composite: ['createdAt'], template: '${createdAt}' },
        },
      },
    },
    { table: TEST_TABLE, client: docClient }
  );
}

describe('SubmissionEntity — CRUD + byForm GSI1 + isolation', () => {
  setupDynamoDBTests();

  it('[P0] creates a submission and retrieves it by primary key', async () => {
    const docClient = getTestDocClient();
    const SubmissionEntity = makeTestSubmissionEntity(docClient);

    const projectId = uuidv4();
    const formId = uuidv4();
    const submissionId = uuidv4();

    await SubmissionEntity.create({
      submissionId,
      formId,
      projectId,
      data: { name: 'Alice', email: 'alice@example.com' },
      submittedBy: 'user-001',
    }).go();

    const result = await SubmissionEntity.get({ projectId, submissionId }).go();
    expect(result.data?.submissionId).toBe(submissionId);
    expect(result.data?.formId).toBe(formId);
    expect(result.data?.status).toBe('PENDING');
    expect(result.data?.data).toMatchObject({ name: 'Alice' });
  });

  it('[P0] byForm GSI1 — lists all submissions for a form across multiple projects', async () => {
    const docClient = getTestDocClient();
    const SubmissionEntity = makeTestSubmissionEntity(docClient);

    const formId = uuidv4();
    const projectId = uuidv4();

    await SubmissionEntity.create({ submissionId: uuidv4(), formId, projectId, data: {} }).go();
    await SubmissionEntity.create({ submissionId: uuidv4(), formId, projectId, data: {} }).go();

    const result = await SubmissionEntity.query.byForm({ formId }).go();
    expect(result.data.length).toBe(2);
    result.data.forEach((s) => expect(s.formId).toBe(formId));
  });

  it('[P0] cross-project isolation — primary query scopes by projectId', async () => {
    const docClient = getTestDocClient();
    const SubmissionEntity = makeTestSubmissionEntity(docClient);

    const formId = uuidv4();
    const projectA = uuidv4();
    const projectB = uuidv4();

    await SubmissionEntity.create({ submissionId: uuidv4(), formId, projectId: projectA, data: {} }).go();
    await SubmissionEntity.create({ submissionId: uuidv4(), formId, projectId: projectB, data: {} }).go();

    const resultA = await SubmissionEntity.query.primary({ projectId: projectA }).go();
    expect(resultA.data.length).toBe(1);
    expect(resultA.data[0].projectId).toBe(projectA);
  });

  it('[P1] status update — PENDING → APPROVED', async () => {
    const docClient = getTestDocClient();
    const SubmissionEntity = makeTestSubmissionEntity(docClient);

    const projectId = uuidv4();
    const formId = uuidv4();
    const submissionId = uuidv4();

    await SubmissionEntity.create({ submissionId, formId, projectId, data: {} }).go();
    await SubmissionEntity.update({ projectId, submissionId }).set({ status: 'APPROVED' }).go();

    const result = await SubmissionEntity.get({ projectId, submissionId }).go();
    expect(result.data?.status).toBe('APPROVED');
  });

  it('[P1] offline sync metadata — deviceId and syncStatus are stored', async () => {
    const docClient = getTestDocClient();
    const SubmissionEntity = makeTestSubmissionEntity(docClient);

    const projectId = uuidv4();
    const formId = uuidv4();
    const submissionId = uuidv4();

    await SubmissionEntity.create({
      submissionId,
      formId,
      projectId,
      data: {},
      deviceId: 'device-abc',
      syncStatus: 'PENDING',
    }).go();

    const result = await SubmissionEntity.get({ projectId, submissionId }).go();
    expect(result.data?.deviceId).toBe('device-abc');
    expect(result.data?.syncStatus).toBe('PENDING');
  });

  it('[P1] routeStopId links submission to a field-ops stop', async () => {
    const docClient = getTestDocClient();
    const SubmissionEntity = makeTestSubmissionEntity(docClient);

    const projectId = uuidv4();
    const formId = uuidv4();
    const submissionId = uuidv4();
    const routeStopId = uuidv4();

    await SubmissionEntity.create({ submissionId, formId, projectId, data: {}, routeStopId }).go();

    const result = await SubmissionEntity.get({ projectId, submissionId }).go();
    expect(result.data?.routeStopId).toBe(routeStopId);
  });

  it('[P2] delete removes submission from primary listing', async () => {
    const docClient = getTestDocClient();
    const SubmissionEntity = makeTestSubmissionEntity(docClient);

    const projectId = uuidv4();
    const formId = uuidv4();
    const submissionId = uuidv4();

    await SubmissionEntity.create({ submissionId, formId, projectId, data: {} }).go();
    await SubmissionEntity.delete({ projectId, submissionId }).go();

    const result = await SubmissionEntity.query.primary({ projectId }).go();
    expect(result.data.find((s) => s.submissionId === submissionId)).toBeUndefined();
  });
});
