'use server';

import {
  ProjectEntity,
  ProjectMemberEntity,
  SheetEntity,
  SheetColumnEntity,
  SheetRowEntity,
  UserEntity,
} from '@/lib/dynamo';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import { auth } from '@/auth';
import * as Y from 'yjs';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET env var is required');
  return secret;
}

/**
 * Verifies the current user has access to a project.
 * Returns the authenticated userId or throws.
 */
async function verifyProjectAccess(projectId: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const member = await ProjectMemberEntity.query.primary({ projectId, userId: session.user.id }).go();
  if (!member.data.length) throw new Error('Forbidden');
  return session.user.id;
}

/**
 * Issues a signed WebSocket JWT for a specific sheet.
 * Requires `projectId` so the sheet can be verified via direct DynamoDB key lookup
 * (avoids a full table scan that `getSheet` would perform).
 */
export async function getSheetToken(sheetId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Direct primary key lookup — no table scan
  const sheetResult = await SheetEntity.query.primary({ projectId, sheetId }).go();
  if (!sheetResult.data[0]) return null;

  // Verify the caller is a member of this project before issuing a token.
  // This guard lives here (not just in the page) because server actions
  // are callable directly by any authenticated client.
  const member = await ProjectMemberEntity.query
    .primary({ projectId, userId: session.user.id })
    .go();
  if (!member.data.length) return null;

  return jwt.sign(
    {
      sub: session.user.id,
      name: session.user.name,
      sheetId,
    },
    getJwtSecret(),
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

    await verifyProjectAccess(projectId);

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
      ownerId: s.createdBy ?? null,
      owner: null,
      visibilityConfig: null,
    }));
  } catch (error) {
    console.error('Failed to get sheets:', error);
    return [];
  }
}

// Get single sheet (metadata only, used internally)
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

/**
 * Get a sheet with its columns and rows for the grid view.
 * Verifies the caller has project access before returning data.
 */
export async function getSheetWithData(projectId: string, sheetId: string) {
  try {
    await verifyProjectAccess(projectId);

    const [sheetResult, columnsResult, rowsResult] = await Promise.all([
      SheetEntity.query.primary({ projectId, sheetId }).go(),
      SheetColumnEntity.query.primary({ sheetId }).go(),
      SheetRowEntity.query.bySheet({ sheetId }).go(),
    ]);

    const sheet = sheetResult.data[0];
    if (!sheet) return null;

    return {
      sheet: {
        id: sheet.sheetId,
        sheetId: sheet.sheetId,
        title: sheet.name,
        projectId: sheet.projectId,
        createdAt: sheet.createdAt,
        updatedAt: sheet.updatedAt,
      },
      columns: columnsResult.data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      rows: rowsResult.data,
    };
  } catch (error) {
    console.error('Failed to get sheet with data:', error);
    return null;
  }
}

