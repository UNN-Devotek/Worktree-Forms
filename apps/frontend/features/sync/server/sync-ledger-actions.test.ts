import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dynamo', () => ({
  SyncLedgerEntity: {
    create: vi.fn(() => ({ go: vi.fn() })),
    patch: vi.fn(() => ({ set: vi.fn(() => ({ go: vi.fn() })) })),
  },
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import { recordSyncAttempt, markSyncSuccess, markSyncFailed } from './sync-ledger-actions';
import { auth } from '@/auth';
import { SyncLedgerEntity } from '@/lib/dynamo';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockEntity = SyncLedgerEntity as {
  create: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

describe('sync-ledger-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordSyncAttempt', () => {
    it('[P0] creates a PENDING sync record for authenticated user', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

      const mockGo = vi.fn().mockResolvedValue({});
      mockEntity.create.mockReturnValue({ go: mockGo });

      await recordSyncAttempt('device-abc', 'mutation-001', 'proj-1');

      expect(mockEntity.create).toHaveBeenCalledOnce();
      const createArg = mockEntity.create.mock.calls[0][0];
      expect(createArg.deviceId).toBe('device-abc');
      expect(createArg.submissionId).toBe('mutation-001');
      expect(createArg.projectId).toBe('proj-1');
      expect(createArg.syncStatus).toBe('PENDING');
      expect(createArg.retryCount).toBe(0);
    });

    it('[P0] throws when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(recordSyncAttempt('device-abc', 'mutation-001', 'proj-1')).rejects.toThrow(
        'Unauthorized'
      );
      expect(mockEntity.create).not.toHaveBeenCalled();
    });

    it('[P1] uses __sync__ sentinel projectId when projectId is empty', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockEntity.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });

      await recordSyncAttempt('device-abc', 'mutation-001', '');

      const createArg = mockEntity.create.mock.calls[0][0];
      expect(createArg.projectId).toBe('__sync__');
    });
  });

  describe('markSyncSuccess', () => {
    it('[P0] patches record with SYNCED status and syncedAt timestamp', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

      const mockGo = vi.fn().mockResolvedValue({});
      const mockSet = vi.fn().mockReturnValue({ go: mockGo });
      mockEntity.patch.mockReturnValue({ set: mockSet });

      await markSyncSuccess('device-abc', 'mutation-001', 'proj-1');

      expect(mockEntity.patch).toHaveBeenCalledWith({
        projectId: 'proj-1',
        deviceId: 'device-abc',
        submissionId: 'mutation-001',
      });

      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.syncStatus).toBe('SYNCED');
      expect(setArg.syncedAt).toBeDefined();
    });

    it('[P0] throws when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(markSyncSuccess('d', 'm', 'p')).rejects.toThrow('Unauthorized');
    });
  });

  describe('markSyncFailed', () => {
    it('[P0] sets status to PENDING when retryCount < 5', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

      const mockGo = vi.fn().mockResolvedValue({});
      const mockSet = vi.fn().mockReturnValue({ go: mockGo });
      mockEntity.patch.mockReturnValue({ set: mockSet });

      await markSyncFailed('device-abc', 'mutation-001', 'proj-1', 3, 'Network timeout');

      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.syncStatus).toBe('PENDING');
      expect(setArg.retryCount).toBe(3);
      expect(setArg.errorMessage).toBe('Network timeout');
    });

    it('[P0] sets status to FAILED when retryCount >= 5', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

      const mockGo = vi.fn().mockResolvedValue({});
      const mockSet = vi.fn().mockReturnValue({ go: mockGo });
      mockEntity.patch.mockReturnValue({ set: mockSet });

      await markSyncFailed('device-abc', 'mutation-001', 'proj-1', 5, 'Server error');

      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.syncStatus).toBe('FAILED');
    });

    it('[P0] throws when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(markSyncFailed('d', 'm', 'p', 1, 'err')).rejects.toThrow('Unauthorized');
    });
  });
});
