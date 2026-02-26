'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { useYjsStore } from '../stores/useYjsStore';
import { HyperFormula } from 'hyperformula';
import type { CellStyleConfig, FilterRule, ConditionalFormatRule, HighlightChangesConfig } from '../types/cell-styles';
import { DEFAULT_CELL_STYLE } from '../types/cell-styles';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';



/** Clipboard state for row cut/copy/paste (local per-user, not synced via Yjs) */
interface CopiedRowState {
  id: string;
  values: Record<string, unknown>;
}

interface SheetContextType {
  data: any[];
  columns: any[];
  activeView: string;
  setActiveView: (view: string) => void;
  selectedRowId: string | null;
  setSelectedRowId: (id: string | null) => void;
  focusedCell: { rowId: string, columnId: string } | null;
  setFocusedCell: (cell: { rowId: string, columnId: string } | null) => void;
  editingCell: { rowId: string, columnId: string, initialValue?: string } | null;
  setEditingCell: (cell: { rowId: string, columnId: string, initialValue?: string } | null) => void;
  /** True while the user is composing a formula in the formula bar or a cell input */
  isFormulaEditing: boolean;
  setIsFormulaEditing: (v: boolean) => void;
  /**
   * Callback ref populated by the active formula input (FormulaBar or EditableCell).
   * When isFormulaEditing is true, clicking a cell calls this with the cell ref string
   * (e.g. "A1" or "A1:C3") to insert it at the cursor position.
   */
  insertCellRefCallback: React.MutableRefObject<((ref: string) => void) | null>;
  isDetailPanelOpen: boolean;
  detailPanelTab: string;
  openDetailPanel: (rowId: string, tab?: string) => void;
  closeDetailPanel: () => void;
  updateCell: (rowId: string, columnId: string, value: any) => void;
  updateCells: (updates: Array<{ rowId: string; columnId: string; value: any }>) => void;
  addColumn: (column: any) => void;

  addRow: (row: any, afterRowId?: string) => void;
  deleteRow: (rowId: string) => void;
  indentRow: (rowId: string) => void;
  outdentRow: (rowId: string) => void;
  toggleExpand: (rowId: string) => void;
  getCellResult: (rowId: string, columnId: string) => any;
  getCellStyle: (rowId: string, columnId: string) => CellStyleConfig;
  cellsRevision: number;
  applyCellStyle: (rowId: string, columnId: string, style: Partial<CellStyleConfig>) => void;
  toggleCellStyle: (styleKey: 'bold' | 'italic' | 'strike') => void;
  activeFilters: FilterRule[];
  setActiveFilters: (filters: FilterRule[]) => void;
  sortRows: (columnId: string, direction: 'asc' | 'desc') => void;
  isConnected: boolean;
  /**
   * Finding #9 (R9): Raw Yjs document — exposed for read-only observers
   * (ActionInbox, ChatPanel, RowDetailPanel). Prefer `updateCell` / `updateCells`
   * for writes — direct `doc.transact()` bypasses history tracking.
   */
  doc: any;
  token: string; // JWT token for WebSocket auth
  user: { name: string; color: string; id?: string }; // User info for collaboration
  sheetId: string; // Sheet identifier for per-sheet persistence (e.g. Gantt mapping)
  collaborators: Array<{ name: string; color: string; id?: string; focusedCell: { rowId: string; columnId: string } | null }>;

  // Row operations
  insertRowAbove: (rowId: string) => void;
  duplicateRow: (rowId: string) => void;
  clearRowCells: (rowId: string) => void;

  // Clipboard (local state, NOT Yjs)
  copiedRow: CopiedRowState | null;
  isCut: boolean;
  copyRow: (rowId: string) => void;
  cutRow: (rowId: string) => void;
  pasteRowAfter: (rowId: string) => void;

  // Column operations
  deleteColumn: (columnId: string) => void;
  insertColumnLeft: (columnId: string) => void;
  insertColumnRight: (columnId: string) => void;
  renameColumn: (columnId: string, newLabel: string) => void;
  updateColumn: (columnId: string, updates: Record<string, unknown>) => void;
  hideColumn: (columnId: string) => void;
  unhideAllColumns: () => void;
  updateColumnWidth: (columnId: string, width: number) => void;

  // Bulk selection for formatting (multi-select with Ctrl+Click)
  selectedColumnIds: Set<string>;
  setSelectedColumnIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedFormattingRowIds: Set<string>;
  setSelectedFormattingRowIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  applyColumnStyle: (columnId: string, style: Partial<CellStyleConfig>) => void;
  applyRowStyle: (rowId: string, style: Partial<CellStyleConfig>) => void;

  // Conditional formatting (Yjs-synced across collaborators)
  conditionalFormats: ConditionalFormatRule[];
  setConditionalFormats: (rules: ConditionalFormatRule[]) => void;

  // Highlight changes (local per-user state, overrides CF)
  highlightChanges: HighlightChangesConfig;
  setHighlightChanges: (config: HighlightChangesConfig) => void;

  /** getCellStyle + conditional formats + highlight changes, in priority order */
  getEffectiveStyle: (rowId: string, columnId: string) => CellStyleConfig;

