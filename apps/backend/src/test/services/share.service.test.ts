import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/dynamo/index.js', () => ({
  PublicTokenEntity: {
    create: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    query: {
      byProject: vi.fn(),
    },
  },
}));

import { ShareService } from '../../services/share.service.js';
import { PublicTokenEntity } from '../../lib/dynamo/index.js';

const mockToken = PublicTokenEntity as {
  create: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  query: { byProject: ReturnType<typeof vi.fn> };
};

describe('ShareService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('generateTokenString', () => {
    it('[P0] generates a 24-character hex string', () => {
      const token = ShareService.generateTokenString();
      expect(token).toMatch(/^[a-f0-9]{24}$/);
    });

    it('[P0] generates unique tokens each call', () => {
      const a = ShareService.generateTokenString();
      const b = ShareService.generateTokenString();
      expect(a).not.toBe(b);
    });
  });

  describe('createPublicLink', () => {
    it('[P0] creates a public link with correct entity type and id', async () => {
      const mockData = { token: 'abc123', projectId: 'proj-1' };
      mockToken.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: mockData }) });

      const result = await ShareService.createPublicLink(
        'user-1', 'proj-1', 'FORM', 'form-abc', null
      );

      const createArg = mockToken.create.mock.calls[0][0];
      expect(createArg.projectId).toBe('proj-1');
      expect(createArg.entityType).toBe('FORM');
      expect(createArg.entityId).toBe('form-abc');
      expect(createArg.createdBy).toBe('user-1');
      expect(createArg.token).toMatch(/^[a-f0-9]{24}$/);
      expect(createArg.expiresAt).toBeUndefined();
      expect(result).toEqual(mockData);
    });

    it('[P1] sets expiresAt when expiresInDays is provided', async () => {
      mockToken.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      const before = Date.now();
      await ShareService.createPublicLink('u1', 'p1', 'SPEC', 'spec-1', 7);
      const after = Date.now();

      const createArg = mockToken.create.mock.calls[0][0];
      const expires = new Date(createArg.expiresAt).getTime();
      // Should be roughly 7 days from now
      expect(expires).toBeGreaterThan(before + 6 * 24 * 60 * 60 * 1000);
      expect(expires).toBeLessThan(after + 8 * 24 * 60 * 60 * 1000);
    });

    it('[P1] no expiresAt when expiresInDays is null', async () => {
      mockToken.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await ShareService.createPublicLink('u1', 'p1', 'SHEET', 'sheet-1', null);

      const createArg = mockToken.create.mock.calls[0][0];
      expect(createArg.expiresAt).toBeUndefined();
    });
  });

  describe('validateToken', () => {
    it('[P0] returns null when token not found', async () => {
      mockToken.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: null }) });

      const result = await ShareService.validateToken('nonexistent');
      expect(result).toBeNull();
    });

    it('[P0] returns null when token is expired', async () => {
      mockToken.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: {
            token: 'abc',
            expiresAt: new Date(Date.now() - 1000).toISOString(),
          },
        }),
      });

      const result = await ShareService.validateToken('abc');
      expect(result).toBeNull();
    });

    it('[P0] returns record when token is valid and not expired', async () => {
      const record = {
        token: 'abc',
        entityType: 'FORM',
        entityId: 'form-1',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      };
      mockToken.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: record }) });

      const result = await ShareService.validateToken('abc');
      expect(result).toEqual(record);
    });

    it('[P1] returns record when token has no expiry (never expires)', async () => {
      const record = { token: 'abc', entityType: 'FORM', entityId: 'form-1' };
      mockToken.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: record }) });

      const result = await ShareService.validateToken('abc');
      expect(result).toEqual(record);
    });
  });

  describe('revokeToken', () => {
    it('[P0] deletes the token by token string', async () => {
      mockToken.delete.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });

      await ShareService.revokeToken('token-xyz');

      expect(mockToken.delete).toHaveBeenCalledWith({ token: 'token-xyz' });
    });
  });

  describe('getTokensForResource', () => {
    it('[P0] returns all public tokens for a project', async () => {
      const tokens = [{ token: 'a', entityType: 'FORM' }, { token: 'b', entityType: 'SPEC' }];
      mockToken.query.byProject.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: tokens }) });

      const result = await ShareService.getTokensForResource('proj-1');
      expect(result).toEqual(tokens);
    });
  });
});
