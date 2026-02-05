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

    // Initialize default structure for RnC grid
    const cellsMap = yjsDoc.getMap('cells');
    const columnsArray = yjsDoc.getArray('columns');

    // Create default columns A-Z
    const getColumnLabel = (index: number): string => {
      let label = '';
      let num = index;
      while (num >= 0) {
        label = String.fromCharCode(65 + (num % 26)) + label;
        num = Math.floor(num / 26) - 1;
      }
      return label;
    };

    for (let i = 0; i < 26; i++) {
      columnsArray.push([{
        id: getColumnLabel(i),
        header: getColumnLabel(i),
        width: 120,
        hidden: false,
        locked: false,
      }]);
    }

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
    try {
        const project = await db.project.findUnique({
            where: { slug: projectSlug },
            select: { id: true }
        });

        if (!project) return [];

        const sheets = await db.sheet.findMany({
            where: { projectId: project.id },
            orderBy: { createdAt: 'desc' }
        });

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
       // Path format: /project/[slug]/sheets/[sheetId]
       // Since we don't have the slug here easily, we can invalidate the layout or all sheets pages
       // OR we can pass the path if needed.
       // For now, let's invalidate the generic path structure if Next.js supports it,
       // or just invalidate the specific page if we can construct it.
       // Actually, revalidatePath works on the route pattern.
       revalidatePath('/project/[slug]/sheets/[sheetId]', 'page');
       
       return true;
    } catch (error) {
        console.error('Failed to save sheet data:', error);
        return false;
    }
}
