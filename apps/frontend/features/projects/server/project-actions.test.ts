import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'test-nanoid-001') }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/storage', () => ({ ensureProjectFolder: vi.fn() }));
vi.mock('@/lib/dynamo', () => ({
  ProjectEntity: {
    create: vi.fn(),
    delete: vi.fn(),
    query: {
      bySlug: vi.fn(),
      primary: vi.fn(),
    },
  },
  ProjectMemberEntity: {
    create: vi.fn(),
    delete: vi.fn(),
    query: {
      byUser: vi.fn(),
      primary: vi.fn(),
    },
  },
  UserEntity: {
    query: {
      primary: vi.fn(),
    },
  },
}));

import { getProjects, getProject, createProject } from './project-actions';
import { auth } from '@/auth';
import { ProjectEntity, ProjectMemberEntity, UserEntity } from '@/lib/dynamo';
import { ensureProjectFolder } from '@/lib/storage';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockProject = ProjectEntity as {
  create: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  query: { bySlug: ReturnType<typeof vi.fn>; primary: ReturnType<typeof vi.fn> };
};
const mockMember = ProjectMemberEntity as {
  create: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  query: { byUser: ReturnType<typeof vi.fn>; primary: ReturnType<typeof vi.fn> };
};
const mockUser = UserEntity as {
  query: { primary: ReturnType<typeof vi.fn> };
};
const mockEnsureFolder = ensureProjectFolder as ReturnType<typeof vi.fn>;

function authed(userId = 'user-1', systemRole = 'MEMBER') {
  mockAuth.mockResolvedValue({ user: { id: userId, systemRole } });
}

function notAuthed() {
  mockAuth.mockResolvedValue(null);
}

