'use server';

import { db } from '@/lib/database';
import { revalidatePath } from 'next/cache';

import jwt from 'jsonwebtoken';
import { auth } from '@/auth';
import * as Y from 'yjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function getSheetToken(sheetId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return jwt.sign(
    { 
      userId: session.user.id, 
      name: session.user.name,
      sheetId 
    }, 
    JWT_SECRET, 
    { expiresIn: '1h' }
  );
}

// Create a new sheet
export async function createSheet(projectSlugOrId: string, title?: string) {
  try {
    // Check if it's a slug or ID
    let projectId = projectSlugOrId;

    // Simple heuristic: CUIDs are usually shorter than slugs or follow a pattern.
    // Better: check if project exists with this slug.
    const project = await db.project.findFirst({
      where: {
        OR: [
          { id: projectSlugOrId },
          { slug: projectSlugOrId }
        ]
      },
      select: { id: true, slug: true }
    });

    if (!project) throw new Error('Project not found');
    projectId = project.id;

    // Initialize empty Yjs document
    const yjsDoc = new Y.Doc();

    // Initialize default structure
    const cellsMap = yjsDoc.getMap('cells');
    const rowsMap = yjsDoc.getMap('rows');
    const orderArray = yjsDoc.getArray('order');
    const columnsArray = yjsDoc.getArray('columns');

    // Create default columns
    const defaultColumns = [
      { id: 'title', label: 'Task Name', type: 'TEXT' },
      { id: 'status', label: 'Status', type: 'STATUS' },
      { id: 'assignee', label: 'Assignee', type: 'CONTACT' },
      { id: 'due_date', label: 'Due Date', type: 'DATE' },
      { id: 'priority', label: 'Priority', type: 'TEXT' }
    ];

    defaultColumns.forEach(col => {
      columnsArray.push([col]);
    });

    // Create 5 default rows
    const defaultRows = [
      { id: 'row-1', title: 'Plan project kickoff', status: 'Planned', assignee: '', due_date: '', priority: 'High' },
      { id: 'row-2', title: 'Research requirements', status: 'In Progress', assignee: '', due_date: '', priority: 'Medium' },
      { id: 'row-3', title: 'Design mockups', status: 'Planned', assignee: '', due_date: '', priority: 'Medium' },
      { id: 'row-4', title: 'Develop features', status: 'Planned', assignee: '', due_date: '', priority: 'High' },
      { id: 'row-5', title: 'Test and deploy', status: 'Planned', assignee: '', due_date: '', priority: 'Low' }
    ];

    defaultRows.forEach(row => {
      // Add row to rows map
      rowsMap.set(row.id, row);
      // Add to order array
      orderArray.push([row.id]);

      // Add cells for each column
      defaultColumns.forEach(col => {
        const cellKey = `${row.id}:${col.id}`;
        cellsMap.set(cellKey, {
          value: row[col.id as keyof typeof row],
          type: col.type
        });
      });
    });

    // Encode Yjs doc as binary
    const yjsState = Y.encodeStateAsUpdate(yjsDoc);
    const content = Buffer.from(yjsState);

    const sheet = await db.sheet.create({
      data: {
        projectId,
        title: title || 'Untitled Sheet',
        content,
      },
    });

    revalidatePath(`/project/${project.slug}/sheets`);
    return sheet;
  } catch (error) {
    console.error('Failed to create sheet:', error);
    return null;
  }
}

// Get all sheets for a project (by slug or id?)
// The UI has slug, need to resolve to ID or use relation.
// Wait, listing page has params.slug.
// Need to find project by slug first or assume projectId is passed.
// Better to resolve project id from slug if needed, or pass project ID if available.
// Let's lookup project by slug first to be safe, or just accept projectId.
export async function getSheets(projectSlug: string) {
    console.log('[getSheets] Called with slug:', projectSlug);
    try {
        const project = await db.project.findUnique({
            where: { slug: projectSlug },
            select: { id: true }
        });
        console.log('[getSheets] Found project:', project);

        if (!project) return [];

        const sheets = await db.sheet.findMany({
            where: { projectId: project.id },
            orderBy: { createdAt: 'desc' }
        });
        console.log('[getSheets] Found sheets:', sheets.length);

        return sheets;
    } catch (error) {
        console.error('Failed to get sheets:', error);
        return [];
    }
}

// Get single sheet
export async function getSheet(sheetId: string) {
    try {
        const sheet = await db.sheet.findUnique({
            where: { id: sheetId }
        });
        
        // Convert Bytes to base64 string for client safety if needed, 
        // or let Server Components handle Buffer serialization (Next.js handles Buffer/UInt8Array usually).
        // However, passing Buffer to Client Component might need serialization.
        // Let's return as is and see.
        return sheet;
    } catch (error) {
        console.error('Failed to get sheet:', error);
        return null;
    }
}

// Save sheet content (snapshot)
export async function saveSheet(sheetId: string, content: number[]) {
    try {
       // content is array of numbers (Uint8Array converted)
       const buffer = Buffer.from(content);
       
       await db.sheet.update({
           where: { id: sheetId },
           data: {
               content: buffer,
               updatedAt: new Date()
           }
       });
       return true;
    } catch (error) {
        console.error('Failed to save sheet:', error);
        return false;
    }
}

// Rename sheet
export async function renameSheet(sheetId: string, title: string) {
    try {
        await db.sheet.update({
            where: { id: sheetId },
            data: { title }
        });
        revalidatePath(`/project/[slug]/sheets`);
        return true;
    } catch (error) {
        console.error('Failed to rename sheet:', error);
        return false;
    }
}

// Save sheet data (JSON from FortuneSheet)
export async function saveSheetData(sheetId: string, jsonData: any) {
    try {
       // Convert JSON to buffer
       const buffer = Buffer.from(JSON.stringify(jsonData), 'utf-8');
       
       await db.sheet.update({
           where: { id: sheetId },
           data: {
               content: buffer,
               updatedAt: new Date()
           }
       });
       console.log('Sheet saved successfully:', sheetId);
       
       // Revalidate the sheet page to show new data on reload
       revalidatePath('/project/[slug]/sheets/[sheetId]', 'page');
       
       return true;
    } catch (error) {
        console.error('Failed to save sheet data:', error);
        return false;
    }
}

export async function getFormProjectSlug(formId: number) {
    try {
        const form = await db.form.findUnique({
            where: { id: formId },
            include: { project: true }
        });

        if (!form || !form.project) return null;
        return form.project.slug;
    } catch (error) {
        console.error('Failed to get form project slug:', error);
        return null;
    }
}
