import { ApiKeyEntity } from '../lib/dynamo/index.js';
import crypto, { timingSafeEqual, createHash } from 'crypto';

/**
 * Compares a raw API key against a stored SHA-256 hex hash using a
 * constant-time comparison to prevent timing-based side-channel attacks.
 */
function safeCompareHashes(inputKey: string, storedHash: string): boolean {
  const inputHash = createHash('sha256').update(inputKey).digest('hex');
  const bufA = Buffer.from(inputHash);
  const bufB = Buffer.from(storedHash);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export class ApiKeyService {
  /**
   * Generates a new API Key.
   * Returns the RAW key (to be shown once) and the created DB record.
   */
  static async generateKey(projectId: string, createdBy: string, name?: string, scopes: string[] = ['READ']) {
    const rawKey = `sk_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const result = await ApiKeyEntity.create({
      keyHash,
      projectId,
      name: name ?? 'API Key',
      scopes,
      createdBy,
    }).go();

    return { rawKey, apiKey: result.data };
  }

  /**
   * Validates an API Key.
   * Steps: Hash input -> Find Record -> Check Expiry -> Update LastUsed.
   */
  static async validateKey(rawKey: string) {
    if (!rawKey.startsWith('sk_')) return null;

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const result = await ApiKeyEntity.get({ keyHash }).go();
    const apiKey = result.data;

    if (!apiKey) return null;

    // Timing-safe verification
    if (!safeCompareHashes(rawKey, apiKey.keyHash)) return null;

    // Check Expiry
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return null;
    }

    // Async Update LastUsed (Fire & Forget)
    ApiKeyEntity.patch({ keyHash })
      .set({ lastUsedAt: new Date().toISOString() })
      .go()
      .catch(console.error);

    return apiKey;
  }

  /**
   * List keys for a project.
   */
  static async listKeys(projectId: string) {
    const result = await ApiKeyEntity.query.byProject({ projectId }).go();
    return result.data;
  }

  /**
   * Revoke (Delete) a key by hash.
   */
  static async revokeKey(keyHash: string) {
    await ApiKeyEntity.delete({ keyHash }).go();
  }
}
