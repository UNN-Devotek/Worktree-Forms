import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { Entity } from 'electrodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  setupDynamoDBTests,
  getTestDocClient,
  TEST_TABLE,
} from '../setup/dynamodb.js';

function makeTestFolderEntity(docClient: DynamoDBDocumentClient) {
  return new Entity(
    {
      model: { entity: 'folder', version: '1', service: 'worktree' },
      attributes: {
        folderId: { type: 'string' as const, required: true },
        projectId: { type: 'string' as const, required: true },
        name: { type: 'string' as const, required: true },
        parentFolderId: { type: 'string' as const },
        description: { type: 'string' as const },
        createdBy: { type: 'string' as const },
        createdAt: { type: 'string' as const, default: () => new Date().toISOString() },
        updatedAt: { type: 'string' as const, default: () => new Date().toISOString() },
      },
      indexes: {
        primary: {
          pk: { field: 'PK', composite: ['projectId'], template: 'PROJECT#${projectId}' },
          sk: { field: 'SK', composite: ['folderId'], template: 'FOLDER#${folderId}' },
        },
        byProject: {
          index: 'GSI1',
          pk: { field: 'GSI1PK', composite: ['projectId'], template: 'FOLDERS#${projectId}' },
          sk: { field: 'GSI1SK', composite: ['name'], template: '${name}' },
        },
      },
    },
    { table: TEST_TABLE, client: docClient }
  );
}

describe('FolderEntity — CRUD + byProject GSI1 + nesting', () => {
  setupDynamoDBTests();

  it('[P0] creates a folder and retrieves it by primary key', async () => {
    const docClient = getTestDocClient();
    const FolderEntity = makeTestFolderEntity(docClient);

    const projectId = uuidv4();
    const folderId = uuidv4();

    await FolderEntity.create({
      folderId,
      projectId,
      name: 'Documents',
      createdBy: 'user-001',
    }).go();

    const result = await FolderEntity.get({ projectId, folderId }).go();
    expect(result.data?.folderId).toBe(folderId);
    expect(result.data?.name).toBe('Documents');
    expect(result.data?.projectId).toBe(projectId);
  });

  it('[P0] primary query — lists all folders for a project', async () => {
    const docClient = getTestDocClient();
    const FolderEntity = makeTestFolderEntity(docClient);

    const projectId = uuidv4();

    await FolderEntity.create({ folderId: uuidv4(), projectId, name: 'Alpha' }).go();
    await FolderEntity.create({ folderId: uuidv4(), projectId, name: 'Beta' }).go();
    await FolderEntity.create({ folderId: uuidv4(), projectId, name: 'Gamma' }).go();

    const result = await FolderEntity.query.primary({ projectId }).go();
    expect(result.data.length).toBe(3);
    result.data.forEach((f) => expect(f.projectId).toBe(projectId));
  });

  it('[P0] cross-project isolation', async () => {
    const docClient = getTestDocClient();
    const FolderEntity = makeTestFolderEntity(docClient);

    const projectA = uuidv4();
    const projectB = uuidv4();

    await FolderEntity.create({ folderId: uuidv4(), projectId: projectA, name: 'Specs' }).go();
    await FolderEntity.create({ folderId: uuidv4(), projectId: projectB, name: 'Reports' }).go();

    const resultA = await FolderEntity.query.primary({ projectId: projectA }).go();
    expect(resultA.data.length).toBe(1);
    expect(resultA.data[0].projectId).toBe(projectA);
  });

  it('[P1] subfolder — parentFolderId links child to parent', async () => {
    const docClient = getTestDocClient();
    const FolderEntity = makeTestFolderEntity(docClient);

    const projectId = uuidv4();
    const parentId = uuidv4();
    const childId = uuidv4();

    await FolderEntity.create({ folderId: parentId, projectId, name: 'Parent' }).go();
    await FolderEntity.create({
      folderId: childId,
      projectId,
      name: 'Child',
      parentFolderId: parentId,
    }).go();

    const child = await FolderEntity.get({ projectId, folderId: childId }).go();
    expect(child.data?.parentFolderId).toBe(parentId);
  });

  it('[P1] rename — name can be updated', async () => {
    const docClient = getTestDocClient();
    const FolderEntity = makeTestFolderEntity(docClient);

    const projectId = uuidv4();
    const folderId = uuidv4();

    await FolderEntity.create({ folderId, projectId, name: 'Old Name' }).go();
    await FolderEntity.update({ projectId, folderId }).set({ name: 'New Name' }).go();

    const result = await FolderEntity.get({ projectId, folderId }).go();
    expect(result.data?.name).toBe('New Name');
  });

  it('[P2] delete removes the folder', async () => {
    const docClient = getTestDocClient();
    const FolderEntity = makeTestFolderEntity(docClient);

    const projectId = uuidv4();
    const folderId = uuidv4();

    await FolderEntity.create({ folderId, projectId, name: 'Temp Folder' }).go();
    await FolderEntity.delete({ projectId, folderId }).go();

    const result = await FolderEntity.query.primary({ projectId }).go();
    expect(result.data.find((f) => f.folderId === folderId)).toBeUndefined();
  });
});
