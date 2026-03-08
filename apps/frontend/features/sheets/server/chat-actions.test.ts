import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'chat-nanoid-001') }));
vi.mock('@/lib/dynamo', () => ({
  AuditLogEntity: {
    create: vi.fn(),
    query: { primary: vi.fn() },
  },
  ProjectMemberEntity: {
    query: { primary: vi.fn() },
  },
  UserEntity: {
    query: { primary: vi.fn() },
  },
}));

import { sendMessage, getMessages } from './chat-actions';
import { auth } from '@/auth';
import { AuditLogEntity, ProjectMemberEntity, UserEntity } from '@/lib/dynamo';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockAudit = AuditLogEntity as {
  create: ReturnType<typeof vi.fn>;
  query: { primary: ReturnType<typeof vi.fn> };
};
const mockMember = ProjectMemberEntity as {
  query: { primary: ReturnType<typeof vi.fn> };
};
const mockUserEntity = UserEntity as {
  query: { primary: ReturnType<typeof vi.fn> };
};

function authed(userId = 'user-1', name = 'Alice') {
  mockAuth.mockResolvedValue({ user: { id: userId, name } });
}

function notAuthed() {
  mockAuth.mockResolvedValue(null);
}

function memberOf(projectId: string, userId = 'user-1') {
  mockMember.query.primary.mockReturnValue({
    go: vi.fn().mockResolvedValue({ data: [{ userId, projectId }] }),
  });
}

function notMemberOf() {
  mockMember.query.primary.mockReturnValue({
    go: vi.fn().mockResolvedValue({ data: [] }),
  });
}

function userLookup(name = 'Alice') {
  mockUserEntity.query.primary.mockReturnValue({
    go: vi.fn().mockResolvedValue({ data: [{ userId: 'user-1', name }] }),
  });
}

