import { describe, it, expect, beforeAll } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

/**
 * @tag integration
 * ProjectEntity integration tests — validates GSI1 slug lookup and
 * storage quota tracking (critical for FinOps epic 5-4).
 */

describe('ProjectEntity — CRUD + GSI1 slug lookup', () => {
  let ProjectEntity: typeof import('../../lib/dynamo/entities/project.entity').ProjectEntity;

  beforeAll(async () => {
    const mod = await import('../../lib/dynamo/entities/project.entity');
    ProjectEntity = mod.ProjectEntity;
  });

  it('[P0] creates a project and retrieves by primary key', async () => {
    const projectId = uuidv4();
    const slug = `test-project-${projectId.slice(0, 8)}`;

    await ProjectEntity.create({
      projectId,
      slug,
      name: 'Test Project',
      ownerId: uuidv4(),
    }).go();

    const result = await ProjectEntity.get({ projectId }).go();
    expect(result.data).toBeDefined();
    expect(result.data?.projectId).toBe(projectId);
    expect(result.data?.slug).toBe(slug);
  });

  it('[P0] GSI1 bySlug — query retrieves project by slug', async () => {
    const projectId = uuidv4();
    const slug = `slug-lookup-${projectId.slice(0, 8)}`;

    await ProjectEntity.create({
      projectId,
      slug,
      name: 'Slug Lookup Project',
      ownerId: uuidv4(),
    }).go();

    const result = await ProjectEntity.query.bySlug({ slug }).go();
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].projectId).toBe(projectId);
  });

  it('[P1] storage quota defaults to 10GB and tracking starts at 0', async () => {
    const projectId = uuidv4();
    await ProjectEntity.create({
      projectId,
      slug: `quota-${projectId.slice(0, 8)}`,
      name: 'Quota Test',
      ownerId: uuidv4(),
    }).go();

    const result = await ProjectEntity.get({ projectId }).go();
    expect(result.data?.storageUsedBytes).toBe(0);
    expect(result.data?.storageQuotaBytes).toBe(10_737_418_240); // 10GB
  });

  it('[P1] update storageUsedBytes increments correctly', async () => {
    const projectId = uuidv4();
    await ProjectEntity.create({
      projectId,
      slug: `storage-${projectId.slice(0, 8)}`,
      name: 'Storage Test',
      ownerId: uuidv4(),
    }).go();

    await ProjectEntity.update({ projectId }).set({ storageUsedBytes: 1_048_576 }).go();

    const result = await ProjectEntity.get({ projectId }).go();
    expect(result.data?.storageUsedBytes).toBe(1_048_576);
  });

  it('[P2] settings field stores arbitrary JSON', async () => {
    const projectId = uuidv4();
    const settings = { theme: 'dark', featureFlags: { betaGrid: true } };

    await ProjectEntity.create({
      projectId,
      slug: `settings-${projectId.slice(0, 8)}`,
      name: 'Settings Test',
      ownerId: uuidv4(),
      settings,
    }).go();

    const result = await ProjectEntity.get({ projectId }).go();
    expect(result.data?.settings).toMatchObject(settings);
  });

  it('[P0] slug uniqueness — two projects with same slug both stored (no DB-level unique constraint)', async () => {
    // DynamoDB has no unique constraints — uniqueness enforced at application layer.
    // This test documents the expected behavior.
    const slug = `dup-slug-${uuidv4().slice(0, 8)}`;
    const id1 = uuidv4();
    const id2 = uuidv4();

    await ProjectEntity.create({
      projectId: id1,
      slug,
      name: 'Project 1',
      ownerId: uuidv4(),
    }).go();

    await ProjectEntity.create({
      projectId: id2,
      slug,
      name: 'Project 2',
      ownerId: uuidv4(),
    }).go();

    // GSI1 returns BOTH — application must check for duplicate before creating
    const result = await ProjectEntity.query.bySlug({ slug }).go();
    expect(result.data.length).toBe(2);
  });
});
