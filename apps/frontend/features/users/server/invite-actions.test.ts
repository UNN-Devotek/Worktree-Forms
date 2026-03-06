import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
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
  PublicTokenEntity: {
    create: vi.fn(() => ({ go: vi.fn() })),
    query: {
      primary: vi.fn(() => ({ go: vi.fn() })),
    },
    delete: vi.fn(() => ({ go: vi.fn() })),
  },
  ProjectEntity: {
    query: {
      primary: vi.fn(() => ({ go: vi.fn() })),
    },
  },
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { inviteUser, acceptInvite, revokeInvitation } from './invite-actions';
import { auth } from '@/auth';
import { UserEntity, ProjectMemberEntity, PublicTokenEntity, ProjectEntity } from '@/lib/dynamo';

describe('Invite Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inviteUser should create an invitation if user is authorized', async () => {
    // Setup Mocks
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'inviter-123' } });
    // User not found by email
    (UserEntity.query.byEmail as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [] }),
    });
    // PublicTokenEntity.create mock
    (PublicTokenEntity.create as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: { token: 'test-token' } }),
    });

    // Execute
    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('role', 'MEMBER');
    formData.append('projectId', 'proj-123');

    const result = await inviteUser(null, formData);

    // Verify
    expect(result.success).toBe(true);
    expect(PublicTokenEntity.create).toHaveBeenCalled();
  });

  it('acceptInvite should add member and delete invite', async () => {
    // Setup Mocks
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'new-user-456' } });
    (PublicTokenEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({
        data: [{
          token: 'valid-token',
          projectId: 'proj-123',
          expiresAt: new Date(Date.now() + 10000).toISOString(),
        }],
      }),
    });
    (ProjectMemberEntity.create as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: {} }),
    });
    (PublicTokenEntity.delete as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({}),
    });
    (ProjectEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({
        data: [{ projectId: 'proj-123', slug: 'test-project' }],
      }),
    });

    // Execute
    const result = await acceptInvite('valid-token');

    // Verify
    expect(result.success).toBe(true);
    expect(result.projectSlug).toBe('test-project');
  });

  it('revokeInvitation should delete the invitation', async () => {
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'admin-123' } });
    (PublicTokenEntity.delete as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({}),
    });

    const result = await revokeInvitation('test-token', 'proj-123');

    expect(result.success).toBe(true);
    expect(PublicTokenEntity.delete).toHaveBeenCalledWith({ token: 'test-token' });
  });
});
