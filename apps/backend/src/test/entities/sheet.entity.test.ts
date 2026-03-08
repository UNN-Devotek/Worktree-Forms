import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { Entity } from 'electrodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  setupDynamoDBTests,
  getTestDocClient,
  TEST_TABLE,
} from '../setup/dynamodb.js';

function makeTestSheetEntity(docClient: DynamoDBDocumentClient) {
  return new Entity(
    {
      model: { entity: 'sheet', version: '1', service: 'worktree' },
      attributes: {
        sheetId: { type: 'string' as const, required: true },
        projectId: { type: 'string' as const, required: true },
        name: { type: 'string' as const, required: true },
        description: { type: 'string' as const },
        icon: { type: 'string' as const },
        createdBy: { type: 'string' as const },
        createdAt: { type: 'string' as const, default: () => new Date().toISOString() },
        updatedAt: { type: 'string' as const, default: () => new Date().toISOString() },
      },
      indexes: {
        primary: {
          pk: { field: 'PK', composite: ['projectId'], template: 'PROJECT#${projectId}' },
          sk: { field: 'SK', composite: ['sheetId'], template: 'SHEET#${sheetId}' },
        },
        byProject: {
          index: 'GSI1',
          pk: { field: 'GSI1PK', composite: ['projectId'], template: 'SHEETS#${projectId}' },
          sk: { field: 'GSI1SK', composite: ['createdAt'], template: '${createdAt}' },
        },
      },
    },
    { table: TEST_TABLE, client: docClient }
  );
}

describe('SheetEntity — CRUD + byProject GSI1', () => {
  setupDynamoDBTests();

  it('[P0] creates a sheet and retrieves it by primary key', async () => {
    const docClient = getTestDocClient();
    const SheetEntity = makeTestSheetEntity(docClient);

    const projectId = uuidv4();
    const sheetId = uuidv4();

    await SheetEntity.create({
      sheetId,
      projectId,
      name: 'Project Tracker',
      description: 'Main project tracking sheet',
      createdBy: 'user-001',
    }).go();

    const result = await SheetEntity.get({ projectId, sheetId }).go();
    expect(result.data?.sheetId).toBe(sheetId);
    expect(result.data?.name).toBe('Project Tracker');
    expect(result.data?.description).toBe('Main project tracking sheet');
  });

  it('[P0] primary query — lists all sheets for a project', async () => {
    const docClient = getTestDocClient();
    const SheetEntity = makeTestSheetEntity(docClient);

    const projectId = uuidv4();

    await SheetEntity.create({ sheetId: uuidv4(), projectId, name: 'Sheet A' }).go();
    await SheetEntity.create({ sheetId: uuidv4(), projectId, name: 'Sheet B' }).go();
    await SheetEntity.create({ sheetId: uuidv4(), projectId, name: 'Sheet C' }).go();

    const result = await SheetEntity.query.primary({ projectId }).go();
    expect(result.data.length).toBe(3);
    result.data.forEach((s) => expect(s.projectId).toBe(projectId));
  });

  it('[P0] cross-project isolation', async () => {
    const docClient = getTestDocClient();
    const SheetEntity = makeTestSheetEntity(docClient);

    const projectA = uuidv4();
    const projectB = uuidv4();

    await SheetEntity.create({ sheetId: uuidv4(), projectId: projectA, name: 'A Sheet' }).go();
    await SheetEntity.create({ sheetId: uuidv4(), projectId: projectB, name: 'B Sheet' }).go();

    const resultA = await SheetEntity.query.primary({ projectId: projectA }).go();
    expect(resultA.data.length).toBe(1);
    expect(resultA.data[0].projectId).toBe(projectA);
  });

  it('[P1] icon field stores emoji/icon identifier', async () => {
    const docClient = getTestDocClient();
    const SheetEntity = makeTestSheetEntity(docClient);

    const projectId = uuidv4();
    const sheetId = uuidv4();

    await SheetEntity.create({
      sheetId,
      projectId,
      name: 'Budget',
      icon: '💰',
    }).go();

    const result = await SheetEntity.get({ projectId, sheetId }).go();
    expect(result.data?.icon).toBe('💰');
  });

  it('[P1] name can be updated', async () => {
    const docClient = getTestDocClient();
    const SheetEntity = makeTestSheetEntity(docClient);

    const projectId = uuidv4();
    const sheetId = uuidv4();

    await SheetEntity.create({ sheetId, projectId, name: 'Old Name' }).go();
    await SheetEntity.update({ projectId, sheetId }).set({ name: 'New Name' }).go();

    const result = await SheetEntity.get({ projectId, sheetId }).go();
    expect(result.data?.name).toBe('New Name');
  });

  it('[P2] delete removes the sheet', async () => {
    const docClient = getTestDocClient();
    const SheetEntity = makeTestSheetEntity(docClient);

    const projectId = uuidv4();
    const sheetId = uuidv4();

    await SheetEntity.create({ sheetId, projectId, name: 'Temp' }).go();
    await SheetEntity.delete({ projectId, sheetId }).go();

    const result = await SheetEntity.query.primary({ projectId }).go();
    expect(result.data.find((s) => s.sheetId === sheetId)).toBeUndefined();
  });
});
