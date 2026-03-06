import { SubmissionEntity } from '../lib/dynamo/index.js';

interface RenameMap {
  [oldKey: string]: string;
}

export class MigrationService {
  /**
   * Compare old and new schemas to detect field renames.
   * Relies on stable Field IDs.
   */
  static detectRenames(oldSchema: unknown, newSchema: unknown): RenameMap {
    const renames: RenameMap = {};
    const oldFields = this.flattenFields(oldSchema);
    const newFields = this.flattenFields(newSchema);

    for (const [id, oldField] of Object.entries(oldFields)) {
      const newField = newFields[id];
      if (newField && oldField.name !== newField.name) {
        renames[oldField.name] = newField.name;
      }
    }
    return renames;
  }

  /**
   * Migrate all submissions for a form to use new keys.
   */
  static async migrateSubmissions(formId: string, projectId: string, renames: RenameMap) {
    if (Object.keys(renames).length === 0) return;


    const result = await SubmissionEntity.query.byForm({ formId }).go();
    const submissions = result.data;

    let count = 0;
    for (const sub of submissions) {
      const data = { ...(sub.data as Record<string, unknown>) };
      let changed = false;

      for (const [oldKey, newKey] of Object.entries(renames)) {
        if (Object.prototype.hasOwnProperty.call(data, oldKey)) {
          data[newKey] = data[oldKey];
          delete data[oldKey];
          changed = true;
        }
      }

      if (changed) {
        await SubmissionEntity.patch({ projectId, submissionId: sub.submissionId })
          .set({ data, updatedAt: new Date().toISOString() })
          .go();
        count++;
      }
    }
  }

  /**
   * Helper to map ID -> Field
   */
  private static flattenFields(schema: unknown): Record<string, { id: string; name: string }> {
    const map: Record<string, { id: string; name: string }> = {};
    if (!schema || typeof schema !== 'object') return map;
    const s = schema as {
      pages?: Array<{
        sections?: Array<{
          fields?: Array<{
            id?: string;
            name?: string;
            columns?: Array<{ id?: string; name?: string }>;
          }>;
        }>;
      }>;
    };
    if (!s.pages) return map;

    for (const page of s.pages) {
      for (const section of page.sections ?? []) {
        for (const field of section.fields ?? []) {
          if (field.id && field.name) map[field.id] = field as { id: string; name: string };
          for (const col of field.columns ?? []) {
            if (col.id && col.name) map[col.id] = col as { id: string; name: string };
          }
        }
      }
    }
    return map;
  }
}