// Save sheet content (snapshot) - content stored externally (S3 or Yjs server)
// DynamoDB SheetEntity doesn't store binary content; this is a no-op stub.
export async function saveSheet(sheetId: string, _content: number[]) {
  try {
    const sheet = await getSheet(sheetId);
    if (!sheet) return false;
    await verifyProjectAccess(sheet.projectId);
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
    await verifyProjectAccess(sheet.projectId);

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
    await verifyProjectAccess(sheet.projectId);

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
    await verifyProjectAccess(sheet.projectId);

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
    await verifyProjectAccess(sheet.projectId);

    await SheetEntity.patch({ projectId: sheet.projectId, sheetId })
      .set({ updatedAt: new Date().toISOString() })
      .go();

    revalidatePath('/project/[slug]/sheets/[sheetId]', 'page');
    return true;
  } catch (error) {
    console.error('Failed to save sheet data:', error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Row CRUD
// ---------------------------------------------------------------------------

/** Create a new row in a sheet. Returns the new rowId. */
export async function createRow(
  sheetId: string,
  projectId: string,
  data?: Record<string, unknown>
): Promise<string | null> {
  try {
    const userId = await verifyProjectAccess(projectId);
    const rowId = nanoid();
    const now = new Date().toISOString();
    await SheetRowEntity.create({
      rowId,
      sheetId,
      projectId,
      data: data ?? {},
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    }).go();
    return rowId;
  } catch (error) {
    console.error('Failed to create row:', error);
    return null;
  }
}

/** Update an existing row's data map. */
export async function updateRow(
  sheetId: string,
  rowId: string,
  projectId: string,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    await verifyProjectAccess(projectId);
    await SheetRowEntity.patch({ sheetId, rowId })
      .set({ data, updatedAt: new Date().toISOString() })
      .go();
    return true;
  } catch (error) {
    console.error('Failed to update row:', error);
    return false;
  }
}

/** Delete a row from a sheet. */
export async function deleteRow(
  sheetId: string,
  rowId: string,
  projectId: string
): Promise<boolean> {
  try {
    await verifyProjectAccess(projectId);
    await SheetRowEntity.delete({ sheetId, rowId }).go();
    return true;
  } catch (error) {
    console.error('Failed to delete row:', error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Column CRUD
// ---------------------------------------------------------------------------

/** Add a new column to a sheet. Returns the new columnId. */
export async function addColumn(
  sheetId: string,
  projectId: string,
  name: string,
  type: string
): Promise<string | null> {
  try {
    await verifyProjectAccess(projectId);
    const columns = await SheetColumnEntity.query.primary({ sheetId }).go();
    const maxOrder = columns.data.reduce((max, col) => Math.max(max, col.order ?? 0), -1);
    const columnId = nanoid();
    await SheetColumnEntity.create({
      columnId,
      sheetId,
      name,
      type,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    }).go();
    return columnId;
  } catch (error) {
    console.error('Failed to add column:', error);
    return null;
  }
}

/** Delete a column from a sheet. */
export async function deleteColumn(
  sheetId: string,
  columnId: string,
  projectId: string
): Promise<boolean> {
  try {
    await verifyProjectAccess(projectId);
    await SheetColumnEntity.delete({ sheetId, columnId }).go();
    return true;
  } catch (error) {
    console.error('Failed to delete column:', error);
    return false;
  }
}

/** Update an existing column's properties (name, type, width, hidden). */
export async function updateColumn(
  projectId: string,
  sheetId: string,
  columnId: string,
  updates: { name?: string; type?: string; width?: number; hidden?: boolean }
): Promise<boolean> {
  try {
    await verifyProjectAccess(projectId);
    await SheetColumnEntity.patch({ sheetId, columnId })
      .set(updates)
      .go();
    return true;
  } catch (error) {
    console.error('Failed to update column:', error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Story 6-3: Row Assignment
// ---------------------------------------------------------------------------

/**
 * Assigns (or unassigns) a user to a row.
 * SheetRowEntity has a first-class `assignedTo` attribute, so we patch it directly.
 */
export async function assignRow(
  projectId: string,
  sheetId: string,
  rowId: string,
  assignedTo: string | null
): Promise<boolean> {
  try {
    await verifyProjectAccess(projectId);
    await SheetRowEntity.patch({ sheetId, rowId })
      .set({ assignedTo: assignedTo ?? undefined, updatedAt: new Date().toISOString() })
      .go();
    return true;
  } catch (error) {
    console.error('Failed to assign row:', error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Story 6-7: Row Hierarchy / Grouping
// ---------------------------------------------------------------------------

/**
 * Sets or clears the parent of a row.
 * SheetRowEntity has a first-class `parentRowId` attribute.
 */
export async function setRowParent(
  projectId: string,
  sheetId: string,
  rowId: string,
  parentRowId: string | null
): Promise<boolean> {
  try {
    await verifyProjectAccess(projectId);
    await SheetRowEntity.patch({ sheetId, rowId })
      .set({ parentRowId: parentRowId ?? undefined, updatedAt: new Date().toISOString() })
      .go();
    return true;
  } catch (error) {
    console.error('Failed to set row parent:', error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Story 6-9: Row Detail
// ---------------------------------------------------------------------------

/**
 * Fetches a single row with its column definitions for the RowDetailPanel.
 */
export async function getRowDetail(
  projectId: string,
  sheetId: string,
  rowId: string
): Promise<{ row: Record<string, unknown>; columns: { columnId: string; name: string; type: string; order: number }[] } | null> {
  try {
    await verifyProjectAccess(projectId);
    const [rowResult, columnsResult] = await Promise.all([
      SheetRowEntity.query.primary({ sheetId, rowId }).go(),
      SheetColumnEntity.query.primary({ sheetId }).go(),
    ]);
    const row = rowResult.data[0];
    if (!row) return null;
    return {
      row: { ...row.data, rowId: row.rowId, assignedTo: row.assignedTo, status: row.status, parentRowId: row.parentRowId },
      columns: columnsResult.data
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((c) => ({ columnId: c.columnId, name: c.name, type: c.type ?? 'text', order: c.order ?? 0 })),
    };
  } catch (error) {
    console.error('Failed to get row detail:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Story 6-12: View Persistence & Privacy
// ---------------------------------------------------------------------------

export interface ViewConfig {
  name: string;
  filters: Record<string, unknown>[];
  sorts: { columnId: string; direction: 'asc' | 'desc' }[];
  groupBy: string | null;
  hiddenColumns: string[];
  isPrivate: boolean;
  ownerId: string;
}

/**
 * Saves a named view configuration as a SheetRow with order = -1 (metadata sentinel).
 * The viewId is stored in the rowId field; sheetId scopes it correctly.
 */
export async function saveView(
  projectId: string,
  sheetId: string,
  viewConfig: Omit<ViewConfig, 'ownerId'>
): Promise<string | null> {
  try {
    const userId = await verifyProjectAccess(projectId);
    const viewId = `view-${nanoid()}`;
    const now = new Date().toISOString();
    await SheetRowEntity.create({
      rowId: viewId,
      sheetId,
      projectId,
      order: -1,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      data: { ...viewConfig, _type: 'VIEW_CONFIG', ownerId: userId },
    }).go();
    return viewId;
  } catch (error) {
    console.error('Failed to save view:', error);
    return null;
  }
}

/**
 * Returns all saved views for a sheet (rows with order = -1 and _type = 'VIEW_CONFIG').
 * Filters private views so only the owner sees them.
 */
export async function getViews(
  projectId: string,
  sheetId: string
): Promise<Array<ViewConfig & { viewId: string }>> {
  try {
    const userId = await verifyProjectAccess(projectId);
    const result = await SheetRowEntity.query.bySheet({ sheetId }).go();
    return result.data
      .filter((r) => r.order === -1 && (r.data as Record<string, unknown>)?._type === 'VIEW_CONFIG')
      .filter((r) => {
        const d = r.data as Record<string, unknown>;
        return !d.isPrivate || d.ownerId === userId;
      })
      .map((r) => ({ viewId: r.rowId, ...(r.data as Omit<ViewConfig, 'ownerId'> & { ownerId: string }) }));
  } catch (error) {
    console.error('Failed to get views:', error);
    return [];
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
