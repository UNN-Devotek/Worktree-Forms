import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { Entity } from 'electrodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  setupDynamoDBTests,
  getTestDocClient,
  TEST_TABLE,
} from '../setup/dynamodb.js';

function makeTestPublicTokenEntity(docClient: DynamoDBDocumentClient) {
  return new Entity(
    {
      model: { entity: 'publicToken', version: '1', service: 'worktree' },
      attributes: {
        token: { type: 'string' as const, required: true },
        projectId: { type: 'string' as const, required: true },
        entityId: { type: 'string' as const },
        entityType: { type: 'string' as const },
        permissions: {
          type: 'list' as const,
          items: { type: 'string' as const },
          default: () => ['READ'],
        },
        expiresAt: { type: 'string' as const },
        createdBy: { type: 'string' as const },
        createdAt: { type: 'string' as const, default: () => new Date().toISOString() },
      },
      indexes: {
        primary: {
          pk: { field: 'PK', composite: ['token'], template: 'TOKEN#${token}' },
          sk: { field: 'SK', composite: [], template: 'TOKEN' },
        },
        byProject: {
          index: 'GSI1',
          pk: { field: 'GSI1PK', composite: ['projectId'], template: 'PROJECT#${projectId}' },
          sk: { field: 'GSI1SK', composite: ['token'], template: 'TOKEN#${token}' },
        },
      },
    },
    { table: TEST_TABLE, client: docClient }
  );
}

describe('PublicTokenEntity — CRUD + byProject GSI1', () => {
  setupDynamoDBTests();

  it('[P0] creates a token and retrieves it by primary key', async () => {
    const docClient = getTestDocClient();
    const PublicTokenEntity = makeTestPublicTokenEntity(docClient);

    const token = uuidv4();
    const projectId = uuidv4();

    await PublicTokenEntity.create({
      token,
      projectId,
      entityId: 'form-abc',
      entityType: 'FORM',
      createdBy: 'user-001',
    }).go();

    const result = await PublicTokenEntity.get({ token }).go();
    expect(result.data?.token).toBe(token);
    expect(result.data?.entityType).toBe('FORM');
    expect(result.data?.permissions).toEqual(['READ']);
  });

  it('[P0] byProject GSI1 — lists all tokens for a project', async () => {
    const docClient = getTestDocClient();
    const PublicTokenEntity = makeTestPublicTokenEntity(docClient);

    const projectId = uuidv4();

    await PublicTokenEntity.create({ token: uuidv4(), projectId, entityId: 'f1', entityType: 'FORM', createdBy: 'u1' }).go();
    await PublicTokenEntity.create({ token: uuidv4(), projectId, entityId: 's1', entityType: 'SPEC', createdBy: 'u1' }).go();

    const result = await PublicTokenEntity.query.byProject({ projectId }).go();
    expect(result.data.length).toBe(2);
    result.data.forEach((t) => expect(t.projectId).toBe(projectId));
  });

  it('[P0] cross-project isolation — byProject only returns that project tokens', async () => {
    const docClient = getTestDocClient();
    const PublicTokenEntity = makeTestPublicTokenEntity(docClient);

    const projectA = uuidv4();
    const projectB = uuidv4();

    await PublicTokenEntity.create({ token: uuidv4(), projectId: projectA, entityId: 'f1', entityType: 'FORM', createdBy: 'u1' }).go();
    await PublicTokenEntity.create({ token: uuidv4(), projectId: projectB, entityId: 'f2', entityType: 'FORM', createdBy: 'u1' }).go();

    const resultA = await PublicTokenEntity.query.byProject({ projectId: projectA }).go();
    expect(resultA.data.length).toBe(1);
    expect(resultA.data[0].projectId).toBe(projectA);
  });

  it('[P1] expiresAt is stored and retrievable', async () => {
    const docClient = getTestDocClient();
    const PublicTokenEntity = makeTestPublicTokenEntity(docClient);

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await PublicTokenEntity.create({
      token,
      projectId: uuidv4(),
      entityId: 'spec-1',
      entityType: 'SPEC',
      createdBy: 'user-1',
      expiresAt,
    }).go();

    const result = await PublicTokenEntity.get({ token }).go();
    expect(result.data?.expiresAt).toBe(expiresAt);
  });

  it('[P1] custom permissions are stored', async () => {
    const docClient = getTestDocClient();
    const PublicTokenEntity = makeTestPublicTokenEntity(docClient);

    const token = uuidv4();
    await PublicTokenEntity.create({
      token,
      projectId: uuidv4(),
      entityId: 'sheet-1',
      entityType: 'SHEET',
      createdBy: 'user-1',
      permissions: ['READ', 'WRITE'],
    }).go();

    const result = await PublicTokenEntity.get({ token }).go();
    expect(result.data?.permissions).toEqual(['READ', 'WRITE']);
  });

  it('[P2] delete removes the token', async () => {
    const docClient = getTestDocClient();
    const PublicTokenEntity = makeTestPublicTokenEntity(docClient);

    const token = uuidv4();
    const projectId = uuidv4();

    await PublicTokenEntity.create({ token, projectId, entityId: 'f1', entityType: 'FORM', createdBy: 'u1' }).go();
    await PublicTokenEntity.delete({ token }).go();

    const result = await PublicTokenEntity.get({ token }).go();
    expect(result.data).toBeNull();
  });
});
