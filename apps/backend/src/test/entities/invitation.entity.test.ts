import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { Entity } from 'electrodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  setupDynamoDBTests,
  getTestDocClient,
  TEST_TABLE,
} from '../setup/dynamodb.js';

function makeTestInvitationEntity(docClient: DynamoDBDocumentClient) {
  return new Entity(
    {
      model: { entity: 'invitation', version: '1', service: 'worktree' },
      attributes: {
        invitationId: { type: 'string' as const, required: true },
        projectId: { type: 'string' as const, required: true },
        email: { type: 'string' as const, required: true },
        roles: {
          type: 'list' as const,
          items: { type: 'string' as const },
          default: () => ['VIEWER'],
        },
        token: { type: 'string' as const, required: true },
        invitedBy: { type: 'string' as const, required: true },
        status: { type: 'string' as const, default: 'PENDING' },
        expiresAt: { type: 'string' as const },
        acceptedAt: { type: 'string' as const },
        createdAt: { type: 'string' as const, default: () => new Date().toISOString() },
      },
      indexes: {
        primary: {
          pk: { field: 'PK', composite: ['projectId'], template: 'PROJECT#${projectId}' },
          sk: { field: 'SK', composite: ['invitationId'], template: 'INVITE#${invitationId}' },
        },
        byEmail: {
          index: 'GSI1',
          pk: { field: 'GSI1PK', composite: ['email'], template: 'EMAIL#${email}' },
          sk: { field: 'GSI1SK', composite: ['projectId'], template: 'PROJECT#${projectId}' },
        },
      },
    },
    { table: TEST_TABLE, client: docClient }
  );
}

describe('InvitationEntity — CRUD + byEmail GSI1 + status transitions', () => {
  setupDynamoDBTests();

  it('[P0] creates an invitation and retrieves it by primary key', async () => {
    const docClient = getTestDocClient();
    const InvitationEntity = makeTestInvitationEntity(docClient);

    const projectId = uuidv4();
    const invitationId = uuidv4();
    const token = uuidv4();

    await InvitationEntity.create({
      invitationId,
      projectId,
      email: 'invitee@example.com',
      token,
      invitedBy: 'user-001',
      roles: ['EDITOR'],
    }).go();

    const result = await InvitationEntity.get({ projectId, invitationId }).go();
    expect(result.data?.invitationId).toBe(invitationId);
    expect(result.data?.email).toBe('invitee@example.com');
    expect(result.data?.status).toBe('PENDING');
    expect(result.data?.roles).toEqual(['EDITOR']);
  });

  it('[P0] byEmail GSI1 — finds invitation by email across projects', async () => {
    const docClient = getTestDocClient();
    const InvitationEntity = makeTestInvitationEntity(docClient);

    const email = 'shared@example.com';
    const projectA = uuidv4();
    const projectB = uuidv4();

    await InvitationEntity.create({
      invitationId: uuidv4(),
      projectId: projectA,
      email,
      token: uuidv4(),
      invitedBy: 'admin-1',
    }).go();

    await InvitationEntity.create({
      invitationId: uuidv4(),
      projectId: projectB,
      email,
      token: uuidv4(),
      invitedBy: 'admin-2',
    }).go();

    const result = await InvitationEntity.query.byEmail({ email }).go();
    expect(result.data.length).toBe(2);
    result.data.forEach((inv) => expect(inv.email).toBe(email));
  });

  it('[P0] primary query — lists all invitations for a project', async () => {
    const docClient = getTestDocClient();
    const InvitationEntity = makeTestInvitationEntity(docClient);

    const projectId = uuidv4();

    await InvitationEntity.create({
      invitationId: uuidv4(), projectId, email: 'a@example.com', token: uuidv4(), invitedBy: 'admin',
    }).go();
    await InvitationEntity.create({
      invitationId: uuidv4(), projectId, email: 'b@example.com', token: uuidv4(), invitedBy: 'admin',
    }).go();

    const result = await InvitationEntity.query.primary({ projectId }).go();
    expect(result.data.length).toBe(2);
  });

  it('[P1] status transition — PENDING → ACCEPTED with acceptedAt timestamp', async () => {
    const docClient = getTestDocClient();
    const InvitationEntity = makeTestInvitationEntity(docClient);

    const projectId = uuidv4();
    const invitationId = uuidv4();
    const acceptedAt = new Date().toISOString();

    await InvitationEntity.create({
      invitationId, projectId, email: 'accept@example.com', token: uuidv4(), invitedBy: 'admin',
    }).go();

    await InvitationEntity.patch({ projectId, invitationId })
      .set({ status: 'ACCEPTED', acceptedAt })
      .go();

    const result = await InvitationEntity.get({ projectId, invitationId }).go();
    expect(result.data?.status).toBe('ACCEPTED');
    expect(result.data?.acceptedAt).toBe(acceptedAt);
  });

  it('[P1] status transition — PENDING → REVOKED', async () => {
    const docClient = getTestDocClient();
    const InvitationEntity = makeTestInvitationEntity(docClient);

    const projectId = uuidv4();
    const invitationId = uuidv4();

    await InvitationEntity.create({
      invitationId, projectId, email: 'revoke@example.com', token: uuidv4(), invitedBy: 'admin',
    }).go();

    await InvitationEntity.patch({ projectId, invitationId }).set({ status: 'REVOKED' }).go();

    const result = await InvitationEntity.get({ projectId, invitationId }).go();
    expect(result.data?.status).toBe('REVOKED');
  });

  it('[P1] expiresAt is stored for TTL enforcement', async () => {
    const docClient = getTestDocClient();
    const InvitationEntity = makeTestInvitationEntity(docClient);

    const projectId = uuidv4();
    const invitationId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await InvitationEntity.create({
      invitationId, projectId, email: 'exp@example.com',
      token: uuidv4(), invitedBy: 'admin', expiresAt,
    }).go();

    const result = await InvitationEntity.get({ projectId, invitationId }).go();
    expect(result.data?.expiresAt).toBe(expiresAt);
  });

  it('[P2] byEmail returns empty for unknown email', async () => {
    const docClient = getTestDocClient();
    const InvitationEntity = makeTestInvitationEntity(docClient);

    const result = await InvitationEntity.query.byEmail({ email: 'nobody@example.com' }).go();
    expect(result.data).toHaveLength(0);
  });
});
