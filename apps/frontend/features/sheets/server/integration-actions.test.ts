import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'stop-nanoid-001') }));
vi.mock('@/lib/dynamo', () => ({
  SubmissionEntity: {
    query: { byForm: vi.fn() },
  },
  SheetRowEntity: {
    create: vi.fn(),
    patch: vi.fn(),
    query: { bySheet: vi.fn() },
  },
  RouteStopEntity: {
    create: vi.fn(),
  },
  ProjectMemberEntity: {
    query: { primary: vi.fn() },
  },
}));

import { importFormSubmissionsToSheet, exportSheetRowsToRoute } from './integration-actions';
import { auth } from '@/auth';
import { SubmissionEntity, SheetRowEntity, RouteStopEntity, ProjectMemberEntity } from '@/lib/dynamo';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockSubmission = SubmissionEntity as { query: { byForm: ReturnType<typeof vi.fn> } };
const mockSheetRow = SheetRowEntity as {
  create: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  query: { bySheet: ReturnType<typeof vi.fn> };
};
const mockRouteStop = RouteStopEntity as { create: ReturnType<typeof vi.fn> };
const mockMember = ProjectMemberEntity as { query: { primary: ReturnType<typeof vi.fn> } };

function authed(userId = 'user-1') {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}

function notAuthed() {
  mockAuth.mockResolvedValue(null);
}

function memberOf(projectId = 'proj-1') {
  mockMember.query.primary.mockReturnValue({
    go: vi.fn().mockResolvedValue({ data: [{ userId: 'user-1', projectId }] }),
  });
}

function notMember() {
  mockMember.query.primary.mockReturnValue({
    go: vi.fn().mockResolvedValue({ data: [] }),
  });
}

