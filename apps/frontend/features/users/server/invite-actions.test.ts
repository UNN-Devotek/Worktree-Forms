import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies — must match actual imports in invite-actions.ts
vi.mock('@/lib/dynamo', () => ({
  UserEntity: {
    query: {
      byEmail: vi.fn(() => ({ go: vi.fn() })),
      primary: vi.fn(() => ({ go: vi.fn() })),
    },
  },
  ProjectMemberEntity: {
    query: {
      primary: vi.fn(() => ({ go: vi.fn() })),
    },
    create: vi.fn(() => ({ go: vi.fn() })),
  },
  InvitationEntity: {
    create: vi.fn(() => ({ go: vi.fn() })),
    query: {
      byEmail: vi.fn(() => ({ go: vi.fn() })),
      primary: vi.fn(() => ({ go: vi.fn() })),
    },
    patch: vi.fn(() => ({ set: vi.fn(() => ({ go: vi.fn() })) })),
  },
  ProjectEntity: {
    query: {
      primary: vi.fn(() => ({ go: vi.fn() })),
    },
  },
}));

vi.mock('@/lib/dynamo/client', () => ({
  docClient: { send: vi.fn() },
  TABLE_NAME: 'worktree-test',
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-id-123'),
}));

import { inviteUser, acceptInvite, revokeInvitation } from './invite-actions';
import { auth } from '@/auth';
import { UserEntity, ProjectMemberEntity, InvitationEntity, ProjectEntity } from '@/lib/dynamo';
import { docClient } from '@/lib/dynamo/client';

describe('Invite Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inviteUser should create an invitation if user is authorized', async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'inviter-123' } });

    // Caller has ADMIN role
    (ProjectMemberEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [{ roles: ['ADMIN'] }] }),
    });

    // No existing pending invitation
    (InvitationEntity.query.byEmail as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [] }),
    });

    // User not found by email (new invitee)
    (UserEntity.query.byEmail as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [] }),
    });

    // Invitation created successfully
    (InvitationEntity.create as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: { invitationId: 'mock-id-123', token: 'mock-id-123' } }),
    });

    const formData = new FormData();
    formData.append('email', 'newuser@example.com');
    formData.append('role', 'EDITOR');
    formData.append('projectId', 'proj-123');

    const result = await inviteUser(null, formData);

    expect(result.success).toBe(true);
    expect(InvitationEntity.create).toHaveBeenCalled();
  });

  it('inviteUser should reject if caller lacks ADMIN role', async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-456' } });

    // Caller is only a VIEWER
    (ProjectMemberEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [{ roles: ['VIEWER'] }] }),
    });

    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('role', 'VIEWER');
    formData.append('projectId', 'proj-123');

    const result = await inviteUser(null, formData);

    expect(result.error).toBeTruthy();
    expect(InvitationEntity.create).not.toHaveBeenCalled();
  });

  it('acceptInvite should add member via transact write', async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'new-user-456' } });

    // User lookup by primary key
    (UserEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({
        data: [{ userId: 'new-user-456', email: 'invitee@example.com' }],
      }),
    });

    // Invitation lookup by email
    (InvitationEntity.query.byEmail as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({
        data: [{
          invitationId: 'inv-123',
          token: 'valid-token',
          projectId: 'proj-123',
          roles: ['MEMBER'],
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 10000).toISOString(),
        }],
      }),
    });

    // TransactWrite succeeds
    (docClient.send as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});

    // Project slug lookup
    (ProjectEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({
        data: [{ projectId: 'proj-123', slug: 'test-project' }],
      }),
    });

    const result = await acceptInvite('valid-token');

    expect(result.success).toBe(true);
    expect(result.projectSlug).toBe('test-project');
    expect(docClient.send).toHaveBeenCalled();
  });

  it('acceptInvite should fail for unknown token', async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-789' } });

    (UserEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({
        data: [{ userId: 'user-789', email: 'user@example.com' }],
      }),
    });

    // No matching invitation
    (InvitationEntity.query.byEmail as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [] }),
    });

    const result = await acceptInvite('bad-token');

    expect(result.error).toBeTruthy();
    expect(docClient.send).not.toHaveBeenCalled();
  });

  it('revokeInvitation should revoke the invitation if caller is ADMIN', async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'admin-123' } });

    // Caller has ADMIN role
    (ProjectMemberEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [{ roles: ['ADMIN'] }] }),
    });

    const mockPatch = {
      set: vi.fn(() => ({ go: vi.fn().mockResolvedValue({}) })),
    };
    (InvitationEntity.patch as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockPatch);

    const result = await revokeInvitation('inv-abc', 'proj-123');

    expect(result.success).toBe(true);
    expect(InvitationEntity.patch).toHaveBeenCalledWith({ projectId: 'proj-123', invitationId: 'inv-abc' });
  });

  it('revokeInvitation should reject if caller is not ADMIN', async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'member-456' } });

    (ProjectMemberEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [{ roles: ['VIEWER'] }] }),
    });

    const result = await revokeInvitation('inv-abc', 'proj-123');

    expect(result.error).toBeTruthy();
    expect(InvitationEntity.patch).not.toHaveBeenCalled();
  });
});
