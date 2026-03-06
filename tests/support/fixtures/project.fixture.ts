import { test as base } from './auth.fixture';
import { PrismaClient } from '@prisma/client';
import { createProject, Project } from '../factories/project.factory';

// FORCE LOCAL DB for Host Seeding
process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/worktree';

const prisma = new PrismaClient();

type ProjectFixture = {
  seedProject: (overrides?: Partial<Project>) => Promise<Project>;
};

export const test = base.extend<ProjectFixture>({
  seedProject: async ({ authenticatedUser }, use) => {
    const seed = async (overrides: Partial<Project> = {}) => {
      const data = createProject(overrides);
      console.log('[TEST] Seeding Project:', data.name);
      
      try {
        const p = await prisma.project.create({
            data: {
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            createdById: authenticatedUser.id,
            roles: {
                OWNER: ["*"],
                MEMBER: ["read", "write"],
                VIEWER: ["read"]
            },
            members: {
                create: {
                userId: authenticatedUser.id,
                roles: ["OWNER"]
                }
            }
            }
        });
        return p as unknown as Project;
      } catch (error) {
          console.error('[TEST] Failed to seed project:', error);
          throw error;
      }
    };
    await use(seed);
  }
});