describe('integration-actions', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── importFormSubmissionsToSheet ──────────────────────────────────────────

  describe('importFormSubmissionsToSheet', () => {
    it('[P0] returns {0,0} when not authenticated', async () => {
      notAuthed();
      const result = await importFormSubmissionsToSheet('proj-1', 'form-1', 'sheet-1');
      expect(result).toEqual({ imported: 0, skipped: 0 });
    });

    it('[P0] returns {0,0} when user is not a member', async () => {
      authed();
      notMember();
      const result = await importFormSubmissionsToSheet('proj-1', 'form-1', 'sheet-1');
      expect(result).toEqual({ imported: 0, skipped: 0 });
    });

    it('[P0] imports new submissions and returns correct count', async () => {
      authed();
      memberOf();
      mockSubmission.query.byForm.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            { submissionId: 'sub-1', projectId: 'proj-1', data: { name: 'Alice' }, status: 'SUBMITTED' },
            { submissionId: 'sub-2', projectId: 'proj-1', data: { name: 'Bob' }, status: 'SUBMITTED' },
          ],
        }),
      });
      mockSheetRow.query.bySheet.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [] }), // no existing rows
      });
      mockSheetRow.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });

      const result = await importFormSubmissionsToSheet('proj-1', 'form-1', 'sheet-1');

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(mockSheetRow.create).toHaveBeenCalledTimes(2);
    });

    it('[P0] skips submissions already imported (_submissionId present in existing rows)', async () => {
      authed();
      memberOf();
      mockSubmission.query.byForm.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            { submissionId: 'sub-1', projectId: 'proj-1', data: {}, status: 'SUBMITTED' },
          ],
        }),
      });
      mockSheetRow.query.bySheet.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ rowId: 'row-1', data: { _submissionId: 'sub-1' }, order: 0, projectId: 'proj-1' }],
        }),
      });

      const result = await importFormSubmissionsToSheet('proj-1', 'form-1', 'sheet-1');

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
      expect(mockSheetRow.create).not.toHaveBeenCalled();
    });

    it('[P0] filters submissions from other projects', async () => {
      authed();
      memberOf('proj-1');
      mockSubmission.query.byForm.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            { submissionId: 'sub-1', projectId: 'other-proj', data: {}, status: 'SUBMITTED' }, // wrong project
            { submissionId: 'sub-2', projectId: 'proj-1', data: {}, status: 'SUBMITTED' },    // correct
          ],
        }),
      });
      mockSheetRow.query.bySheet.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });
      mockSheetRow.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });

      const result = await importFormSubmissionsToSheet('proj-1', 'form-1', 'sheet-1');

      expect(result.imported).toBe(1);
      expect(mockSheetRow.create).toHaveBeenCalledTimes(1);
    });

    it('[P1] stores _submissionId, _formId, and _importedAt in row data', async () => {
      authed('user-1');
      memberOf();
      mockSubmission.query.byForm.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ submissionId: 'sub-1', projectId: 'proj-1', data: { field: 'val' }, status: 'SUBMITTED', submittedBy: 'user-1' }],
        }),
      });
      mockSheetRow.query.bySheet.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });
      mockSheetRow.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });

      await importFormSubmissionsToSheet('proj-1', 'form-1', 'sheet-1');

      const createArg = mockSheetRow.create.mock.calls[0][0];
      expect(createArg.data._submissionId).toBe('sub-1');
      expect(createArg.data._formId).toBe('form-1');
      expect(createArg.data._importedAt).toBeDefined();
      expect(createArg.data.field).toBe('val');
    });
  });

  // ─── exportSheetRowsToRoute ────────────────────────────────────────────────

  describe('exportSheetRowsToRoute', () => {
    it('[P0] returns {0,0} when not authenticated', async () => {
      notAuthed();
      const result = await exportSheetRowsToRoute('proj-1', 'sheet-1', 'route-1');
      expect(result).toEqual({ exported: 0, skipped: 0 });
    });

    it('[P0] returns {0,0} when user is not a member', async () => {
      authed();
      notMember();
      const result = await exportSheetRowsToRoute('proj-1', 'sheet-1', 'route-1');
      expect(result).toEqual({ exported: 0, skipped: 0 });
    });

    it('[P0] exports new rows as route stops', async () => {
      authed('user-1');
      memberOf();
      mockSheetRow.query.bySheet.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            { rowId: 'row-1', projectId: 'proj-1', order: 0, data: { name: 'HQ', address: '1 Main St' } },
            { rowId: 'row-2', projectId: 'proj-1', order: 1, data: { name: 'Site B', address: '2 Oak Ave' } },
          ],
        }),
      });
      mockRouteStop.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockSheetRow.patch.mockReturnValue({ set: vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) }) });

      const result = await exportSheetRowsToRoute('proj-1', 'sheet-1', 'route-1');

      expect(result.exported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(mockRouteStop.create).toHaveBeenCalledTimes(2);
    });

    it('[P0] skips rows that already have _routeStopId', async () => {
      authed();
      memberOf();
      mockSheetRow.query.bySheet.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            { rowId: 'row-1', projectId: 'proj-1', order: 0, data: { _routeStopId: 'existing-stop' } },
          ],
        }),
      });

      const result = await exportSheetRowsToRoute('proj-1', 'sheet-1', 'route-1');

      expect(result.skipped).toBe(1);
      expect(result.exported).toBe(0);
      expect(mockRouteStop.create).not.toHaveBeenCalled();
    });

    it('[P0] excludes sentinel rows (order = -1)', async () => {
      authed();
      memberOf();
      mockSheetRow.query.bySheet.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            { rowId: 'view-config', projectId: 'proj-1', order: -1, data: { _viewConfig: true } }, // sentinel
            { rowId: 'row-1', projectId: 'proj-1', order: 0, data: { name: 'Stop A' } },
          ],
        }),
      });
      mockRouteStop.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockSheetRow.patch.mockReturnValue({ set: vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) }) });

      const result = await exportSheetRowsToRoute('proj-1', 'sheet-1', 'route-1');

      expect(result.exported).toBe(1);
      expect(mockRouteStop.create).toHaveBeenCalledTimes(1);
    });

    it('[P1] back-patches row with _routeStopId and _routeId after export', async () => {
      authed('user-1');
      memberOf();
      mockSheetRow.query.bySheet.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ rowId: 'row-1', projectId: 'proj-1', order: 0, data: { name: 'Stop' } }],
        }),
      });
      mockRouteStop.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockSheetRow.patch.mockReturnValue({ set: mockSet });

      await exportSheetRowsToRoute('proj-1', 'sheet-1', 'route-1');

      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.data._routeStopId).toBe('stop-nanoid-001');
      expect(setArg.data._routeId).toBe('route-1');
    });

    it('[P1] stop order is sequential starting from 0', async () => {
      authed();
      memberOf();
      mockSheetRow.query.bySheet.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            { rowId: 'r1', projectId: 'proj-1', order: 5, data: { name: 'A' } },
            { rowId: 'r2', projectId: 'proj-1', order: 10, data: { name: 'B' } },
          ],
        }),
      });
      mockRouteStop.create.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockSheetRow.patch.mockReturnValue({ set: vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) }) });

      await exportSheetRowsToRoute('proj-1', 'sheet-1', 'route-1');

      expect(mockRouteStop.create.mock.calls[0][0].order).toBe(0);
      expect(mockRouteStop.create.mock.calls[1][0].order).toBe(1);
    });
  });
});
