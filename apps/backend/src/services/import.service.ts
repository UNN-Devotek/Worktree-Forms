
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BulkImportService {
  /**
   * Bulk imports data into a form submission table.
   * @param formId ID of the form target
   * @param data Array of row objects (key-value pairs)
   */
  async importSubmissions(formId: number, data: Record<string, any>[]): Promise<{ count: number }> {
    // 1. Validate Form Exists
    const form = await prisma.form.findUnique({
      where: { id: formId }
    });

    if (!form) {
      throw new Error('Form not found');
    }

    // 2. Prepare Data for Insert
    // We strictly map the incoming keys to the `data` JSON field.
    // Validation against schema could happen here, keeping it simple for now (accept all keys).
    const submissions = data.map(row => ({
      form_id: formId,
      data: row,
      status: 'pending', // Default status for bulk import
      // No userId linked for generic bulk import? Or link to admin performing import?
      // Leaving user relations null request context unavailable here cleanly, 
      // typically we'd pass userId. For now, anonymous import.
    }));

    // 3. Bulk Insert
    // prisma.submission.createMany is supported in generic SQL providers (Postgres/MySQL)
    const result = await prisma.submission.createMany({
      data: submissions,
      skipDuplicates: false, 
    });

    return { count: result.count };
  }
}
