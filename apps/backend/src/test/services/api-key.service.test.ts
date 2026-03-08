import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Mock ApiKeyEntity before importing the service
vi.mock('../../lib/dynamo/index.js', () => ({
  ApiKeyEntity: {
    create: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    query: {
      byProject: vi.fn(),
    },
  },
}));

import { ApiKeyService } from '../../services/api-key.service.js';
import { ApiKeyEntity } from '../../lib/dynamo/index.js';

const mockApiKeyEntity = ApiKeyEntity as {
  create: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  query: { byProject: ReturnType<typeof vi.fn> };
};

describe('ApiKeyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateKey', () => {
    it('[P0] returns a raw sk_ prefixed key and stores a SHA-256 hash', async () => {
      mockApiKeyEntity.create.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { keyHash: 'hashed', projectId: 'proj-1' } }),
      });

      const { rawKey, apiKey } = await ApiKeyService.generateKey('proj-1', 'user-1', 'My Key');

      expect(rawKey).toMatch(/^sk_[a-f0-9]+$/);
      expect(mockApiKeyEntity.create).toHaveBeenCalledOnce();

      // Verify what was passed to create — should be a SHA-256 hash, not the raw key
      const createArg = mockApiKeyEntity.create.mock.calls[0][0];
      expect(createArg.keyHash).not.toBe(rawKey);
      expect(createArg.keyHash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
      expect(createArg.projectId).toBe('proj-1');
      expect(createArg.name).toBe('My Key');
      expect(apiKey).toBeDefined();
    });

    it('[P0] default scopes are READ when not specified', async () => {
      mockApiKeyEntity.create.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: {} }),
      });

      await ApiKeyService.generateKey('proj-1', 'user-1');

      const createArg = mockApiKeyEntity.create.mock.calls[0][0];
      expect(createArg.scopes).toEqual(['READ']);
    });

    it('[P1] custom scopes are persisted', async () => {
      mockApiKeyEntity.create.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: {} }),
      });

      await ApiKeyService.generateKey('proj-1', 'user-1', 'Write Key', ['READ', 'WRITE']);

      const createArg = mockApiKeyEntity.create.mock.calls[0][0];
      expect(createArg.scopes).toEqual(['READ', 'WRITE']);
    });
  });

  describe('validateKey', () => {
    it('[P0] returns null for keys not starting with sk_', async () => {
      const result = await ApiKeyService.validateKey('invalid-key-format');
      expect(result).toBeNull();
      expect(mockApiKeyEntity.get).not.toHaveBeenCalled();
    });

    it('[P0] returns null when key record not found in DB', async () => {
      mockApiKeyEntity.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: null }),
      });

      const result = await ApiKeyService.validateKey('sk_notexist');
      expect(result).toBeNull();
    });

    it('[P0] returns null for expired key', async () => {
      const rawKey = `sk_${crypto.randomBytes(24).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

      mockApiKeyEntity.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: {
            keyHash,
            projectId: 'proj-1',
            expiresAt: new Date(Date.now() - 1000).toISOString(), // expired
          },
        }),
      });

      const result = await ApiKeyService.validateKey(rawKey);
      expect(result).toBeNull();
    });

    it('[P0] returns key data for valid non-expired key', async () => {
      const rawKey = `sk_${crypto.randomBytes(24).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

      const mockKey = {
        keyHash,
        projectId: 'proj-1',
        name: 'Test Key',
        scopes: ['READ'],
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      };

      mockApiKeyEntity.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: mockKey }),
      });

      // patch for lastUsedAt fire-and-forget
      mockApiKeyEntity.patch.mockReturnValue({
        set: vi.fn().mockReturnValue({
          go: vi.fn().mockResolvedValue({}),
        }),
      });

      const result = await ApiKeyService.validateKey(rawKey);
      expect(result).toMatchObject({ projectId: 'proj-1', name: 'Test Key' });
    });

    it('[P1] returns key when expiresAt is absent (no expiry)', async () => {
      const rawKey = `sk_${crypto.randomBytes(24).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

      mockApiKeyEntity.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: { keyHash, projectId: 'proj-1', scopes: ['READ'] },
        }),
      });
      mockApiKeyEntity.patch.mockReturnValue({
        set: vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) }),
      });

      const result = await ApiKeyService.validateKey(rawKey);
      expect(result).toBeDefined();
      expect(result?.projectId).toBe('proj-1');
    });
  });

  describe('listKeys', () => {
    it('[P0] returns keys for a project', async () => {
      const keys = [{ keyHash: 'h1', name: 'Key 1' }, { keyHash: 'h2', name: 'Key 2' }];
      mockApiKeyEntity.query.byProject.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: keys }),
      });

      const result = await ApiKeyService.listKeys('proj-1');
      expect(result).toEqual(keys);
      expect(mockApiKeyEntity.query.byProject).toHaveBeenCalledWith({ projectId: 'proj-1' });
    });
  });

  describe('revokeKey', () => {
    it('[P0] calls delete with the key hash', async () => {
      mockApiKeyEntity.delete.mockReturnValue({
        go: vi.fn().mockResolvedValue({}),
      });

      await ApiKeyService.revokeKey('abc123hash');
      expect(mockApiKeyEntity.delete).toHaveBeenCalledWith({ keyHash: 'abc123hash' });
    });
  });
});
