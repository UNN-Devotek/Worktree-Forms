import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'proj-nanoid-001') }));

vi.mock('../../lib/dynamo/index.js', () => ({
  UserEntity: {
    query: { byEmail: vi.fn() },
  },
  ProjectEntity: {
    create: vi.fn(),
  },
  ProjectMemberEntity: {
    create: vi.fn(),
  },
}));

import { EmailIngestionService } from '../../services/email-ingestion.service.js';
import { UserEntity, ProjectEntity, ProjectMemberEntity } from '../../lib/dynamo/index.js';

const mockUser = UserEntity as { query: { byEmail: ReturnType<typeof vi.fn> } };
const mockProject = ProjectEntity as { create: ReturnType<typeof vi.fn> };
const mockMember = ProjectMemberEntity as { create: ReturnType<typeof vi.fn> };

describe('EmailIngestionService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('processInboundEmail', () => {
    // ─── User not found ─────────────────────────────────────────────────────

    it('[P0] returns { success: false } when user email is not registered', async () => {
      mockUser.query.byEmail.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });

      const result = await EmailIngestionService.processInboundEmail({
        from: 'unknown@example.com',
        subject: 'Hello',
        text: 'Some text',
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/user not found/i);
      expect(mockProject.create).not.toHaveBeenCalled();
    });

    // ─── Unknown intent ──────────────────────────────────────────────────────

    it('[P0] returns { success: false } when subject does not match a known intent', async () => {
      mockUser.query.byEmail.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [{ userId: 'u1', email: 'user@x.com' }] }),
      });

      const result = await EmailIngestionService.processInboundEmail({
        from: 'user@x.com',
        subject: 'Just saying hi',
        text: 'Hey!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/unknown intent/i);
    });

    // ─── Create Project intent ───────────────────────────────────────────────

    it('[P0] creates project and owner membership for "Create Project:" subject', async () => {
      mockUser.query.byEmail.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [{ userId: 'u1', email: 'user@x.com' }] }),
      });
      const fakeProject = { projectId: 'proj-nanoid-001', name: 'Alpha Mission' };
      mockProject.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: fakeProject }) });
      mockMember.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      const result = await EmailIngestionService.processInboundEmail({
        from: 'user@x.com',
        subject: 'Create Project: Alpha Mission',
        text: 'Tactical ops project',
      });

      expect(result.success).toBe(true);
      expect((result as any).action).toBe('CREATE_PROJECT');
      expect((result as any).data).toEqual(fakeProject);
    });

    it('[P0] project name is extracted from subject after "Create Project:"', async () => {
      mockUser.query.byEmail.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [{ userId: 'u1' }] }),
      });
      mockProject.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });
      mockMember.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await EmailIngestionService.processInboundEmail({
        from: 'user@x.com',
        subject: 'Create Project: Beta Squadron',
        text: 'description',
      });

      const arg = mockProject.create.mock.calls[0][0];
      expect(arg.name).toBe('Beta Squadron');
    });

    it('[P0] description is taken from email body text', async () => {
      mockUser.query.byEmail.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [{ userId: 'u1' }] }),
      });
      mockProject.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });
      mockMember.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await EmailIngestionService.processInboundEmail({
        from: 'user@x.com',
        subject: 'Create Project: Gamma Ops',
        text: '  A squad for gamma operations  ',
      });

      const arg = mockProject.create.mock.calls[0][0];
      expect(arg.description).toBe('A squad for gamma operations');
    });

    it('[P1] owner membership uses the correct userId and OWNER role', async () => {
      mockUser.query.byEmail.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [{ userId: 'user-abc' }] }),
      });
      mockProject.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });
      mockMember.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await EmailIngestionService.processInboundEmail({
        from: 'user@x.com',
        subject: 'Create Project: Delta Force',
        text: 'ops',
      });

      const memberArg = mockMember.create.mock.calls[0][0];
      expect(memberArg.userId).toBe('user-abc');
      expect(memberArg.roles).toContain('OWNER');
    });

    it('[P1] project slug is derived from name (lowercase, hyphenated)', async () => {
      mockUser.query.byEmail.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [{ userId: 'u1' }] }),
      });
      mockProject.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });
      mockMember.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await EmailIngestionService.processInboundEmail({
        from: 'user@x.com',
        subject: 'Create Project: My Cool Project',
        text: 'desc',
      });

      const arg = mockProject.create.mock.calls[0][0];
      // slug should start with "my-cool-project-" followed by random suffix
      expect(arg.slug).toMatch(/^my-cool-project-\d+$/);
    });

    it('[P1] queries user by the from address', async () => {
      mockUser.query.byEmail.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });

      await EmailIngestionService.processInboundEmail({
        from: 'specific@user.com',
        subject: 'hello',
        text: '',
      });

      expect(mockUser.query.byEmail).toHaveBeenCalledWith({ email: 'specific@user.com' });
    });
  });
});
