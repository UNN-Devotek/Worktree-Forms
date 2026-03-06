'use server';

import { ProjectEntity, ProjectMemberEntity, SheetEntity, UserEntity } from '@/lib/dynamo';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
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
      sheetId,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Create a new sheet with optional title and visibility config
export async function createSheet(
  projectSlugOrId: string,
  title?: string,
  _visibilityConfig?: { type: 'all' | 'selected'; memberIds?: string[] }
) {
  try {
    // Resolve project: try slug first, then treat as ID
    let projectId = projectSlugOrId;
    let projectSlug = projectSlugOrId;

    const bySlug = await ProjectEntity.query.bySlug({ slug: projectSlugOrId }).go();
    if (bySlug.data[0]) {
      projectId = bySlug.data[0].projectId;
      projectSlug = bySlug.data[0].slug;
    } else {
      const byId = await ProjectEntity.query.primary({ projectId: projectSlugOrId }).go();
      if (!byId.data[0]) throw new Error('Project not found');
      projectId = byId.data[0].projectId;
      projectSlug = byId.data[0].slug;
    }

    const sheetId = nanoid();

    // Initialize empty Yjs document
    const yjsDoc = new Y.Doc();
    const cellsMap = yjsDoc.getMap('cells');
    const rowsMap = yjsDoc.getMap('rows');
    const orderArray = yjsDoc.getArray('order');
    const columnsArray = yjsDoc.getArray('columns');

    const defaultColumns = [
      { id: 'title', label: 'Task Name', type: 'TEXT' },
      { id: 'status', label: 'Status', type: 'STATUS' },
      { id: 'assignee', label: 'Assignee', type: 'CONTACT' },
      { id: 'due_date', label: 'Due Date', type: 'DATE' },
      { id: 'priority', label: 'Priority', type: 'TEXT' },
    ];

    defaultColumns.forEach((col) => {
      columnsArray.push([col]);
    });

    const defaultRows = [
      { id: 'row-1', title: 'Plan project kickoff', status: 'Planned', assignee: '', due_date: '', priority: 'High' },
      { id: 'row-2', title: 'Research requirements', status: 'In Progress', assignee: '', due_date: '', priority: 'Medium' },
      { id: 'row-3', title: 'Design mockups', status: 'Planned', assignee: '', due_date: '', priority: 'Medium' },
      { id: 'row-4', title: 'Develop features', status: 'Planned', assignee: '', due_date: '', priority: 'High' },
      { id: 'row-5', title: 'Test and deploy', status: 'Planned', assignee: '', due_date: '', priority: 'Low' },
    ];

    defaultRows.forEach((row) => {
      rowsMap.set(row.id, row);
      orderArray.push([row.id]);
      defaultColumns.forEach((col) => {
        const cellKey = `${row.id}:${col.id}`;
        cellsMap.set(cellKey, {
          value: row[col.id as keyof typeof row],
          type: col.type,
        });
      });
    });

    const now = new Date().toISOString();

    await SheetEntity.create({
      sheetId,
      projectId,
      name: title || 'Untitled Table',
      createdAt: now,
      updatedAt: now,
    }).go();

    revalidatePath(`/project/${projectSlug}/sheets`);
    return { id: sheetId, sheetId, title: title || 'Untitled Table', projectId, createdAt: now, updatedAt: now };
  } catch (error) {
    console.error('Failed to create sheet:', error);
    return null;
  }
}

// Get all sheets for a project (by slug)
export async function getSheets(projectSlug: string) {
  console.log('[getSheets] Called with slug:', projectSlug);
  try {
    const projectResult = await ProjectEntity.query.bySlug({ slug: projectSlug }).go();
    const project = projectResult.data[0];
    console.log('[getSheets] Found project:', project ? project.projectId : null);

    if (!project) return [];

    const sheetsResult = await SheetEntity.query.byProject({ projectId: project.projectId }).go();
    console.log('[getSheets] Found sheets:', sheetsResult.data.length);

    return sheetsResult.data.map((s) => ({
      id: s.sheetId,
      sheetId: s.sheetId,
      title: s.name,
      projectId: s.projectId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      ownerId: s.createdBy ?? null,
      owner: null,
      visibilityConfig: null,
    }));
  } catch (error) {
    console.error('Failed to get sheets:', error);
    return [];
  }
}

// Get single sheet
export async function getSheet(sheetId: string) {
  try {
    // We need projectId to query, but we only have sheetId.
    // Use scan with filter as fallback (not ideal for production scale).
    const result = await SheetEntity.scan.where(
      ({ sheetId: sid }, { eq }) => eq(sid, sheetId)
    ).go();

    const sheet = result.data[0];
    if (!sheet) return null;

    return {
      id: sheet.sheetId,
      sheetId: sheet.sheetId,
      title: sheet.name,
      projectId: sheet.projectId,
      createdAt: sheet.createdAt,
      updatedAt: sheet.updatedAt,
      visibilityConfig: null,
    };
  } catch (error) {
    console.error('Failed to get sheet:', error);
    return null;
  }
}

