import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { Entity } from 'electrodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  setupDynamoDBTests,
  getTestDocClient,
  TEST_TABLE,
} from '../setup/dynamodb.js';

function makeTestWebhookEntity(docClient: DynamoDBDocumentClient) {
  return new Entity(
    {
      model: { entity: 'webhook', version: '1', service: 'worktree' },
      attributes: {
        webhookId: { type: 'string' as const, required: true },
        projectId: { type: 'string' as const, required: true },
        url: { type: 'string' as const, required: true },
        events: {
          type: 'list' as const,
          items: { type: 'string' as const },
          default: () => [],
        },
        secret: { type: 'string' as const },
        isActive: { type: 'boolean' as const, default: true },
        createdBy: { type: 'string' as const },
        createdAt: { type: 'string' as const, default: () => new Date().toISOString() },
        updatedAt: { type: 'string' as const, default: () => new Date().toISOString() },
      },
      indexes: {
        primary: {
          pk: { field: 'PK', composite: ['projectId'], template: 'PROJECT#${projectId}' },
          sk: { field: 'SK', composite: ['webhookId'], template: 'WEBHOOK#${webhookId}' },
        },
        byProject: {
          index: 'GSI1',
          pk: { field: 'GSI1PK', composite: ['projectId'], template: 'WEBHOOKS#${projectId}' },
          sk: { field: 'GSI1SK', composite: ['createdAt'], template: '${createdAt}' },
        },
      },
    },
    { table: TEST_TABLE, client: docClient }
  );
}

describe('WebhookEntity — CRUD + byProject GSI1', () => {
  setupDynamoDBTests();

  it('[P0] creates a webhook and retrieves it by primary key', async () => {
    const docClient = getTestDocClient();
    const WebhookEntity = makeTestWebhookEntity(docClient);

    const projectId = uuidv4();
    const webhookId = uuidv4();

    await WebhookEntity.create({
      webhookId,
      projectId,
      url: 'https://example.com/hook',
      events: ['form.submitted', 'task.created'],
      createdBy: 'user-001',
    }).go();

    const result = await WebhookEntity.get({ projectId, webhookId }).go();
    expect(result.data?.webhookId).toBe(webhookId);
    expect(result.data?.url).toBe('https://example.com/hook');
    expect(result.data?.events).toEqual(['form.submitted', 'task.created']);
    expect(result.data?.isActive).toBe(true);
  });

  it('[P0] primary query — lists all webhooks for a project', async () => {
    const docClient = getTestDocClient();
    const WebhookEntity = makeTestWebhookEntity(docClient);

    const projectId = uuidv4();

    await WebhookEntity.create({ webhookId: uuidv4(), projectId, url: 'https://a.example.com/h' }).go();
    await WebhookEntity.create({ webhookId: uuidv4(), projectId, url: 'https://b.example.com/h' }).go();

    const result = await WebhookEntity.query.primary({ projectId }).go();
    expect(result.data.length).toBe(2);
    result.data.forEach((w) => expect(w.projectId).toBe(projectId));
  });

  it('[P0] cross-project isolation — webhooks from other projects are not returned', async () => {
    const docClient = getTestDocClient();
    const WebhookEntity = makeTestWebhookEntity(docClient);

    const projectA = uuidv4();
    const projectB = uuidv4();

    await WebhookEntity.create({ webhookId: uuidv4(), projectId: projectA, url: 'https://a.com/h' }).go();
    await WebhookEntity.create({ webhookId: uuidv4(), projectId: projectB, url: 'https://b.com/h' }).go();

    const resultA = await WebhookEntity.query.primary({ projectId: projectA }).go();
    expect(resultA.data.every((w) => w.projectId === projectA)).toBe(true);
  });

  it('[P1] isActive toggle — can be disabled and re-enabled', async () => {
    const docClient = getTestDocClient();
    const WebhookEntity = makeTestWebhookEntity(docClient);

    const projectId = uuidv4();
    const webhookId = uuidv4();

    await WebhookEntity.create({ webhookId, projectId, url: 'https://example.com/h' }).go();

    // Disable
    await WebhookEntity.update({ projectId, webhookId }).set({ isActive: false }).go();
    let result = await WebhookEntity.get({ projectId, webhookId }).go();
    expect(result.data?.isActive).toBe(false);

    // Re-enable
    await WebhookEntity.update({ projectId, webhookId }).set({ isActive: true }).go();
    result = await WebhookEntity.get({ projectId, webhookId }).go();
    expect(result.data?.isActive).toBe(true);
  });

  it('[P1] secret is stored for HMAC verification', async () => {
    const docClient = getTestDocClient();
    const WebhookEntity = makeTestWebhookEntity(docClient);

    const projectId = uuidv4();
    const webhookId = uuidv4();

    await WebhookEntity.create({
      webhookId,
      projectId,
      url: 'https://secure.example.com/h',
      secret: 'whsec_abc123',
    }).go();

    const result = await WebhookEntity.get({ projectId, webhookId }).go();
    expect(result.data?.secret).toBe('whsec_abc123');
  });

  it('[P2] delete removes the webhook', async () => {
    const docClient = getTestDocClient();
    const WebhookEntity = makeTestWebhookEntity(docClient);

    const projectId = uuidv4();
    const webhookId = uuidv4();

    await WebhookEntity.create({ webhookId, projectId, url: 'https://del.example.com/h' }).go();
    await WebhookEntity.delete({ projectId, webhookId }).go();

    const result = await WebhookEntity.query.primary({ projectId }).go();
    expect(result.data.find((w) => w.webhookId === webhookId)).toBeUndefined();
  });
});
