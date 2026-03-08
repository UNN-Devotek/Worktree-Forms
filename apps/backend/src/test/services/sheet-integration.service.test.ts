import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Y from 'yjs';

// Set JWT_SECRET before any module imports that use it
process.env.JWT_SECRET = 'test-secret-for-sheet-integration';

vi.mock('../../lib/dynamo/index.js', () => ({
  SheetEntity: { get: vi.fn() },
  SheetRowEntity: { create: vi.fn() },
  RouteStopEntity: { get: vi.fn() },
}));

vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'row-nanoid-001') }));

// Mock HocuspocusProvider to avoid real WebSocket connections in tests.
// Throwing in the constructor causes injectRowIntoYjs to reject,
// which appendSubmissionToSheet catches silently.
vi.mock('@hocuspocus/provider', () => ({
  HocuspocusProvider: vi.fn().mockImplementation(() => {
    throw new Error('WebSocket not available in test environment');
  }),
}));

import { SheetIntegrationService } from '../../services/sheet-integration.service.js';
import { SheetEntity, SheetRowEntity, RouteStopEntity } from '../../lib/dynamo/index.js';

const mockSheet = SheetEntity as { get: ReturnType<typeof vi.fn> };
const mockSheetRow = SheetRowEntity as { create: ReturnType<typeof vi.fn> };
const mockStop = RouteStopEntity as { get: ReturnType<typeof vi.fn> };

const service = new SheetIntegrationService();

describe('SheetIntegrationService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── createInitialYjsDoc ────────────────────────────────────────────────

  describe('createInitialYjsDoc (static)', () => {
    it('[P0] returns a Buffer', () => {
      const result = SheetIntegrationService.createInitialYjsDoc([]);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('[P0] resulting Buffer encodes a valid Yjs document', () => {
      const columns = [
        { id: 'col-1', label: 'Name', type: 'text' },
        { id: 'col-2', label: 'Age', type: 'number' },
      ];
      const buf = SheetIntegrationService.createInitialYjsDoc(columns);

      // Decode the buffer into a fresh doc and verify columns
      const doc = new Y.Doc();
      Y.applyUpdate(doc, buf);
      const yColumns = doc.getArray('columns').toArray() as Array<Record<string, unknown>>;

      expect(yColumns).toHaveLength(2);
      expect(yColumns[0].id).toBe('col-1');
      expect(yColumns[0].label).toBe('Name');
    });

    it('[P0] uppercases the column type', () => {
      const buf = SheetIntegrationService.createInitialYjsDoc([
        { id: 'c1', label: 'Status', type: 'select' },
      ]);
      const doc = new Y.Doc();
      Y.applyUpdate(doc, buf);
      const cols = doc.getArray('columns').toArray() as Array<Record<string, unknown>>;
      expect(cols[0].type).toBe('SELECT');
    });

    it('[P0] sets default width of 150 on each column', () => {
      const buf = SheetIntegrationService.createInitialYjsDoc([
        { id: 'c1', label: 'Col', type: 'text' },
      ]);
      const doc = new Y.Doc();
      Y.applyUpdate(doc, buf);
      const cols = doc.getArray('columns').toArray() as Array<Record<string, unknown>>;
      expect(cols[0].width).toBe(150);
    });

    it('[P1] returns empty columns array for empty input', () => {
      const buf = SheetIntegrationService.createInitialYjsDoc([]);
      const doc = new Y.Doc();
      Y.applyUpdate(doc, buf);
      expect(doc.getArray('columns').length).toBe(0);
    });

    it('[P1] preserves column order', () => {
      const columns = [
        { id: 'c1', label: 'First', type: 'text' },
        { id: 'c2', label: 'Second', type: 'number' },
        { id: 'c3', label: 'Third', type: 'date' },
      ];
      const buf = SheetIntegrationService.createInitialYjsDoc(columns);
      const doc = new Y.Doc();
      Y.applyUpdate(doc, buf);
      const cols = doc.getArray('columns').toArray() as Array<Record<string, unknown>>;
      expect(cols.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
    });
  });

  // ─── appendSubmissionToSheet ────────────────────────────────────────────

  describe('appendSubmissionToSheet', () => {
    it('[P0] returns early without creating a row when sheet does not exist', async () => {
      mockSheet.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: null }) });

      await service.appendSubmissionToSheet('sheet-1', 'proj-1', { field: 'val' });

      expect(mockSheetRow.create).not.toHaveBeenCalled();
    });

    it('[P0] creates a SheetRow when the sheet exists', async () => {
      mockSheet.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { sheetId: 'sheet-1', projectId: 'proj-1' } }),
      });
      mockSheetRow.create.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { rowId: 'row-nanoid-001', data: { field: 'val' } } }),
      });

      // injectRowIntoYjs will throw (HocuspocusProvider mocked to throw), caught silently
      await service.appendSubmissionToSheet('sheet-1', 'proj-1', { field: 'val' });

      expect(mockSheetRow.create).toHaveBeenCalledOnce();
      const arg = mockSheetRow.create.mock.calls[0][0];
      expect(arg.sheetId).toBe('sheet-1');
      expect(arg.projectId).toBe('proj-1');
      expect(arg.data).toEqual({ field: 'val' });
      expect(arg.order).toBe(0);
    });

    it('[P1] does not throw when SheetEntity.get rejects', async () => {
      mockSheet.get.mockReturnValue({ go: vi.fn().mockRejectedValue(new Error('DB error')) });
      await expect(service.appendSubmissionToSheet('sheet-1', 'proj-1', {})).resolves.toBeUndefined();
    });
  });

  // ─── syncRouteStopToSheet ───────────────────────────────────────────────

  describe('syncRouteStopToSheet', () => {
    it('[P0] returns early when stop does not exist', async () => {
      mockStop.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: null }) });

      await service.syncRouteStopToSheet('route-1', 'stop-1', { status: 'COMPLETED' });

      // No further DB calls expected (no-op placeholder)
      expect(mockSheetRow.create).not.toHaveBeenCalled();
    });

    it('[P0] does not throw when stop exists (no-op placeholder)', async () => {
      mockStop.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { stopId: 'stop-1', routeId: 'route-1' } }),
      });

      await expect(
        service.syncRouteStopToSheet('route-1', 'stop-1', { status: 'EN_ROUTE' })
      ).resolves.toBeUndefined();
    });
  });

  // ─── syncSheetToRoute ───────────────────────────────────────────────────

  describe('syncSheetToRoute', () => {
    it('[P0] is a no-op and returns undefined', async () => {
      const result = await service.syncSheetToRoute('row-1', { some: 'data' });
      expect(result).toBeUndefined();
    });
  });
});
