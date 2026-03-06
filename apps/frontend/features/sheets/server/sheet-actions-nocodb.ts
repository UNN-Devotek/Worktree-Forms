'use server';

import { ProjectEntity, SheetEntity } from '@/lib/dynamo';
import { nocoDBService, NocoDBSheetCell } from '@/lib/nocodb.service';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';

/**
 * Hybrid approach:
 * - Sheet metadata (id, title, project link) in DynamoDB via ElectroDB
 * - Actual cell data (values, images, files) goes to NocoDB
 */

// Create a new sheet
export async function createSheet(projectId: string, title?: string) {
  console.log('[createSheet] Starting - projectId:', projectId, 'title:', title);
  let sheetId: string | null = null;

  try {
    sheetId = nanoid();
    const now = new Date().toISOString();

    console.log('[createSheet] Step 1: Creating DynamoDB sheet record...');
    await SheetEntity.create({
      sheetId,
      projectId,
      name: title || 'Untitled Sheet',
      createdAt: now,
      updatedAt: now,
    }).go();
    console.log('[createSheet] Step 1 SUCCESS - Sheet ID:', sheetId);

    console.log('[createSheet] Step 2: Creating NocoDB table...');
    const columns = [
      { column_name: 'A', title: 'A', uidt: 'LongText' },
      { column_name: 'B', title: 'B', uidt: 'LongText' },
      { column_name: 'C', title: 'C', uidt: 'LongText' },
      { column_name: 'D', title: 'D', uidt: 'LongText' },
      { column_name: 'E', title: 'E', uidt: 'LongText' },
    ];

    const sheetTitle = title || 'Untitled Sheet';
    const nocoTitle = `${sheetTitle} [${sheetId.substring(sheetId.length - 4)}]`;
    console.log('[createSheet] Creating NocoDB table with title:', nocoTitle);
    const nocoTable = await nocoDBService.createTable(nocoTitle, columns, sheetId);
    console.log('[createSheet] Step 2 SUCCESS - NocoDB Table ID:', nocoTable.id);

    console.log('[createSheet] Step 3: Getting views for table...');
    const views = await nocoDBService.getViews(nocoTable.id);
    console.log('[createSheet] Found', views.length, 'views');
    if (!views || views.length === 0) {
      throw new Error('No views found for the new NocoDB table');
    }

    console.log('[createSheet] Step 4: Sharing view...');
    const shareId = await nocoDBService.shareView(views[0].id);
    console.log('[createSheet] Step 4 SUCCESS - Share ID:', shareId);

    // NocoDB IDs are not stored on SheetEntity (no nocodbTableId/nocodbViewId attributes).
    // If needed, store them in the description or a separate entity.

    revalidatePath(`/project/[slug]/sheets`);
    console.log('[createSheet] COMPLETE - Returning sheet');
    return { id: sheetId, sheetId, title: sheetTitle, projectId, createdAt: now, updatedAt: now };
  } catch (error) {
    console.error('Failed to create sheet:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Rollback: delete the DynamoDB sheet record
    if (sheetId) {
      try {
        await SheetEntity.delete({ projectId, sheetId }).go();
        console.log('Rolled back DynamoDB sheet creation');
      } catch (re) {
        console.error('DynamoDB rollback failed', re);
      }
    }

    return null;
  }
}

// Get all sheets for a project
export async function getSheets(projectSlug: string) {
  try {
    const projectResult = await ProjectEntity.query.bySlug({ slug: projectSlug }).go();
    const project = projectResult.data[0];
    if (!project) return [];

    const sheetsResult = await SheetEntity.query.byProject({ projectId: project.projectId }).go();

    return sheetsResult.data.map((s) => ({
      id: s.sheetId,
      sheetId: s.sheetId,
      title: s.name,
      projectId: s.projectId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      visibilityConfig: null,
    }));
  } catch (error) {
    console.error('Failed to get sheets:', error);
    return [];
  }
}

// Get single sheet with cell data from NocoDB
export async function getSheet(sheetId: string) {
  try {
    // Scan for sheet by sheetId (no projectId available)
    const result = await SheetEntity.scan.where(
      ({ sheetId: sid }, { eq }) => eq(sid, sheetId)
    ).go();

    const sheet = result.data[0];
    if (!sheet) return null;

    // Get cell data from NocoDB
    const slug = `sheet-${sheetId}`;
    const nocoSheet = await nocoDBService.getSheetBySlug(slug);

    if (!nocoSheet || !nocoSheet.id) {
      return { ...sheet, id: sheet.sheetId, title: sheet.name, cells: [] };
    }

    const cells = await nocoDBService.getCellsBySheet(String(nocoSheet.id));

    return {
      ...sheet,
      id: sheet.sheetId,
      title: sheet.name,
      cells,
    };
  } catch (error) {
    console.error('Failed to get sheet:', error);
    return null;
  }
}

// Rename sheet
export async function renameSheet(sheetId: string, title: string) {
  try {
    const sheetResult = await SheetEntity.scan.where(
      ({ sheetId: sid }, { eq }) => eq(sid, sheetId)
    ).go();
    const sheet = sheetResult.data[0];
    if (!sheet) return false;

    await SheetEntity.patch({ projectId: sheet.projectId, sheetId })
      .set({ name: title, updatedAt: new Date().toISOString() })
      .go();

    // Update NocoDB
    const slug = `sheet-${sheetId}`;
    const nocoSheet = await nocoDBService.getSheetBySlug(slug);
    if (nocoSheet && nocoSheet.id) {
      await nocoDBService.updateSheet(nocoSheet.id, { name: title });
    }

    revalidatePath(`/project/[slug]/sheets`);
    return true;
  } catch (error) {
    console.error('Failed to rename sheet:', error);
    return false;
  }
}

// Save sheet data (from AG Grid / collaborative editor)
export async function saveSheetData(sheetId: string, cellData: Array<Record<string, unknown>>) {
  try {
    console.log('[saveSheetData] Saving cells for sheet:', sheetId);

    const slug = `sheet-${sheetId}`;
    const nocoSheet = await nocoDBService.getSheetBySlug(slug);

    if (!nocoSheet || !nocoSheet.id) {
      console.error('[saveSheetData] NocoDB sheet not found for slug:', slug);
      return false;
    }

    // Convert cell data to NocoDB format
    const cells: NocoDBSheetCell[] = cellData.map((cell) => ({
      sheet_id: String(nocoSheet.id),
      row: (cell.row as number) || 0,
      col: (cell.col as number) || 0,
      value: (cell.value as string) || '',
      type: (cell.type as NocoDBSheetCell['type']) || 'text',
      images: cell.images as string[] | undefined,
      files: cell.files as string[] | undefined,
      formula: cell.formula as string | undefined,
      style: cell.style ? JSON.stringify(cell.style) : undefined,
    }));

    // Replace all cells for this sheet
    await nocoDBService.replaceCells(String(nocoSheet.id), cells);

    // Update the updatedAt timestamp in DynamoDB
    const sheetResult = await SheetEntity.scan.where(
      ({ sheetId: sid }, { eq }) => eq(sid, sheetId)
    ).go();
    const sheet = sheetResult.data[0];
    if (sheet) {
      await SheetEntity.patch({ projectId: sheet.projectId, sheetId })
        .set({ updatedAt: new Date().toISOString() })
        .go();
    }

    console.log('[saveSheetData] Sheet saved successfully:', sheetId);
    revalidatePath('/project/[slug]/sheets/[sheetId]', 'page');

    return true;
  } catch (error) {
    console.error('[saveSheetData] Failed to save sheet data:', error);
    return false;
  }
}

// Delete sheet
export async function deleteSheet(sheetId: string) {
  try {
    // Delete from NocoDB
    const slug = `sheet-${sheetId}`;
    const nocoSheet = await nocoDBService.getSheetBySlug(slug);
    if (nocoSheet && nocoSheet.id) {
      await nocoDBService.deleteSheet(nocoSheet.id);
    }

    // Delete from DynamoDB
    const sheetResult = await SheetEntity.scan.where(
      ({ sheetId: sid }, { eq }) => eq(sid, sheetId)
    ).go();
    const sheet = sheetResult.data[0];
    if (sheet) {
      await SheetEntity.delete({ projectId: sheet.projectId, sheetId }).go();
    }

    revalidatePath(`/project/[slug]/sheets`);
    return true;
  } catch (error) {
    console.error('Failed to delete sheet:', error);
    return false;
  }
}

/**
 * Legacy compatibility functions
 */

// Save sheet content (snapshot) - legacy
export async function saveSheet(sheetId: string, content: number[]) {
  try {
    const buffer = Buffer.from(content);
    const jsonData = JSON.parse(buffer.toString('utf-8'));
    return await saveSheetData(sheetId, jsonData);
  } catch (error) {
    console.error('Failed to save sheet:', error);
    return false;
  }
}
