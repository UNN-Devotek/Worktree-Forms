import { ComplianceRecordEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

export class ComplianceService {
  /**
   * Submit a compliance record for a user within a project
   */
  static async submitInsurance(userId: string, projectId: string, insuranceUrl: string) {

    const record = await ComplianceRecordEntity.create({
      recordId: nanoid(),
      projectId,
      userId,
      type: 'INSURANCE',
      status: 'VERIFIED',
      data: { insuranceUrl },
    }).go();

    return record.data;
  }

  /**
   * Get compliance records for a user within a project
   */
  static async getStatus(userId: string, projectId: string) {
    const result = await ComplianceRecordEntity.query.byUser({ userId }).go();
    const records = result.data.filter((r) => r.projectId === projectId);
    return records;
  }
}
