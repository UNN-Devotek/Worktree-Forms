import { PublicTokenEntity } from '../lib/dynamo/index.js';
import { randomBytes } from 'crypto';

export class ShareService {
  /**
   * Generate a secure token string (24 random hex characters)
   */
  static generateTokenString(): string {
    return randomBytes(12).toString('hex');
  }

  static async createPublicLink(
    userId: string,
    projectId: string,
    resourceType: 'FORM' | 'SPEC' | 'BLUEPRINT' | 'SHEET',
    resourceId: string,
    expiresInDays: number | null = null,
  ) {
    const token = this.generateTokenString();

    let expiresAt: string | undefined;
    if (expiresInDays) {
      const d = new Date();
      d.setDate(d.getDate() + expiresInDays);
      expiresAt = d.toISOString();
    }

    const result = await PublicTokenEntity.create({
      token,
      projectId,
      entityType: resourceType,
      entityId: resourceId,
      createdBy: userId,
      expiresAt,
    }).go();

    return result.data;
  }

  static async validateToken(token: string) {
    const result = await PublicTokenEntity.get({ token }).go();
    const record = result.data;

    if (!record) return null;

    if (record.expiresAt && new Date() > new Date(record.expiresAt)) {
      return null;
    }

    return record;
  }

  static async revokeToken(token: string) {
    await PublicTokenEntity.delete({ token }).go();
  }

  static async getTokensForResource(projectId: string) {
    const result = await PublicTokenEntity.query.byProject({ projectId }).go();
    return result.data;
  }
}