describe('chat-actions', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── sendMessage ───────────────────────────────────────────────────────────

  describe('sendMessage', () => {
    it('[P0] returns null when not authenticated', async () => {
      notAuthed();
      const result = await sendMessage('proj-1', 'Hello');
      expect(result).toBeNull();
    });

    it('[P0] returns null when user is not a project member', async () => {
      authed();
      notMemberOf();
      const result = await sendMessage('proj-1', 'Hello');
      expect(result).toBeNull();
    });

    it('[P0] returns null for empty text', async () => {
      authed();
      memberOf('proj-1');
      userLookup();
      const result = await sendMessage('proj-1', '   ');
      expect(result).toBeNull();
    });

    it('[P0] returns ChatMessage when authenticated and member', async () => {
      authed('user-1', 'Alice');
      memberOf('proj-1');
      userLookup('Alice');
      mockAudit.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });

      const result = await sendMessage('proj-1', 'Hello world');

      expect(result).not.toBeNull();
      expect(result?.text).toBe('Hello world');
      expect(result?.userId).toBe('user-1');
      expect(result?.senderName).toBe('Alice');
      expect(result?.projectId).toBe('proj-1');
      expect(result?.messageId).toBe('chat-nanoid-001');
    });

    it('[P0] stores action = CHAT_MESSAGE in AuditLogEntity', async () => {
      authed('user-1', 'Alice');
      memberOf('proj-1');
      userLookup('Alice');
      mockAudit.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });

      await sendMessage('proj-1', 'Test message');

      const arg = mockAudit.create.mock.calls[0][0];
      expect(arg.action).toBe('CHAT_MESSAGE');
      expect(arg.entityType).toBe('chat');
      expect(arg.projectId).toBe('proj-1');
    });

    it('[P1] trims whitespace from text before storing', async () => {
      authed('user-1', 'Alice');
      memberOf('proj-1');
      userLookup('Alice');
      mockAudit.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });

      const result = await sendMessage('proj-1', '  trimmed  ');

      expect(result?.text).toBe('trimmed');
      const arg = mockAudit.create.mock.calls[0][0];
      expect(arg.details.text).toBe('trimmed');
    });

    it('[P1] uses user name from UserEntity query when available', async () => {
      authed('user-1', 'Session Name');
      memberOf('proj-1');
      userLookup('DB Name');
      mockAudit.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });

      const result = await sendMessage('proj-1', 'Hi');
      // UserEntity result takes precedence over session name
      expect(result?.senderName).toBe('DB Name');
    });

    it('[P1] returns null when AuditLogEntity throws', async () => {
      authed();
      memberOf('proj-1');
      userLookup();
      mockAudit.create.mockReturnValue({ go: vi.fn().mockRejectedValue(new Error('DB fail')) });

      const result = await sendMessage('proj-1', 'Hello');
      expect(result).toBeNull();
    });
  });

  // ─── getMessages ───────────────────────────────────────────────────────────

  describe('getMessages', () => {
    it('[P0] returns [] when not authenticated', async () => {
      notAuthed();
      const result = await getMessages('proj-1');
      expect(result).toEqual([]);
    });

    it('[P0] returns [] when user is not a project member', async () => {
      authed();
      notMemberOf();
      const result = await getMessages('proj-1');
      expect(result).toEqual([]);
    });

    it('[P0] returns only CHAT_MESSAGE entries, filtered from other actions', async () => {
      authed();
      memberOf('proj-1');
      userLookup();
      mockAudit.query.primary.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            {
              auditId: 'a1', action: 'CHAT_MESSAGE', projectId: 'proj-1',
              userId: 'user-1', createdAt: '2026-03-01T00:00:00Z',
              details: { text: 'Hello', senderName: 'Alice' },
            },
            {
              auditId: 'a2', action: 'FORM_SUBMIT', projectId: 'proj-1',
              userId: 'user-1', createdAt: '2026-03-01T01:00:00Z',
              details: { formId: 'f1' },
            },
          ],
        }),
      });

      const result = await getMessages('proj-1');
      expect(result).toHaveLength(1);
      expect(result[0].messageId).toBe('a1');
      expect(result[0].text).toBe('Hello');
    });

    it('[P0] maps fields correctly to ChatMessage shape', async () => {
      authed('user-1');
      memberOf('proj-1');
      userLookup();
      mockAudit.query.primary.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            {
              auditId: 'msg-1', action: 'CHAT_MESSAGE', projectId: 'proj-1',
              userId: 'user-1', createdAt: '2026-03-07T12:00:00Z',
              details: { text: 'Hey there', senderName: 'Bob' },
            },
          ],
        }),
      });

      const result = await getMessages('proj-1');
      expect(result[0]).toMatchObject({
        messageId: 'msg-1',
        projectId: 'proj-1',
        userId: 'user-1',
        senderName: 'Bob',
        text: 'Hey there',
        createdAt: '2026-03-07T12:00:00Z',
      });
    });

    it('[P1] returns empty array when DynamoDB throws', async () => {
      authed();
      memberOf('proj-1');
      userLookup();
      mockAudit.query.primary.mockReturnValue({
        go: vi.fn().mockRejectedValue(new Error('DynamoDB error')),
      });

      const result = await getMessages('proj-1');
      expect(result).toEqual([]);
    });

    it('[P1] returns last 100 when more than 100 CHAT_MESSAGE entries exist', async () => {
      authed();
      memberOf('proj-1');
      userLookup();

      // Spread across 120 days so createdAt is always valid ISO 8601
      const baseDate = new Date('2026-01-01T00:00:00Z');
      const entries = Array.from({ length: 120 }, (_, i) => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        return {
          auditId: `msg-${i}`,
          action: 'CHAT_MESSAGE',
          projectId: 'proj-1',
          userId: 'user-1',
          createdAt: d.toISOString(),
          details: { text: `Message ${i}`, senderName: 'User' },
        };
      });
      mockAudit.query.primary.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: entries }),
      });

      const result = await getMessages('proj-1');
      expect(result).toHaveLength(100);
      // slice(-100) returns the last 100 (entries 20..119)
      expect(result[0].messageId).toBe('msg-20');
    });
  });
});
