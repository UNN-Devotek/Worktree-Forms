import { test as base } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * DynamoDB-backed Playwright fixtures.
 * Replaces the broken Prisma-backed project.fixture.ts.
 * Uses API calls (via adminRequest) to seed/teardown data — no direct DB access.
 *
 * Usage:
 *   import { test } from '../support/fixtures/dynamo.fixture';
 *   test('my test', async ({ seedProject, adminRequest }) => { ... });
 */

export interface SeededProject {
  id: string;
  name: string;
  slug: string;
}

export interface SeededForm {
  id: string;
  formId: string;
  name: string;
  projectId: string;
}

interface DynamoFixtures {
  adminRequest: import('@playwright/test').APIRequestContext;
  memberRequest: import('@playwright/test').APIRequestContext;
  seedProject: (overrides?: Partial<{ name: string; description: string }>) => Promise<SeededProject>;
  seedForm: (
    projectId: string,
    overrides?: Partial<{ name: string }>
  ) => Promise<SeededForm>;
}

export const test = base.extend<DynamoFixtures>({
  adminRequest: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3005',
      storageState: 'playwright/.auth/admin.json',
    });
    await use(ctx);
    await ctx.dispose();
  },

  memberRequest: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3005',
      storageState: 'playwright/.auth/member.json',
    });
    await use(ctx);
    await ctx.dispose();
  },

  seedProject: async ({ adminRequest }, use) => {
    const created: SeededProject[] = [];

    const seed = async (
      overrides: Partial<{ name: string; description: string }> = {}
    ): Promise<SeededProject> => {
      const name = overrides.name ?? `Test Project ${faker.string.alphanumeric(6)}`;
      const res = await adminRequest.post('/api/projects', {
        data: { name, description: overrides.description ?? 'Automated test project' },
      });

      if (!res.ok()) {
        throw new Error(
          `seedProject failed: ${res.status()} ${await res.text()}`
        );
      }

      const body = await res.json();
      const data = body.data ?? body;
      const project: SeededProject = {
        id: data.projectId ?? data.id,
        name: data.name,
        slug: data.slug,
      };
      created.push(project);
      return project;
    };

    await use(seed);

    // Teardown: delete all seeded projects
    for (const p of created) {
      await adminRequest.delete(`/api/projects/${p.id}`).catch(() => {
        // Best-effort cleanup — don't fail test on teardown error
      });
    }
  },

  seedForm: async ({ adminRequest }, use) => {
    const created: Array<{ formId: string; projectId: string }> = [];

    const seed = async (
      projectId: string,
      overrides: Partial<{ name: string }> = {}
    ): Promise<SeededForm> => {
      const name = overrides.name ?? `Test Form ${faker.string.alphanumeric(6)}`;
      const res = await adminRequest.post('/api/forms', {
        data: { name, projectId },
      });

      if (!res.ok()) {
        throw new Error(`seedForm failed: ${res.status()} ${await res.text()}`);
      }

      const body = await res.json();
      const data = body.data ?? body;
      const formId = data.formId ?? data.id;
      created.push({ formId, projectId });
      return { id: formId, formId, name: data.name, projectId };
    };

    await use(seed);

    // Teardown: delete all seeded forms
    for (const f of created) {
      await adminRequest
        .delete(`/api/forms/${f.formId}?projectId=${f.projectId}`)
        .catch(() => {});
    }
  },
});

export { expect } from '@playwright/test';
