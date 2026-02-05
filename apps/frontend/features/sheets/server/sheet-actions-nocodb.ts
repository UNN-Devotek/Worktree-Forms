'use server';

import { db } from '@/lib/database';
import { nocoDBService, NocoDBSheetCell } from '@/lib/nocodb.service';
import { revalidatePath } from 'next/cache';

/**
 * Hybrid approach:
 * - Sheet metadata (id, title, project link) stays in Prisma/PostgreSQL
 * - Actual cell data (values, images, files) goes to NocoDB
 */

// Create a new sheet
export async function createSheet(projectId: string, title?: string) {
  console.log('[createSheet] Starting - projectId:', projectId, 'title:', title);
  let sheet = null;
  let nocoTableId = null;

  try {
    console.log('[createSheet] Step 1: Creating Prisma sheet record...');
    // 1. Create sheet metadata in Prisma
    sheet = await db.sheet.create({
      data: {
        projectId,
        title: title || 'Untitled Sheet',
      },
    });
    console.log('[createSheet] Step 1 SUCCESS - Sheet ID:', sheet.id);

    console.log('[createSheet] Step 2: Creating NocoDB table...');
    // 2. Create corresponding native table in NocoDB
    // We create a table with default spreadsheet columns (A, B, C, D, E)
    const columns = [
      { column_name: 'A', title: 'A', uidt: 'LongText' },
      { column_name: 'B', title: 'B', uidt: 'LongText' },
      { column_name: 'C', title: 'C', uidt: 'LongText' },
      { column_name: 'D', title: 'D', uidt: 'LongText' },
      { column_name: 'E', title: 'E', uidt: 'LongText' },
    ];

    const nocoTitle = `${sheet.title} [${sheet.id.substring(sheet.id.length - 4)}]`;
    console.log('[createSheet] Creating NocoDB table with title:', nocoTitle);
    const nocoTable = await nocoDBService.createTable(nocoTitle, columns, sheet.id);
    nocoTableId = nocoTable.id;
    console.log('[createSheet] Step 2 SUCCESS - NocoDB Table ID:', nocoTableId);

    console.log('[createSheet] Step 3: Getting views for table...');
    // 3. Get views for this table and share the default one
    const views = await nocoDBService.getViews(nocoTable.id);
    console.log('[createSheet] Found', views.length, 'views');
    if (!views || views.length === 0) {
      throw new Error('No views found for the new NocoDB table');
    }

    console.log('[createSheet] Step 4: Sharing view...');
    const shareId = await nocoDBService.shareView(views[0].id);
    console.log('[createSheet] Step 4 SUCCESS - Share ID:', shareId);

    console.log('[createSheet] Step 5: Updating Prisma with NocoDB IDs...');
    // 4. Update Prisma with NocoDB IDs
    await db.sheet.update({
      where: { id: sheet.id },
      data: {
        nocodbTableId: nocoTable.id,
        nocodbViewId: shareId
      }
    });
    console.log('[createSheet] Step 5 SUCCESS');

    revalidatePath(`/project/[slug]/sheets`);
    console.log('[createSheet] COMPLETE - Returning sheet');
    return sheet;
  } catch (error) {
    console.error('Failed to create sheet:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    if ((error as any).response) {
      console.error('NocoDB API Error:', JSON.stringify((error as any).response.data, null, 2));
    }
    
    // Rollback logic
    if (sheet) {
        try {
            await db.sheet.delete({ where: { id: sheet.id } });
            console.log('Rolled back Prisma sheet creation');
        } catch (re) { console.error('Prisma rollback failed', re); }
    }
    
    // NocoDB doesn't have an easy "delete table by ID" exposed in our service yet, 
    // but we should eventually add it for full cleanup.
    
    return null;
  }
}

// Get all sheets for a project
export async function getSheets(projectSlug: string) {
  try {
    const project = await db.project.findUnique({
      where: { slug: projectSlug },
      select: { id: true },
    });

    if (!project) return [];

    // Get sheets from Prisma (metadata)
    const sheets = await db.sheet.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' },
    });

    return sheets;
  } catch (error) {
    console.error('Failed to get sheets:', error);
    return [];
  }
}

// Get single sheet with cell data from NocoDB
export async function getSheet(sheetId: string) {
  try {
    // Get sheet metadata from Prisma
    const sheet = await db.sheet.findUnique({
      where: { id: sheetId },
    });

    if (!sheet) return null;

    // Get cell data from NocoDB
    const slug = `sheet-${sheetId}`;
    const nocoSheet = await nocoDBService.getSheetBySlug(slug);

    if (!nocoSheet || !nocoSheet.id) {
        // If NocoDB record is missing, it's a sync issue.
        // We return empty cells instead of blocking access, to allow user to view/delete it.
        return { ...sheet, cells: [] };
    }

    const cells = await nocoDBService.getCellsBySheet(String(nocoSheet.id));

    return {
      ...sheet,
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
    // Update Prisma
    await db.sheet.update({
      where: { id: sheetId },
      data: { title },
    });

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
export async function saveSheetData(sheetId: string, cellData: any[]) {
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
      row: cell.row || 0,
      col: cell.col || 0,
      value: cell.value || '',
      type: cell.type || 'text',
      images: cell.images,
      files: cell.files,
      formula: cell.formula,
      style: cell.style ? JSON.stringify(cell.style) : undefined,
    }));

    // Replace all cells for this sheet
    await nocoDBService.replaceCells(String(nocoSheet.id), cells);

    // Update the updatedAt timestamp in Prisma
    await db.sheet.update({
      where: { id: sheetId },
      data: { updatedAt: new Date() },
    });

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

    // Delete from Prisma
    await db.sheet.delete({
      where: { id: sheetId },
    });

    revalidatePath(`/project/[slug]/sheets`);
    return true;
  } catch (error) {
    console.error('Failed to delete sheet:', error);
    return false;
  }
}

/**
 * Legacy compatibility functions
 * These maintain the old API for gradual migration
 */

// Save sheet content (snapshot) - legacy
export async function saveSheet(sheetId: string, content: number[]) {
  try {
    // Convert buffer to JSON if needed
    const buffer = Buffer.from(content);
    const jsonData = JSON.parse(buffer.toString('utf-8'));

    // Use the new saveSheetData function
    return await saveSheetData(sheetId, jsonData);
  } catch (error) {
    console.error('Failed to save sheet:', error);
    return false;
  }
}