// Save sheet content (snapshot) - content stored externally (S3 or Yjs server)
// DynamoDB SheetEntity doesn't store binary content; this is a no-op stub.
export async function saveSheet(sheetId: string, _content: number[]) {
  try {
    // Update the updatedAt timestamp
    const sheet = await getSheet(sheetId);
    if (!sheet) return false;

    await SheetEntity.patch({ projectId: sheet.projectId, sheetId })
      .set({ updatedAt: new Date().toISOString() })
      .go();
    return true;
  } catch (error) {
    console.error('Failed to save sheet:', error);
    return false;
  }
}

// Get project members for ownership transfer picker
export async function getProjectMembers(projectSlug: string) {
  try {
    const projectResult = await ProjectEntity.query.bySlug({ slug: projectSlug }).go();
    const project = projectResult.data[0];
    if (!project) return [];

    const membersResult = await ProjectMemberEntity.query.primary({ projectId: project.projectId }).go();

    // Fetch user details in parallel
    const userResults = await Promise.all(
      membersResult.data.map((m) => UserEntity.query.primary({ userId: m.userId }).go())
    );

    return userResults
      .map((r) => r.data[0])
      .filter(Boolean)
      .map((u) => ({
        id: u.userId,
        name: u.name ?? null,
        email: u.email,
        image: u.avatarKey ?? null,
      }));
  } catch (error) {
    console.error('Failed to get project members:', error);
    return [];
  }
}

// Transfer sheet ownership to another user
export async function transferSheetOwnership(sheetId: string, newOwnerId: string) {
  try {
    const sheet = await getSheet(sheetId);
    if (!sheet) return false;

    await SheetEntity.patch({ projectId: sheet.projectId, sheetId })
      .set({ createdBy: newOwnerId, updatedAt: new Date().toISOString() })
      .go();

    revalidatePath(`/project/[slug]/sheets`);
    return true;
  } catch (error) {
    console.error('Failed to transfer sheet ownership:', error);
    return false;
  }
}

// Delete a sheet and all its data
export async function deleteSheet(sheetId: string) {
  try {
    const sheet = await getSheet(sheetId);
    if (!sheet) return false;

    await SheetEntity.delete({ projectId: sheet.projectId, sheetId }).go();

    // Resolve project slug for revalidation
    const projectResult = await ProjectEntity.query.primary({ projectId: sheet.projectId }).go();
    const projectSlug = projectResult.data[0]?.slug;
    if (projectSlug) {
      revalidatePath(`/project/${projectSlug}/sheets`);
    }
    return true;
  } catch (error) {
    console.error('Failed to delete sheet:', error);
    return false;
  }
}

// Rename sheet
export async function renameSheet(sheetId: string, title: string) {
  try {
    const sheet = await getSheet(sheetId);
    if (!sheet) return false;

    await SheetEntity.patch({ projectId: sheet.projectId, sheetId })
      .set({ name: title, updatedAt: new Date().toISOString() })
      .go();

    revalidatePath(`/project/[slug]/sheets`);
    return true;
  } catch (error) {
    console.error('Failed to rename sheet:', error);
    return false;
  }
}

// Save sheet data (JSON from FortuneSheet)
// DynamoDB SheetEntity does not store raw cell data; timestamps only.
export async function saveSheetData(sheetId: string, _jsonData: unknown) {
  try {
    const sheet = await getSheet(sheetId);
    if (!sheet) return false;

    await SheetEntity.patch({ projectId: sheet.projectId, sheetId })
      .set({ updatedAt: new Date().toISOString() })
      .go();

    console.log('Sheet saved successfully:', sheetId);
    revalidatePath('/project/[slug]/sheets/[sheetId]', 'page');
    return true;
  } catch (error) {
    console.error('Failed to save sheet data:', error);
    return false;
  }
}

export async function getFormProjectSlug(formId: string) {
  try {
    // FormEntity requires projectId for primary key lookup.
    // Without projectId we must scan (dev/debug use only).
    const { FormEntity } = await import('@/lib/dynamo');
    const result = await FormEntity.scan.where(
      ({ formId: fid }, { eq }) => eq(fid, formId)
    ).go();

    const form = result.data[0];
    if (!form) return null;

    const projectResult = await ProjectEntity.query.primary({ projectId: form.projectId }).go();
    return projectResult.data[0]?.slug ?? null;
  } catch (error) {
    console.error('Failed to get form project slug:', error);
    return null;
  }
}