  // Undo / Redo via Y.UndoManager
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const SheetContext = createContext<SheetContextType | null>(null);

export function useSheet() {
  const context = useContext(SheetContext);
  if (!context) throw new Error('useSheet must be used within a SheetProvider');
  return context;
}

export function SheetProvider({ 
  sheetId, 
  token, 
  user,
  children 
}: { 
  sheetId: string; 
  token: string; 
  user: { name: string; color: string; id?: string };
  children: React.ReactNode 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const { doc, connect, disconnect, isConnected, provider, users } = useYjsStore();
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ rowId: string, columnId: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string, columnId: string, initialValue?: string } | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [detailPanelTab, setDetailPanelTab] = useState('fields');
  // Finding #7 (R5): cellStyles local state removed — getCellStyle reads from Yjs `cells` map directly.
  // applyCellStyle kept for local-only style previews before committing to Yjs.
  const [activeFilters, setActiveFilters] = useState<FilterRule[]>([]);
  const [copiedRow, setCopiedRow] = useState<CopiedRowState | null>(null);
  const [isCut, setIsCut] = useState(false);
  const [selectedColumnIds, setSelectedColumnIds] = useState<Set<string>>(new Set());
  const [selectedFormattingRowIds, setSelectedFormattingRowIds] = useState<Set<string>>(new Set());
  const [isFormulaEditing, setIsFormulaEditing] = useState(false);
  const insertCellRefCallback = useRef<((ref: string) => void) | null>(null);

  // Undo / Redo via Y.UndoManager
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!doc) return;
    const tracked = [doc.getMap('rows'), doc.getMap('cells')];
    const mgr = new Y.UndoManager(tracked as Y.AbstractType<any>[], { captureTimeout: 500 });
    undoManagerRef.current = mgr;
    const onStack = () => {
      setCanUndo(mgr.undoStack.length > 0);
      setCanRedo(mgr.redoStack.length > 0);
    };
    mgr.on('stack-item-added', onStack);
    mgr.on('stack-item-popped', onStack);
    return () => {
      mgr.off('stack-item-added', onStack);
      mgr.off('stack-item-popped', onStack);
      mgr.destroy();
      undoManagerRef.current = null;
    };
  }, [doc]);

  const undo = useCallback(() => { undoManagerRef.current?.undo(); }, []);
  const redo = useCallback(() => { undoManagerRef.current?.redo(); }, []);

  // Conditional formatting rules (synced via Yjs)
  const [conditionalFormats, setConditionalFormatsState] = useState<ConditionalFormatRule[]>([]);

  // Highlight changes (local per-user preference)
  const [highlightChanges, setHighlightChanges] = useState<HighlightChangesConfig>({
    enabled: false,
    timeMs: 24 * 60 * 60 * 1000, // 1 day default
    color: '#fef08a',
  });

  // Finding #10 (R3): useCallback so MobileScheduleView and other consumers don't re-render
  const openDetailPanel = useCallback((rowId: string, tab = 'fields') => {
    setSelectedRowId(rowId);
    setDetailPanelTab(tab);
    setIsDetailPanelOpen(true);
  }, []);

  const closeDetailPanel = useCallback(() => {
    setIsDetailPanelOpen(false);
  }, []);

  // View Persistence - use local state to prevent remounts
  const [activeView, setActiveViewState] = useState<string>('GRID');

  // Sync from URL on mount only (not reactive)
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && ['GRID', 'GANTT', 'CALENDAR', 'CARD'].includes(viewParam)) {
      setActiveViewState(viewParam);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Finding #4 (R5): debounce via ref — previous timer is cleared on each call.
  // The old version returned a cleanup fn that nobody captured, leaking timeouts.
  const viewTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const setActiveView = useCallback((view: string) => {
    setActiveViewState(view);
    if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
    viewTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', view);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
  }, [pathname, searchParams, router]);

  // Hyperformula Engine
  const hf = useMemo(() => HyperFormula.buildEmpty({
    licenseKey: 'gpl-v3',
  }), []);

  // Finding #2 (R3): depend on primitives, not the user object reference.
  // If parent creates user inline (e.g. user={{ name, color }}), a new object ref fires
  // connect() on every parent render — infinite WebSocket reconnects.
  const userName = user.name;
  const userColor = user.color;
  const userId = user.id;
  useEffect(() => {
    connect(sheetId, token, { name: userName, color: userColor, id: userId });
    return () => disconnect();
  }, [sheetId, token, userName, userColor, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Broadcast our focused cell to collaborators via Yjs awareness
  useEffect(() => {
    if (!provider || !provider.awareness) return;
    provider.awareness.setLocalStateField('focusedCell', focusedCell);
  }, [provider, focusedCell]);

  // Derive remote collaborators from Yjs awareness states (exclude local user)
  const localUserId = userId;
  const collaborators = useMemo(() => {
    return users
      .filter((state: any) => {
        const u = state.user;
        if (!u) return false;
        if (localUserId && u.id && u.id === localUserId) return false;
        return true;
      })
      .map((state: any) => ({
        name: state.user.name ?? 'Unknown',
        color: state.user.color ?? '#888888',
        id: state.user.id,
        focusedCell: state.focusedCell ?? null,
      }));
  }, [users, localUserId]);

  // Finding #3 (R3): raw data state — Yjs observer ONLY updates raw data.
  // Filter logic is applied in a separate useMemo so activeFilters changes
  // don't cause observer teardown/re-registration (which creates a gap where
  // Yjs updates can be silently dropped).
  const [rawData, setRawData] = useState<{ rows: any[]; cols: any[] }>({ rows: [], cols: [] });
  // Incremented whenever cell styles change so consumers (LiveTable) re-render.
  const [cellsRevision, setCellsRevision] = useState(0);

  useEffect(() => {
    if (!doc) return;

    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    const yColumns = doc.getArray('columns');
    const yCells = doc.getMap('cells');

    const updateState = () => {
      const order = yOrder.toArray() as string[];
      const allRows = order.map(id => yRows.get(id) as any).filter(Boolean);
      const cols = yColumns.toArray() as any[];
      setRawData({ rows: allRows, cols });
    };
    const updateCellsRevision = () => setCellsRevision(v => v + 1);

    yRows.observeDeep(updateState);
    yOrder.observe(updateState);
    yColumns.observe(updateState);
    yCells.observe(updateCellsRevision);
    updateState();

    return () => {
      yRows.unobserveDeep(updateState);
      yOrder.unobserve(updateState);
      yColumns.unobserve(updateState);
      yCells.unobserve(updateCellsRevision);
    };
  }, [doc]); // Finding #3: no activeFilters here — observer is stable

  // Finding #3: filter + flatten applied as useMemo — no observer churn on filter change
  useEffect(() => {
    const { rows: allRows, cols } = rawData;
    const order = allRows.map(r => r.id);

    // Apply filters
    const filteredRows = allRows.filter(row => {
      if (activeFilters.length === 0) return true;
      // Finding #6 (R7): respect the enabled flag — disabled filters are skipped.
      return activeFilters.every(filter => {
        if (!filter.enabled) return true;
        const value = row[filter.columnId];
        const stringValue = value != null ? String(value).toLowerCase() : '';
        const filterValue = String(filter.value).toLowerCase();
        switch (filter.operator) {
          case 'contains': return stringValue.includes(filterValue);
          case 'not_contains': return !stringValue.includes(filterValue);
          case 'equals': return stringValue === filterValue;
          case 'not_equals': return stringValue !== filterValue;
          case 'starts_with': return stringValue.startsWith(filterValue);
          case 'ends_with': return stringValue.endsWith(filterValue);
          case 'is_blank': return !value;
          case 'is_not_blank': return !!value;
          case 'greater_than': {
            const a = Number(value), b = Number(filter.value);
            return !isNaN(a) && !isNaN(b) ? a > b : stringValue > filterValue;
          }
          case 'less_than': {
            const a = Number(value), b = Number(filter.value);
            return !isNaN(a) && !isNaN(b) ? a < b : stringValue < filterValue;
          }
          case 'greater_or_equal': {
            const a = Number(value), b = Number(filter.value);
            return !isNaN(a) && !isNaN(b) ? a >= b : stringValue >= filterValue;
          }
          case 'less_or_equal': {
            const a = Number(value), b = Number(filter.value);
            return !isNaN(a) && !isNaN(b) ? a <= b : stringValue <= filterValue;
          }
          default: return true;
        }
      });
    });

    // Update Hyperformula
    const sheetValues = filteredRows.map(row => cols.map(col => row[col.id]));
    if (hf.getSheetId('Sheet1') === undefined) hf.addSheet('Sheet1');
    hf.setSheetContent(hf.getSheetId('Sheet1')!, sheetValues);

    // Finding #8 (R5): Build tree and flatten with O(n) Map lookups
    // Previously used allRows.find() inside forEach = O(n²).
    const flattened: any[] = [];
    const rowMap = new Map(allRows.map(r => [r.id, r]));
    // Pre-compute children sets for O(1) lookup
    const childrenOf = new Map<string | null, string[]>();
    for (const id of order) {
      const row = rowMap.get(id);
      if (!row) continue;
      const pid = row.parentId ?? null;
      if (!childrenOf.has(pid)) childrenOf.set(pid, []);
      childrenOf.get(pid)!.push(id);
    }

    const buildFlatList = (parentId: string | null = null, depth = 0) => {
      if (activeFilters.length > 0) {
        if (parentId === null) {
          filteredRows.forEach(row =>
            flattened.push({ ...row, depth: 0, hasChildren: false, isExpanded: false })
          );
        }
        return;
      }
      const children = childrenOf.get(parentId) ?? [];
      for (const id of children) {
        const row = rowMap.get(id);
        if (!row) continue;
        const hasChildren = childrenOf.has(id) && (childrenOf.get(id)!.length > 0);
        const isExpanded = expandedRows.has(id);
        flattened.push({ ...row, depth, hasChildren, isExpanded });
        if (hasChildren && isExpanded) buildFlatList(id, depth + 1);
      }
    };

    buildFlatList(null, 0);
    setData(flattened);
    setColumns(cols);
  }, [rawData, activeFilters, expandedRows, hf]);

  // Finding #3 (R9): wrapped in useCallback for stable context reference
  const getCellResult = useCallback((rowId: string, columnId: string) => {
    if (!doc) return null;
    const sheetIndex = hf.getSheetId('Sheet1');
    if (sheetIndex === undefined) return null; // Sheet not initialised yet

    const yOrder = doc.getArray('order');
    const yColumns = doc.getArray('columns');

    const rowIndex = yOrder.toArray().indexOf(rowId);
    const colIndex = yColumns.toArray().findIndex((c: any) => c.id === columnId);

    if (rowIndex === -1 || colIndex === -1) return null;

    const cellValue = hf.getCellValue({ sheet: sheetIndex, row: rowIndex, col: colIndex });
    if (cellValue instanceof Error) return '#ERROR!';
    // Ensure we never return undefined (which would cause raw formula to be displayed)
    return cellValue ?? null;
  }, [doc, hf]);

  // Finding #10: memoized column label lookup — avoids O(n) scan on every cell edit
  const columnLabelMap = useMemo(
    () => new Map(columns.map((c: any) => [c.id, c.label])),
    [columns]
  );

  // Finding #3: useCallback so consumers don't re-render on every SheetProvider render
  const updateCell = useCallback((rowId: string, columnId: string, value: any) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const row = yRows.get(rowId) as any;
    if (row) {
      const oldValue = row[columnId];
      if (oldValue === value) return;

      const columnLabel = columnLabelMap.get(columnId) ?? columnId;

      doc.transact(() => {
        yRows.set(rowId, { ...row, [columnId]: value });
        const historyArr = doc.getArray(`row-${rowId}-history`);
        historyArr.push([{
          id: crypto.randomUUID(),
          columnId,
          columnLabel,
          oldValue: oldValue ?? null,
          newValue: value,
          changedBy: user.name,
          timestamp: Date.now(),
        }]);
      });
    }
  }, [doc, columnLabelMap, user.name]);

  // Finding #4: batch update — single Yjs transaction, single history entry per row
  const updateCells = useCallback((updates: Array<{ rowId: string; columnId: string; value: any }>) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    doc.transact(() => {
      // Group updates by rowId so we write one history entry per row
      const byRow = new Map<string, Array<{ columnId: string; value: any; oldValue: any; columnLabel: string }>>();
      for (const { rowId, columnId, value } of updates) {
        const row = yRows.get(rowId) as any;
        if (!row) continue;
        const oldValue = row[columnId];
        if (oldValue === value) continue;
        if (!byRow.has(rowId)) byRow.set(rowId, []);
        byRow.get(rowId)!.push({
          columnId,
          value,
          oldValue: oldValue ?? null,
          columnLabel: columnLabelMap.get(columnId) ?? columnId,
        });
      }
      for (const [rowId, cols] of byRow) {
        const row = yRows.get(rowId) as any;
        const updated = { ...row };
        for (const { columnId, value } of cols) {
          updated[columnId] = value;
        }
        yRows.set(rowId, updated);
        // Finding #10: one history entry PER COLUMN for human-readable per-field granularity
        const historyArr = doc.getArray(`row-${rowId}-history`);
        const now = Date.now();
        historyArr.push(
          cols.map((c) => ({
            id: crypto.randomUUID(),
            columnId: c.columnId,
            columnLabel: c.columnLabel,
            oldValue: c.oldValue,
            newValue: c.value,
            changedBy: user.name,
            timestamp: now,
          }))
        );
      }
    });
  }, [doc, columnLabelMap, user.name]);

  // Finding #6 (R5): useCallback for stable identity
  const addColumn = useCallback((column: any) => {
    if (!doc) return;
    const yColumns = doc.getArray('columns');
    yColumns.push([column]);
  }, [doc]);

  // Finding #13 (R3): addRow wrapped in doc.transact() — atomic mutation.
  // Finding #10 (R7): useCallback + optional afterRowId for context-menu "insert below".
  const addRow = useCallback((row: any, afterRowId?: string) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    doc.transact(() => {
      yRows.set(row.id, { ...row, parentId: row.parentId ?? null });
      if (afterRowId) {
        const order = yOrder.toArray() as string[];
        const idx = order.indexOf(afterRowId);
        if (idx > -1) {
          yOrder.insert(idx + 1, [row.id]);
        } else {
          yOrder.push([row.id]);
        }
      } else {
        yOrder.push([row.id]);
      }
    });
  }, [doc]);

  // Finding #1 (R5): wrap in transact so peers never see an order entry
  // pointing at a deleted row. Finding #6: useCallback for stable identity.
  const deleteRow = useCallback((rowId: string) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    doc.transact(() => {
      yRows.delete(rowId);
      const index = yOrder.toArray().indexOf(rowId);
      if (index > -1) {
        yOrder.delete(index, 1);
      }
    });
  }, [doc]);

  // Finding #5 (R5): wrap in transact. Finding #6: useCallback.
  const indentRow = useCallback((rowId: string) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    const order = yOrder.toArray() as string[];
    const index = order.indexOf(rowId);
    
    if (index > 0) {
      const currentRow = yRows.get(rowId) as any;
      const prevRowId = order[index - 1];
      doc.transact(() => {
        yRows.set(rowId, { ...currentRow, parentId: prevRowId });
      });
      setExpandedRows(prev => {
        const next = new Set(prev);
        next.add(prevRowId);
        return next;
      });
    }
  }, [doc]);

  // Finding #5 (R5): wrap in transact. Finding #6: useCallback.
  const outdentRow = useCallback((rowId: string) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const row = yRows.get(rowId) as any;
    
    if (row?.parentId) {
      const parentRow = yRows.get(row.parentId) as any;
      doc.transact(() => {
        yRows.set(rowId, { ...row, parentId: parentRow?.parentId || null });
      });
    }
  }, [doc]);

  // Finding #4 (R9): wrapped in useCallback for stable context reference
  const toggleExpand = useCallback((rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  // Cell style helpers
  const getCellStyleKey = (rowId: string, columnId: string) => `${rowId}:${columnId}`;

  // Finding #7 (R5): getCellStyle now reads from the Yjs `cells` map, not local state.
  // This way styles set by one collaborator (via toggleCellStyle) are visible to all.
  const getCellStyle = useCallback((rowId: string, columnId: string): CellStyleConfig => {
    if (!doc) return DEFAULT_CELL_STYLE;
    const cellsMap = doc.getMap('cells');
    const key = getCellStyleKey(rowId, columnId);
    const cell = cellsMap.get(key) as any;
    return cell?.style ? { ...DEFAULT_CELL_STYLE, ...cell.style } : DEFAULT_CELL_STYLE;
  }, [doc]);
  
  // Sync conditional formatting rules from Yjs
  useEffect(() => {
    if (!doc) return;
    const cfArray = doc.getArray('conditionalFormats');
    const update = () => setConditionalFormatsState(cfArray.toArray() as ConditionalFormatRule[]);
    cfArray.observe(update);
    update();
    return () => cfArray.unobserve(update);
  }, [doc]);

  const setConditionalFormats = useCallback((rules: ConditionalFormatRule[]) => {
    if (!doc) return;
    const cfArray = doc.getArray('conditionalFormats');
    doc.transact(() => {
      cfArray.delete(0, cfArray.length);
      if (rules.length > 0) cfArray.insert(0, rules);
    });
  }, [doc]);

  // Evaluate a single conditional format rule against a cell value
  const evaluateCfRule = (rule: ConditionalFormatRule, cellValue: any): boolean => {
    const { operator, value } = rule;
    const strCell = String(cellValue ?? '').toLowerCase();
    const strValue = String(value ?? '').toLowerCase();
    switch (operator) {
      case 'equals':          return cellValue === value || strCell === strValue;
      case 'not_equals':      return strCell !== strValue;
      case 'contains':        return strCell.includes(strValue);
      case 'not_contains':    return !strCell.includes(strValue);
      case 'starts_with':     return strCell.startsWith(strValue);
      case 'ends_with':       return strCell.endsWith(strValue);
      case 'is_blank':        return cellValue == null || cellValue === '';
      case 'is_not_blank':    return cellValue != null && cellValue !== '';
      case 'greater_than':    return Number(cellValue) > Number(value);
      case 'less_than':       return Number(cellValue) < Number(value);
      case 'greater_or_equal':return Number(cellValue) >= Number(value);
      case 'less_or_equal':   return Number(cellValue) <= Number(value);
      default:                return false;
    }
  };

  // Check if a cell was recently changed (reads from Yjs history)
  const checkRecentChange = (rowId: string, columnId: string, timeMs: number): boolean => {
    if (!doc) return false;
    const historyArr = doc.getArray(`row-${rowId}-history`);
    const cutoff = timeMs === 0 ? 0 : Date.now() - timeMs;
    return historyArr.toArray().some((entry: any) => {
      if (Array.isArray(entry)) {
        return entry.some((e: any) => e.columnId === columnId && e.timestamp >= cutoff);
      }
      return entry.columnId === columnId && entry.timestamp >= cutoff;
    });
  };

  // Effective style = base style + conditional formats + highlight changes override
  const getEffectiveStyle = useCallback((rowId: string, columnId: string): CellStyleConfig => {
    const baseStyle = getCellStyle(rowId, columnId);

    // Apply conditional formatting (iterate in reverse so index-0 = highest priority wins)
    let cfStyle: Partial<CellStyleConfig> = {};
    if (conditionalFormats.length > 0 && doc) {
      const row = doc.getMap('rows').get(rowId) as any;
      if (row) {
        for (let i = conditionalFormats.length - 1; i >= 0; i--) {
          const rule = conditionalFormats[i];
          if (!rule.enabled || !rule.columnId) continue;
          const cellValue = row[rule.columnId];
          if (evaluateCfRule(rule, cellValue)) {
            if (rule.applyToRow || rule.columnId === columnId) {
              cfStyle = { ...cfStyle, ...rule.style };
            }
          }
        }
      }
    }

    const withCf: CellStyleConfig = Object.keys(cfStyle).length > 0
      ? { ...baseStyle, ...cfStyle }
      : baseStyle;

    // Highlight changes overrides everything
    if (highlightChanges.enabled && checkRecentChange(rowId, columnId, highlightChanges.timeMs)) {
      return { ...withCf, backgroundColor: highlightChanges.color };
    }

    return withCf;
  }, [getCellStyle, conditionalFormats, highlightChanges, doc]);

  // Finding #7 (R5): applyCellStyle now writes to Yjs, consistent with getCellStyle above.
  const applyCellStyle = useCallback((rowId: string, columnId: string, style: Partial<CellStyleConfig>) => {
    if (!doc) return;
    const cellsMap = doc.getMap('cells');
    const key = getCellStyleKey(rowId, columnId);
    doc.transact(() => {
      const cell = cellsMap.get(key) as any;
      const existing = cell?.style || {};
      cellsMap.set(key, { ...(cell || { value: null, type: 'TEXT' }), style: { ...existing, ...style } });
    });
  }, [doc]);

  // Apply a style to every cell in a column (all current rows).
  const applyColumnStyle = useCallback((columnId: string, style: Partial<CellStyleConfig>) => {
    if (!doc) return;
    const cellsMap = doc.getMap('cells');
    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    const order = yOrder.toArray() as string[];
    doc.transact(() => {
      for (const rowId of order) {
        if (!yRows.get(rowId)) continue;
        const key = getCellStyleKey(rowId, columnId);
        const cell = cellsMap.get(key) as any;
        const existing = cell?.style || {};
        cellsMap.set(key, { ...(cell || { value: null, type: 'TEXT' }), style: { ...existing, ...style } });
      }
    });
  }, [doc]);

  // Apply a style to every cell in a row (all visible columns).
  const applyRowStyle = useCallback((rowId: string, style: Partial<CellStyleConfig>) => {
    if (!doc) return;
    const cellsMap = doc.getMap('cells');
    const yColumns = doc.getArray('columns');
    const cols = yColumns.toArray() as Array<{ id: string }>;
    doc.transact(() => {
      for (const col of cols) {
        const key = getCellStyleKey(rowId, col.id);
        const cell = cellsMap.get(key) as any;
        const existing = cell?.style || {};
        cellsMap.set(key, { ...(cell || { value: null, type: 'TEXT' }), style: { ...existing, ...style } });
      }
    });
  }, [doc]);

  // Finding #1 (R9): Map toolbar keys to CellStyleConfig property names.
  // Previously wrote `{ bold: true }` but getCellStyle reads `fontWeight`.
  const STYLE_KEY_MAP: Record<'bold' | 'italic' | 'strike', { prop: keyof CellStyleConfig; on: string; off: string }> = {
    bold:   { prop: 'fontWeight',      on: 'bold',         off: 'normal' },
    italic: { prop: 'fontStyle',       on: 'italic',       off: 'normal' },
    strike: { prop: 'textDecoration',  on: 'line-through', off: 'none'   },
  };

  const toggleCellStyle = useCallback((styleKey: 'bold' | 'italic' | 'strike') => {
    if (!doc) return;
    if (!focusedCell && selectedColumnIds.size === 0 && selectedFormattingRowIds.size === 0) return;

    const { prop, on, off } = STYLE_KEY_MAP[styleKey];

    if (focusedCell) {
      const cellKey = `${focusedCell.rowId}:${focusedCell.columnId}`;
      const cellsMap = doc.getMap('cells');
      const current = cellsMap.get(cellKey) as any;
      const currentStyle = current?.style || {};
      const isActive = currentStyle[prop] === on;
      doc.transact(() => {
        const cell = cellsMap.get(cellKey) as any;
        const newStyle = { ...(cell?.style || {}), [prop]: isActive ? off : on };
        cellsMap.set(cellKey, cell ? { ...cell, style: newStyle } : { value: null, type: 'TEXT', style: newStyle });
      });
    } else if (selectedColumnIds.size > 0) {
      const cellsMap = doc.getMap('cells');
      const yOrder = doc.getArray('order');
      const firstRowId = (yOrder.toArray() as string[])[0];
      const firstColId = [...selectedColumnIds][0];
      const firstKey = firstRowId ? `${firstRowId}:${firstColId}` : null;
      const firstCell = firstKey ? (cellsMap.get(firstKey) as any) : null;
      const isActive = firstCell?.style?.[prop] === on;
      selectedColumnIds.forEach(colId => {
        applyColumnStyle(colId, { [prop]: isActive ? off : on } as any);
      });
    } else if (selectedFormattingRowIds.size > 0) {
      const cellsMap = doc.getMap('cells');
      const yColumns = doc.getArray('columns');
      const firstCol = (yColumns.toArray() as Array<{ id: string }>)[0];
      const firstRowId = [...selectedFormattingRowIds][0];
      const firstKey = firstCol ? `${firstRowId}:${firstCol.id}` : null;
      const firstCell = firstKey ? (cellsMap.get(firstKey) as any) : null;
      const isActive = firstCell?.style?.[prop] === on;
      selectedFormattingRowIds.forEach(rowId => {
        applyRowStyle(rowId, { [prop]: isActive ? off : on } as any);
      });
    }
  }, [doc, focusedCell, selectedColumnIds, selectedFormattingRowIds, applyColumnStyle, applyRowStyle]);

  // Finding #9 (R3): sortRows now preserves hierarchy.
  // Previously it sorted the flat order array, breaking parent-child grouping.
  // Now it sorts only within each parent group recursively.
  const sortRows = useCallback((columnId: string, direction: 'asc' | 'desc') => {
    if (!doc) return;

    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    const currentOrder = yOrder.toArray() as string[];

    const compareValues = (aVal: any, bVal: any): number => {
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === 'asc' ? 1 : -1;
      if (bVal == null) return direction === 'asc' ? -1 : 1;
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    };

    // Build sorted order preserving hierarchy: sort siblings within each parent group
    const buildSortedOrder = (parentId: string | null): string[] => {
      const siblings = currentOrder
        .filter(id => {
          const row = yRows.get(id) as any;
          return row && (row.parentId ?? null) === parentId;
        })
        .sort((a, b) => {
          const rowA = yRows.get(a) as any;
          const rowB = yRows.get(b) as any;
          return compareValues(rowA?.[columnId], rowB?.[columnId]);
        });

      const result: string[] = [];
      for (const id of siblings) {
        result.push(id);
        // Recursively append children in their sorted order
        result.push(...buildSortedOrder(id));
      }
      return result;
    };

    const sortedIds = buildSortedOrder(null);

    doc.transact(() => {
      yOrder.delete(0, yOrder.length);
      yOrder.push(sortedIds);
    });
  }, [doc]);

  // --- Row operations ---

  const insertRowAbove = useCallback((rowId: string) => {
    if (!doc) return;
    const yOrder = doc.getArray('order');
    const yRows = doc.getMap('rows');
    const order = yOrder.toArray() as string[];
    const idx = order.indexOf(rowId);
    const newId = crypto.randomUUID();
    const newRow = { id: newId, parentId: null };
    doc.transact(() => {
      yRows.set(newId, newRow);
      if (idx > -1) {
        yOrder.insert(idx, [newId]);
      } else {
        yOrder.push([newId]);
      }
    });
  }, [doc]);

  const duplicateRow = useCallback((rowId: string) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    const sourceRow = yRows.get(rowId) as Record<string, unknown> | undefined;
    if (!sourceRow) return;
    const newId = crypto.randomUUID();
    const cloned = { ...sourceRow, id: newId };
    doc.transact(() => {
      yRows.set(newId, cloned);
      const order = yOrder.toArray() as string[];
      const idx = order.indexOf(rowId);
      if (idx > -1) {
        yOrder.insert(idx + 1, [newId]);
      } else {
        yOrder.push([newId]);
      }
    });
  }, [doc]);

  const clearRowCells = useCallback((rowId: string) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const yColumns = doc.getArray('columns');
    const row = yRows.get(rowId) as Record<string, unknown> | undefined;
    if (!row) return;
    const cols = yColumns.toArray() as Array<{ id: string }>;
    const cleared = { ...row };
    for (const col of cols) {
      cleared[col.id] = '';
    }
    doc.transact(() => {
      yRows.set(rowId, cleared);
    });
  }, [doc]);

  // --- Clipboard operations (local state, not Yjs) ---

  const copyRow = useCallback((rowId: string) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const row = yRows.get(rowId) as Record<string, unknown> | undefined;
    if (!row) return;
    const { id: _id, parentId: _pid, ...values } = row;
    setCopiedRow({ id: rowId, values });
    setIsCut(false);
  }, [doc]);

  const cutRow = useCallback((rowId: string) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const row = yRows.get(rowId) as Record<string, unknown> | undefined;
    if (!row) return;
    const { id: _id, parentId: _pid, ...values } = row;
    setCopiedRow({ id: rowId, values });
    setIsCut(true);
  }, [doc]);

  const pasteRowAfter = useCallback((targetRowId: string) => {
    if (!doc || !copiedRow) return;
    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    const newId = crypto.randomUUID();
    const newRow = { ...copiedRow.values, id: newId, parentId: null };
    doc.transact(() => {
      yRows.set(newId, newRow);
      const order = yOrder.toArray() as string[];
      const idx = order.indexOf(targetRowId);
      if (idx > -1) {
        yOrder.insert(idx + 1, [newId]);
      } else {
        yOrder.push([newId]);
      }
      // If cut, remove the source row
      if (isCut) {
        yRows.delete(copiedRow.id);
        const srcIdx = yOrder.toArray().indexOf(copiedRow.id);
        if (srcIdx > -1) {
          yOrder.delete(srcIdx, 1);
        }
      }
    });
    if (isCut) {
      setCopiedRow(null);
      setIsCut(false);
    }
  }, [doc, copiedRow, isCut]);

  // --- Column operations ---

  const deleteColumn = useCallback((columnId: string) => {
    if (!doc) return;
    const yColumns = doc.getArray('columns');
    const yRows = doc.getMap('rows');
    const cellsMap = doc.getMap('cells');
    doc.transact(() => {
      // Remove column from Y.Array
      const cols = yColumns.toArray() as Array<{ id: string }>;
      const idx = cols.findIndex(c => c.id === columnId);
      if (idx > -1) {
        yColumns.delete(idx, 1);
      }
      // Clear all cells referencing this column from rows
      const yOrder = doc.getArray('order');
      const order = yOrder.toArray() as string[];
      for (const rowId of order) {
        const row = yRows.get(rowId) as Record<string, unknown> | undefined;
        if (row && columnId in row) {
          const { [columnId]: _removed, ...rest } = row;
          yRows.set(rowId, rest);
        }
      }
      // Remove cell styles for this column
      const allKeys = Array.from(cellsMap.keys()) as string[];
      for (const key of allKeys) {
        if (key.endsWith(`:${columnId}`)) {
          cellsMap.delete(key);
        }
      }
    });
  }, [doc]);

  const insertColumnLeft = useCallback((columnId: string) => {
    if (!doc) return;
    const yColumns = doc.getArray('columns');
    const cols = yColumns.toArray() as Array<{ id: string }>;
    const idx = cols.findIndex(c => c.id === columnId);
    const newCol = { id: crypto.randomUUID(), label: 'New Column', type: 'TEXT', width: 120 };
    doc.transact(() => {
      if (idx > -1) {
        yColumns.insert(idx, [newCol]);
      } else {
        yColumns.push([newCol]);
      }
    });
  }, [doc]);

  const insertColumnRight = useCallback((columnId: string) => {
    if (!doc) return;
    const yColumns = doc.getArray('columns');
    const cols = yColumns.toArray() as Array<{ id: string }>;
    const idx = cols.findIndex(c => c.id === columnId);
    const newCol = { id: crypto.randomUUID(), label: 'New Column', type: 'TEXT', width: 120 };
    doc.transact(() => {
      if (idx > -1) {
        yColumns.insert(idx + 1, [newCol]);
      } else {
        yColumns.push([newCol]);
      }
    });
  }, [doc]);

  const renameColumn = useCallback((columnId: string, newLabel: string) => {
    if (!doc) return;
    const yColumns = doc.getArray('columns');
    const cols = yColumns.toArray() as Array<{ id: string; label: string; type: string; width?: number; hidden?: boolean }>;
    const idx = cols.findIndex(c => c.id === columnId);
    if (idx === -1) return;
    doc.transact(() => {
      const col = cols[idx];
      yColumns.delete(idx, 1);
      yColumns.insert(idx, [{ ...col, label: newLabel }]);
    });
  }, [doc]);

  const updateColumn = useCallback((columnId: string, updates: Record<string, unknown>) => {
    if (!doc) return;
    const yColumns = doc.getArray('columns');
    const cols = yColumns.toArray() as Array<Record<string, unknown>>;
    const idx = cols.findIndex(c => c.id === columnId);
    if (idx === -1) return;
    doc.transact(() => {
      const col = cols[idx];
      yColumns.delete(idx, 1);
      yColumns.insert(idx, [{ ...col, ...updates }]);
    });
  }, [doc]);

  const hideColumn = useCallback((columnId: string) => {
    if (!doc) return;
    const yColumns = doc.getArray('columns');
    const cols = yColumns.toArray() as Array<{ id: string; label: string; type: string; width?: number; hidden?: boolean }>;
    const idx = cols.findIndex(c => c.id === columnId);
    if (idx === -1) return;
    doc.transact(() => {
      const col = cols[idx];
      yColumns.delete(idx, 1);
      yColumns.insert(idx, [{ ...col, hidden: true }]);
    });
  }, [doc]);

  const unhideAllColumns = useCallback(() => {
    if (!doc) return;
    const yColumns = doc.getArray('columns');
    const cols = yColumns.toArray() as Array<{ id: string; label: string; type: string; width?: number; hidden?: boolean }>;
    doc.transact(() => {
      for (let i = cols.length - 1; i >= 0; i--) {
        if (cols[i].hidden) {
          const col = cols[i];
          yColumns.delete(i, 1);
          yColumns.insert(i, [{ ...col, hidden: false }]);
        }
      }
    });
  }, [doc]);

  const updateColumnWidth = useCallback((columnId: string, width: number) => {
    if (!doc) return;
    const yColumns = doc.getArray('columns');
    const cols = yColumns.toArray() as Array<{ id: string; label: string; type: string; width?: number; hidden?: boolean }>;
    const idx = cols.findIndex(c => c.id === columnId);
    if (idx === -1) return;
    doc.transact(() => {
      const col = cols[idx];
      yColumns.delete(idx, 1);
      yColumns.insert(idx, [{ ...col, width: Math.max(40, Math.round(width)) }]);
    });
  }, [doc]);

    return (
      <SheetContext.Provider value={{
        data,
        columns,
        activeView,
        setActiveView,
        selectedRowId,
        setSelectedRowId,
        focusedCell,
        setFocusedCell,
        editingCell,
        setEditingCell,
        isDetailPanelOpen,
        detailPanelTab,
        openDetailPanel,
        closeDetailPanel,
        updateCell,
        updateCells,
        addColumn,
        addRow,
        deleteRow,
        indentRow,
        outdentRow,
        toggleExpand,
        getCellResult,
        getCellStyle,
        cellsRevision,
        applyCellStyle,
        toggleCellStyle,
        activeFilters,
        setActiveFilters,
        sortRows,
        isConnected,
        doc,
        token,
        user,
        sheetId,
        collaborators,
        // Row operations
        insertRowAbove,
        duplicateRow,
        clearRowCells,
        // Clipboard
        copiedRow,
        isCut,
        copyRow,
        cutRow,
        pasteRowAfter,
        // Column operations
        deleteColumn,
        insertColumnLeft,
        insertColumnRight,
        renameColumn,
        updateColumn,
        hideColumn,
        unhideAllColumns,
        updateColumnWidth,
        // Bulk selection
        selectedColumnIds,
        setSelectedColumnIds,
        selectedFormattingRowIds,
        setSelectedFormattingRowIds,
        applyColumnStyle,
        applyRowStyle,
        // Formula editing coordination
        isFormulaEditing,
        setIsFormulaEditing,
        insertCellRefCallback,
        // Conditional formatting
        conditionalFormats,
        setConditionalFormats,
        // Highlight changes
        highlightChanges,
        setHighlightChanges,
        getEffectiveStyle,
        // Undo / Redo
        undo,
        redo,
        canUndo,
        canRedo,
      }}>

        {children}

      </SheetContext.Provider>

    );

  }

  