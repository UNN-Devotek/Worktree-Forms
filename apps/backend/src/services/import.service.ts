import { FormEntity, SubmissionEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

export class BulkImportService {
  /**
   * Bulk imports data into a form submission table.
   * @param formId ID of the form target
   * @param projectId Project context
   * @param data Array of row objects (key-value pairs)
   */
  async importSubmissions(formId: string, projectId: string, data: Record<string, unknown>[]): Promise<{ count: number }> {
    // 1. Validate Form Exists
    const formResult = await FormEntity.get({ projectId, formId }).go();
    if (!formResult.data) {
      throw new Error('Form not found');
    }

    // 2. Bulk Insert submissions
    let count = 0;
    for (const row of data) {
      await SubmissionEntity.create({
        submissionId: nanoid(),
        formId,
        projectId,
        data: row,
        status: 'PENDING',
      }).go();
      count++;
    }

    return { count };
  }
}
