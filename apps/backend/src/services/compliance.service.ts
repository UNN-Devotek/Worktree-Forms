
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ComplianceService {
  /**
   * Submit insurance document and update status
   */
  static async submitInsurance(userId: string, insuranceUrl: string) {
    console.log(`[Compliance] User ${userId} submitted insurance: ${insuranceUrl}`);
    
    return await prisma.user.update({
      where: { id: userId },
      data: { 
        insuranceUrl,
        complianceStatus: 'VERIFIED' // Auto-verify for MVP
      }
    });
  }

  /**
   * Get user compliance status
   */
  static async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { complianceStatus: true, insuranceUrl: true }
    });
    return user;
  }
}
