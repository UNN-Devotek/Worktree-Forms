
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RenameMap {
    [oldKey: string]: string; // oldName -> newName
}

export class MigrationService {
    
    /**
     * Compare old and new schemas to detect field renames.
     * Relies on stable Field IDs.
     */
    static detectRenames(oldSchema: any, newSchema: any): RenameMap {
        const renames: RenameMap = {};
        const oldFields = this.flattenFields(oldSchema);
        const newFields = this.flattenFields(newSchema);

        for (const [id, oldField] of Object.entries(oldFields)) {
            const newField = newFields[id];
            
            // If field exists in both, has same ID, but DIFFERENT name
            if (newField && oldField.name !== newField.name) {
                console.log(`[Migration] Detected rename: ${oldField.name} -> ${newField.name} (ID: ${id})`);
                renames[oldField.name] = newField.name;
            }
        }
        return renames;
    }

    /**
     * Migrate all submissions for a form to use new keys.
     */
    static async migrateSubmissions(formId: number, renames: RenameMap) {
        if (Object.keys(renames).length === 0) return;

        console.log(`[Migration] Migrating submissions for Form ${formId}...`);
        
        // chunk this if volume is high, but for now fetch all
        const submissions = await prisma.submission.findMany({
            where: { form_id: formId }
        });

        let count = 0;
        for (const sub of submissions) {
            let data = sub.data as Record<string, any>;
            let changed = false;

            for (const [oldKey, newKey] of Object.entries(renames)) {
                if (data.hasOwnProperty(oldKey)) {
                    data[newKey] = data[oldKey]; // Copy value to new key
                    delete data[oldKey];         // Remove old key
                    changed = true;
                }
            }

            if (changed) {
                await prisma.submission.update({
                    where: { id: sub.id },
                    data: { data }
                });
                count++;
            }
        }
        console.log(`[Migration] Updated ${count} submissions.`);
    }

    /**
     * Helper to map ID -> Field
     */
    private static flattenFields(schema: any): Record<string, { id: string, name: string }> {
        const map: Record<string, any> = {};
        if (!schema || !schema.pages) return map;

        for (const page of schema.pages) {
            for (const section of page.sections) {
                for (const field of section.fields) {
                    if (field.id && field.name) {
                        map[field.id] = field;
                    }
                    // Handle recursive fields (Smart Table) if needed
                    if (field.columns) {
                        for (const col of field.columns) {
                            if (col.id && col.name) map[col.id] = col;
                        }
                    }
                }
            }
        }
        return map;
    }
}
