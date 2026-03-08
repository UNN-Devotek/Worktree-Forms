import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'audit-nanoid-001') }));

vi.mock('@/lib/dynamo', () => ({
  AuditLogEntity: {
    create: vi.fn(),
    query: {
      byUser: vi.fn(),
    },
  },
}));

import { updateNotificationPreferences, getNotificationPreferences } from './user-actions';
import { auth } from '@/auth';
import { AuditLogEntity } from '@/lib/dynamo';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockEntity = AuditLogEntity as {
  create: ReturnType<typeof vi.fn>;
  query: { byUser: ReturnType<typeof vi.fn> };
};

function authed(userId = 'user-1') {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}

function notAuthed() {
  mockAuth.mockResolvedValue(null);
}

describe('user-actions', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── updateNotificationPreferences ────────────────────────────────────────

  describe('updateNotificationPreferences', () => {
    it('[P0] returns true and writes audit entry when authenticated', async () => {
      authed('user-abc');
      mockEntity.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      const result = await updateNotificationPreferences({
        emailMentions: false,
        pushAssignments: true,
        dailyDigest: true,
      });

      expect(result).toBe(true);
      expect(mockEntity.create).toHaveBeenCalledOnce();
    });

    it('[P0] returns false when not authenticated', async () => {
      notAuthed();

      const result = await updateNotificationPreferences({ emailMentions: false });

      expect(result).toBe(false);
      expect(mockEntity.create).not.toHaveBeenCalled();
    });

    it('[P0] merges partial preferences with defaults before storing', async () => {
      authed('user-1');
      mockEntity.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await updateNotificationPreferences({ dailyDigest: true });

      const arg = mockEntity.create.mock.calls[0][0];
      // Defaults: emailMentions=true, pushAssignments=true; override: dailyDigest=true
      expect(arg.details).toEqual({
        emailMentions: true,
        pushAssignments: true,
        dailyDigest: true,
      });
    });

    it('[P0] stores action = USER_PREFS and entityType = user', async () => {
      authed('user-1');
      mockEntity.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await updateNotificationPreferences({});

      const arg = mockEntity.create.mock.calls[0][0];
      expect(arg.action).toBe('USER_PREFS');
      expect(arg.entityType).toBe('user');
      expect(arg.entityId).toBe('user-1');
    });

    it('[P1] returns false when DynamoDB create throws', async () => {
      authed();
      mockEntity.create.mockReturnValue({ go: vi.fn().mockRejectedValue(new Error('DB error')) });

      const result = await updateNotificationPreferences({});
      expect(result).toBe(false);
    });
  });

  // ─── getNotificationPreferences ───────────────────────────────────────────

  describe('getNotificationPreferences', () => {
    it('[P0] returns DEFAULT_PREFS when not authenticated', async () => {
      notAuthed();

      const result = await getNotificationPreferences();

      expect(result).toEqual({
        emailMentions: true,
        pushAssignments: true,
        dailyDigest: false,
      });
      expect(mockEntity.query.byUser).not.toHaveBeenCalled();
    });

    it('[P0] returns DEFAULT_PREFS when no USER_PREFS entries exist', async () => {
      authed('user-1');
      mockEntity.query.byUser.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });

      const result = await getNotificationPreferences();

      expect(result).toEqual({
        emailMentions: true,
        pushAssignments: true,
        dailyDigest: false,
      });
    });

    it('[P0] returns stored preferences when USER_PREFS entry exists', async () => {
      authed('user-1');
      mockEntity.query.byUser.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            {
              action: 'USER_PREFS',
              entityId: 'user-1',
              createdAt: '2026-03-01T00:00:00Z',
              details: { emailMentions: false, pushAssignments: false, dailyDigest: true },
            },
          ],
        }),
      });

      const result = await getNotificationPreferences();

      expect(result.emailMentions).toBe(false);
      expect(result.pushAssignments).toBe(false);
      expect(result.dailyDigest).toBe(true);
    });

    it('[P0] ignores non-USER_PREFS audit entries', async () => {
      authed('user-1');
      mockEntity.query.byUser.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            {
              action: 'INVITE_SENT',
              entityId: 'user-1',
              createdAt: '2026-03-02T00:00:00Z',
              details: { emailMentions: false },
            },
          ],
        }),
      });

      const result = await getNotificationPreferences();

      // No USER_PREFS entry → defaults
      expect(result).toEqual({
        emailMentions: true,
        pushAssignments: true,
        dailyDigest: false,
      });
    });

    it('[P1] returns most recent USER_PREFS entry when multiple exist', async () => {
      authed('user-1');
      mockEntity.query.byUser.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            {
              action: 'USER_PREFS',
              entityId: 'user-1',
              createdAt: '2026-03-01T00:00:00Z', // older
              details: { emailMentions: true, pushAssignments: true, dailyDigest: false },
            },
            {
              action: 'USER_PREFS',
              entityId: 'user-1',
              createdAt: '2026-03-07T12:00:00Z', // newer
              details: { emailMentions: false, pushAssignments: false, dailyDigest: true },
            },
          ],
        }),
      });

      const result = await getNotificationPreferences();

      // Most recent: emailMentions=false, dailyDigest=true
      expect(result.emailMentions).toBe(false);
      expect(result.dailyDigest).toBe(true);
    });

    it('[P1] queries audit log by the authenticated userId', async () => {
      authed('specific-user-id');
      mockEntity.query.byUser.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });

      await getNotificationPreferences();

      expect(mockEntity.query.byUser).toHaveBeenCalledWith({ userId: 'specific-user-id' });
    });

    it('[P1] returns DEFAULT_PREFS when DynamoDB query throws', async () => {
      authed();
      mockEntity.query.byUser.mockReturnValue({
        go: vi.fn().mockRejectedValue(new Error('DynamoDB error')),
      });

      const result = await getNotificationPreferences();

      expect(result).toEqual({
        emailMentions: true,
        pushAssignments: true,
        dailyDigest: false,
      });
    });
  });
});