describe('project-actions', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── getProjects ───────────────────────────────────────────────────────────

  describe('getProjects', () => {
    it('[P0] returns [] when not authenticated', async () => {
      notAuthed();
      expect(await getProjects()).toEqual([]);
    });

    it('[P0] returns [] when user has no memberships', async () => {
      authed();
      mockMember.query.byUser.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });
      expect(await getProjects()).toEqual([]);
    });

    it('[P0] returns projects mapped with roles and member count', async () => {
      authed('user-1');
      mockMember.query.byUser.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ projectId: 'proj-1', roles: ['OWNER'], userId: 'user-1' }],
        }),
      });
      mockProject.query.primary.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ projectId: 'proj-1', name: 'My Project', updatedAt: '2026-03-01T00:00:00Z' }],
        }),
      });
      mockMember.query.primary.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [{ userId: 'user-1' }] }),
      });

      const result = await getProjects();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Project');
      expect(result[0].members[0].roles).toEqual(['OWNER']);
      expect(result[0]._count.members).toBe(1);
    });

    it('[P0] returns [] when an error is thrown', async () => {
      authed();
      mockMember.query.byUser.mockReturnValue({
        go: vi.fn().mockRejectedValue(new Error('DynamoDB error')),
      });
      expect(await getProjects()).toEqual([]);
    });

    it('[P1] sorts projects by updatedAt descending', async () => {
      authed('user-1');
      mockMember.query.byUser.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            { projectId: 'proj-1', roles: [], userId: 'user-1' },
            { projectId: 'proj-2', roles: [], userId: 'user-1' },
          ],
        }),
      });
      mockProject.query.primary
        .mockReturnValueOnce({
          go: vi.fn().mockResolvedValue({
            data: [{ projectId: 'proj-1', name: 'Older', updatedAt: '2026-01-01T00:00:00Z' }],
          }),
        })
        .mockReturnValueOnce({
          go: vi.fn().mockResolvedValue({
            data: [{ projectId: 'proj-2', name: 'Newer', updatedAt: '2026-03-01T00:00:00Z' }],
          }),
        });
      mockMember.query.primary
        .mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });

      const result = await getProjects();
      expect(result[0].name).toBe('Newer');
      expect(result[1].name).toBe('Older');
    });
  });

  // ─── getProject ────────────────────────────────────────────────────────────

  describe('getProject', () => {
    it('[P0] returns null when not authenticated', async () => {
      notAuthed();
      expect(await getProject('my-slug')).toBeNull();
    });

    it('[P0] returns null when slug not found', async () => {
      authed();
      mockProject.query.bySlug.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });
      expect(await getProject('missing-slug')).toBeNull();
    });

    it('[P0] returns null when user is not a member and not ADMIN', async () => {
      authed('user-1', 'MEMBER');
      mockProject.query.bySlug.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [{ projectId: 'proj-1', slug: 'my-slug' }] }),
      });
      mockMember.query.primary.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [{ userId: 'other-user' }] }),
      });
      expect(await getProject('my-slug')).toBeNull();
    });

    it('[P0] returns project data with members when user is a member', async () => {
      authed('user-1');
      mockProject.query.bySlug.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ projectId: 'proj-1', name: 'Test', slug: 'test' }],
        }),
      });
      mockMember.query.primary.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ userId: 'user-1', projectId: 'proj-1', roles: ['OWNER'], email: 'u@test.com' }],
        }),
      });
      mockUser.query.primary.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ userId: 'user-1', name: 'User One', email: 'u@test.com' }],
        }),
      });

      const result = await getProject('test');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test');
      expect(result?.members).toHaveLength(1);
      expect(result?.members[0].roles).toEqual(['OWNER']);
    });

    it('[P1] ADMIN user can access any project even without membership', async () => {
      authed('admin-1', 'ADMIN');
      mockProject.query.bySlug.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ projectId: 'proj-1', name: 'Admin Project', slug: 'admin-proj' }],
        }),
      });
      mockMember.query.primary.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [] }), // admin is not in members list
      });
      mockUser.query.primary.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });

      const result = await getProject('admin-proj');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Admin Project');
    });

    it('[P1] returns null when an error is thrown', async () => {
      authed();
      mockProject.query.bySlug.mockReturnValue({
        go: vi.fn().mockRejectedValue(new Error('DB error')),
      });
      expect(await getProject('slug')).toBeNull();
    });
  });

  // ─── createProject ─────────────────────────────────────────────────────────

  describe('createProject', () => {
    it('[P0] returns error when not authenticated', async () => {
      notAuthed();
      const result = await createProject({ name: 'Test' });
      expect(result).toHaveProperty('error', 'Unauthorized');
    });

    it('[P0] creates project and member with OWNER role', async () => {
      authed('user-1');
      mockProject.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockMember.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockEnsureFolder.mockResolvedValue(undefined);

      const result = await createProject({ name: 'My Project' });

      expect(result).toHaveProperty('data');
      expect(mockProject.create).toHaveBeenCalledOnce();
      expect(mockMember.create).toHaveBeenCalledOnce();
      const memberArg = mockMember.create.mock.calls[0][0];
      expect(memberArg.roles).toEqual(['OWNER']);
      expect(memberArg.userId).toBe('user-1');
    });

    it('[P0] slug is URL-safe (lowercase, no special chars)', async () => {
      authed('user-1');
      mockProject.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockMember.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockEnsureFolder.mockResolvedValue(undefined);

      await createProject({ name: 'Hello World & Beyond!' });

      const projectArg = mockProject.create.mock.calls[0][0];
      // Should be lowercase with hyphens and alphanumeric only, plus nanoid suffix
      expect(projectArg.slug).toMatch(/^[a-z0-9-]+-[a-z0-9-]+$/);
    });

    it('[P0] rolls back and returns error when ensureProjectFolder fails', async () => {
      authed('user-1');
      mockProject.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockProject.delete.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockMember.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockMember.delete.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockEnsureFolder.mockRejectedValue(new Error('Storage fail'));

      const result = await createProject({ name: 'Test' });

      expect(result).toHaveProperty('error', 'Failed to create project');
      expect(mockProject.delete).toHaveBeenCalledOnce();
      expect(mockMember.delete).toHaveBeenCalledOnce();
    });

    it('[P1] returned data includes id, projectId, name, and slug', async () => {
      authed('user-1');
      mockProject.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockMember.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockEnsureFolder.mockResolvedValue(undefined);

      const result = await createProject({ name: 'Alpha' });

      expect(result.data?.name).toBe('Alpha');
      expect(result.data?.id).toBe('test-nanoid-001');
      expect(result.data?.projectId).toBe('test-nanoid-001');
      expect(result.data?.slug).toMatch(/^alpha-/);
    });
  });
});
