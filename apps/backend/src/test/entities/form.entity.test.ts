import { describe, it, expect, beforeAll } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

/**
 * @tag integration
 * FormEntity integration tests — validates project-scoped form CRUD,
 * GSI1 byProject listing, and schema versioning.
 * All queries are scoped by projectId (multi-tenancy enforcement).
 */

describe('FormEntity — CRUD + project-scoped GSI1', () => {
  let FormEntity: typeof import('../../lib/dynamo/entities/form.entity').FormEntity;

  beforeAll(async () => {
    const mod = await import('../../lib/dynamo/entities/form.entity');
    FormEntity = mod.FormEntity;
  });

  it('[P0] creates a form scoped to a project', async () => {
    const projectId = uuidv4();
    const formId = uuidv4();

    await FormEntity.create({
      formId,
      projectId,
      name: 'Test Form',
      status: 'DRAFT',
    }).go();

    const result = await FormEntity.get({ projectId, formId }).go();
    expect(result.data).toBeDefined();
    expect(result.data?.formId).toBe(formId);
    expect(result.data?.projectId).toBe(projectId);
    expect(result.data?.status).toBe('DRAFT');
  });

  it('[P0] GSI1 byProject — lists all forms for a project ordered by createdAt', async () => {
    const projectId = uuidv4();

    await FormEntity.create({ formId: uuidv4(), projectId, name: 'Form A' }).go();
    await FormEntity.create({ formId: uuidv4(), projectId, name: 'Form B' }).go();

    const result = await FormEntity.query.byProject({ projectId }).go();
    expect(result.data.length).toBe(2);
    result.data.forEach((f) => expect(f.projectId).toBe(projectId));
  });

  it('[P0] cross-project isolation — GSI1 byProject does not return other projects forms', async () => {
    const projectA = uuidv4();
    const projectB = uuidv4();

    await FormEntity.create({ formId: uuidv4(), projectId: projectA, name: 'Form A1' }).go();
    await FormEntity.create({ formId: uuidv4(), projectId: projectB, name: 'Form B1' }).go();

    const resultA = await FormEntity.query.byProject({ projectId: projectA }).go();
    resultA.data.forEach((f) => expect(f.projectId).toBe(projectA));

    const resultB = await FormEntity.query.byProject({ projectId: projectB }).go();
    resultB.data.forEach((f) => expect(f.projectId).toBe(projectB));
  });

  it('[P1] schema field stores complex JSON (pages + fields)', async () => {
    const projectId = uuidv4();
    const formId = uuidv4();
    const schema = {
      pages: [
        {
          id: 'page-1',
          fields: [
            { id: 'field-1', type: 'text', label: 'Name', required: true },
            { id: 'field-2', type: 'email', label: 'Email', required: true },
          ],
        },
      ],
    };

    await FormEntity.create({ formId, projectId, name: 'Schema Form', schema }).go();

    const result = await FormEntity.get({ projectId, formId }).go();
    expect(result.data?.schema).toMatchObject(schema);
  });

  it('[P1] publish form changes status from DRAFT to PUBLISHED', async () => {
    const projectId = uuidv4();
    const formId = uuidv4();

    await FormEntity.create({ formId, projectId, name: 'Publish Test', status: 'DRAFT' }).go();
    await FormEntity.update({ projectId, formId }).set({ status: 'PUBLISHED' }).go();

    const result = await FormEntity.get({ projectId, formId }).go();
    expect(result.data?.status).toBe('PUBLISHED');
  });

  it('[P1] version increment — currentVersion tracks schema changes', async () => {
    const projectId = uuidv4();
    const formId = uuidv4();

    await FormEntity.create({ formId, projectId, name: 'Versioned Form' }).go();
    expect((await FormEntity.get({ projectId, formId }).go()).data?.currentVersion).toBe(1);

    await FormEntity.update({ projectId, formId }).set({ currentVersion: 2 }).go();
    expect((await FormEntity.get({ projectId, formId }).go()).data?.currentVersion).toBe(2);
  });

  it('[P2] delete form removes it from project listing', async () => {
    const projectId = uuidv4();
    const formId = uuidv4();

    await FormEntity.create({ formId, projectId, name: 'Delete Test' }).go();
    await FormEntity.delete({ projectId, formId }).go();

    const result = await FormEntity.query.byProject({ projectId }).go();
    expect(result.data.find((f) => f.formId === formId)).toBeUndefined();
  });
});
