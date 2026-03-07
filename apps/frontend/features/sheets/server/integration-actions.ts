'use server';

/**
 * Story 6-10: Form → Sheet Integration
 * Story 6-11: Sheet → Route Integration
 *
 * These actions bridge the form submission and route-stop domains with
 * the Smart Grid (SheetRow) domain.
 */

import {
  SubmissionEntity,
  SheetRowEntity,
  RouteStopEntity,
  ProjectMemberEntity,
} from '@/lib/dynamo';
import { auth } from '@/auth';
import { nanoid } from 'nanoid';

// ---------------------------------------------------------------------------
// Internal auth helper
// ---------------------------------------------------------------------------

async function verifyProjectAccess(projectId: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const result = await ProjectMemberEntity.query.primary({ projectId, userId: session.user.id }).go();
  if (!result.data.length) throw new Error('Forbidden');
  return session.user.id;
}

// ---------------------------------------------------------------------------
// Story 6-10: Import form submissions into a sheet
// ---------------------------------------------------------------------------

export interface ImportResult {
  imported: number;
  skipped: number;
}

/**
 * Queries all submissions for a form and creates a SheetRow for each one.
 * The submission's `data` map is stored verbatim as the row's `data` field.
 * Rows are idempotent by storing submissionId in data._submissionId so
 * subsequent imports skip already-present rows.
 *
 * @param projectId  - Project that owns both the form and the target sheet.
 * @param formId     - Source form.
 * @param sheetId    - Destination sheet.
 */
export async function importFormSubmissionsToSheet(
  projectId: string,
  formId: string,
  sheetId: string
): Promise<ImportResult> {
  try {
    const userId = await verifyProjectAccess(projectId);

    // Fetch all submissions for this form (byForm GSI on SubmissionEntity).
    const submissionsResult = await SubmissionEntity.query.byForm({ formId }).go();
    const submissions = submissionsResult.data.filter((s) => s.projectId === projectId);

    // Fetch existing rows to detect already-imported submissions.
    const existingRowsResult = await SheetRowEntity.query.bySheet({ sheetId }).go();
    const importedIds = new Set(
      existingRowsResult.data
        .map((r) => (r.data as Record<string, unknown>)?._submissionId as string | undefined)
        .filter(Boolean)
    );

    let imported = 0;
    let skipped = 0;
    const now = new Date().toISOString();

    for (const sub of submissions) {
      if (importedIds.has(sub.submissionId)) {
        skipped++;
        continue;
      }

      await SheetRowEntity.create({
        rowId: nanoid(),
        sheetId,
        projectId,
        data: {
          ...(sub.data as Record<string, unknown>),
          _submissionId: sub.submissionId,
          _formId: formId,
          _importedAt: now,
          _submittedBy: sub.submittedBy ?? '',
        },
        status: sub.status,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      }).go();

      imported++;
    }

    return { imported, skipped };
  } catch (error) {
    console.error('Failed to import form submissions to sheet:', error);
    return { imported: 0, skipped: 0 };
  }
}

// ---------------------------------------------------------------------------
// Story 6-11: Export sheet rows to a route as stops
// ---------------------------------------------------------------------------

export interface ExportResult {
  exported: number;
  skipped: number;
}

/**
 * Creates a RouteStop for each SheetRow in the given sheet, appended to the
 * specified route. The row's `data` map is expected to contain `name`,
 * `address`, `latitude`, `longitude`, and optionally `formId`.
 *
 * Rows that have already been exported (data._routeStopId is set) are skipped.
 *
 * @param projectId - Project that owns both the sheet and the route.
 * @param sheetId   - Source sheet.
 * @param routeId   - Destination route.
 */
export async function exportSheetRowsToRoute(
  projectId: string,
  sheetId: string,
  routeId: string
): Promise<ExportResult> {
  try {
    const userId = await verifyProjectAccess(projectId);

    const rowsResult = await SheetRowEntity.query.bySheet({ sheetId }).go();
    // Exclude view-config sentinel rows (order = -1).
    const rows = rowsResult.data.filter((r) => r.order !== -1 && r.projectId === projectId);

    let exported = 0;
    let skipped = 0;
    const now = new Date().toISOString();

    for (const row of rows) {
      const d = row.data as Record<string, unknown>;

      // Skip rows already exported to this route.
      if (d._routeStopId) {
        skipped++;
        continue;
      }

      const stopId = nanoid();
      await RouteStopEntity.create({
        stopId,
        routeId,
        projectId,
        name: (d.name as string) || (d.title as string) || `Row ${row.rowId}`,
        address: (d.address as string) || '',
        latitude: typeof d.latitude === 'number' ? d.latitude : undefined,
        longitude: typeof d.longitude === 'number' ? d.longitude : undefined,
        order: exported,
        formId: (d.formId as string) || undefined,
        status: 'PENDING',
        createdAt: now,
      }).go();

      // Back-patch the row to record the export.
      await SheetRowEntity.patch({ sheetId, rowId: row.rowId })
        .set({
          data: { ...d, _routeStopId: stopId, _routeId: routeId, _exportedAt: now, _exportedBy: userId },
          updatedAt: now,
        })
        .go();

      exported++;
    }

    return { exported, skipped };
  } catch (error) {
    console.error('Failed to export sheet rows to route:', error);
    return { exported: 0, skipped: 0 };
  }
}
