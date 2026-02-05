
import { prisma } from '../db.js';
import { randomBytes } from 'crypto';

export class ShareService {
  /**
   * Generate a secure, recognizable-enough token
   * We'll use 24 random hex characters
   */
  static generateTokenString(): string {
    return randomBytes(12).toString('hex');
  }

  static async createPublicLink(userId: string, resourceType: 'FORM' | 'SPEC' | 'BLUEPRINT', resourceId: string, expiresInDays: number | null = null) {
    const token = this.generateTokenString();
    
    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    try {
      if (!prisma.publicToken) {
          console.error("Prisma Models available:", Object.keys(prisma).filter(k => !k.startsWith('_')));
          throw new Error("prisma.publicToken is undefined");
      }
      return await prisma.publicToken.create({
        data: {
          token,
          resourceType,
          resourceId,
          createdBy: userId,
          expiresAt
        }
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  static async validateToken(token: string) {
    const record = await prisma.publicToken.findUnique({
      where: { token }
    });

    if (!record) return null;

    if (record.expiresAt && new Date() > record.expiresAt) {
      // Token expired
      return null; 
    }

    return record;
  }

  static async revokeToken(tokenId: string) {
     return await prisma.publicToken.delete({ where: { id: tokenId } });
  }

  static async getTokensForResource(resourceId: string) {
      return await prisma.publicToken.findMany({
          where: { resourceId },
          orderBy: { createdAt: 'desc' }
      });
  }
}
