
import { prisma } from '../db';
import crypto from 'crypto';

export class ApiKeyService {
  /**
   * Generates a new API Key.
   * Returns the RAW key (to be shown once) and the created DB record.
   */
  static async generateKey(userId: string, note?: string, scope: string = 'read-only') {
    console.log(`🔑 Generating API Key for userId: ${userId}, note: ${note}, scope: ${scope}`);
    
    // 1. Generate Random Key (sk_...)
    const rawKey = `sk_${crypto.randomBytes(24).toString('hex')}`;
    
    // 2. Hash the key for storage (SHA256 for speed/security balance)
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    console.log(`🔑 Generated keyHash: ${keyHash.substring(0, 16)}...`);

    // 3. Store in DB
    try {
      const apiKey = await prisma.apiKey.create({
        data: {
          userId,
          keyHash,
          note,
          scope,
          // expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Optional: 30 days default
        }
      });

      console.log(`✅ API Key created: ${apiKey.id}`);
      return { rawKey, apiKey };
    } catch (error) {
      console.error('❌ Prisma Create Error:', error);
      throw error;
    }
  }

  /**
   * Validates an API Key.
   * Steps: Hash input -> Find Record -> Check Expiry -> Update LastUsed.
   */
  static async validateKey(rawKey: string) {
    if (!rawKey.startsWith('sk_')) return null;

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true } // Include user context
    });

    if (!apiKey) return null;

    // Check Expiry
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    // Async Update LastUsed (Fire & Forget to not block)
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    }).catch(console.error);

    return apiKey;
  }

  /**
   * List keys for a user.
   */
  static async listKeys(userId: string) {
    return prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Revoke (Delete) a key.
   */
  static async revokeKey(keyId: string, userId: string) {
    return prisma.apiKey.deleteMany({
      where: { id: keyId, userId } // Ensure ownership
    });
  }
}
