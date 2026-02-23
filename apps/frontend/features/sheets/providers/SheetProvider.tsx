'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useYjsStore } from '../stores/useYjsStore';
import { HyperFormula } from 'hyperformula';
import type { CellStyleConfig, FilterRule } from '../types/cell-styles';
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
  hideColumn: (columnId: string) => void;
  unhideAllColumns: () => void;
  updateColumnWidth: (columnId: string, width: number) => void;
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
  
  const { doc, connect, disconnect, isConnected } = useYjsStore();
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

  // Finding #3 (R3): raw data state — Yjs observer ONLY updates raw data.
  // Filter logic is applied in a separate useMemo so activeFilters changes
  // don't cause observer teardown/re-registration (which creates a gap where
  // Yjs updates can be silently dropped).
  const [rawData, setRawData] = useState<{ rows: any[]; cols: any[] }>({ rows: [], cols: [] });

  useEffect(() => {
    if (!doc) return;

    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    const yColumns = doc.getArray('columns');

    const updateState = () => {
      const order = yOrder.toArray() as string[];
      const allRows = order.map(id => yRows.get(id) as any).filter(Boolean);
      const cols = yColumns.toArray() as any[];
      setRawData({ rows: allRows, cols });
    };

    yRows.observeDeep(updateState);
    yOrder.observe(updateState);
    yColumns.observe(updateState);
    updateState();

    return () => {
      yRows.unobserveDeep(updateState);
      yOrder.unobserve(updateState);
      yColumns.unobserve(updateState);
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
    const yOrder = doc.getArray('order');
    const yColumns = doc.getArray('columns');
    
    const rowIndex = yOrder.toArray().indexOf(rowId);
    const colIndex = yColumns.toArray().findIndex((c: any) => c.id === columnId);
    
    if (rowIndex === -1 || colIndex === -1) return null;
    
    const cellValue = hf.getCellValue({ sheet: hf.getSheetId('Sheet1')!, row: rowIndex, col: colIndex });
    if (cellValue instanceof Error) return '#ERROR!';
    return cellValue;
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

  // Finding #1 (R9): Map toolbar keys to CellStyleConfig property names.
  // Previously wrote `{ bold: true }` but getCellStyle reads `fontWeight`.
  const STYLE_KEY_MAP: Record<'bold' | 'italic' | 'strike', { prop: keyof CellStyleConfig; on: string; off: string }> = {
    bold:   { prop: 'fontWeight',      on: 'bold',         off: 'normal' },
    italic: { prop: 'fontStyle',       on: 'italic',       off: 'normal' },
    strike: { prop: 'textDecoration',  on: 'line-through', off: 'none'   },
  };

  const toggleCellStyle = useCallback((styleKey: 'bold' | 'italic' | 'strike') => {
    if (!doc || !focusedCell) return;

    const { prop, on, off } = STYLE_KEY_MAP[styleKey];
    const cellKey = `${focusedCell.rowId}:${focusedCell.columnId}`;
    const cellsMap = doc.getMap('cells');
    const current = cellsMap.get(cellKey) as any;
    const currentStyle = current?.style || {};
    const isActive = currentStyle[prop] === on;

    doc.transact(() => {
      const cell = cellsMap.get(cellKey) as any;
      const newStyle = { ...(cell?.style || {}), [prop]: isActive ? off : on };
      if (cell) {
        cellsMap.set(cellKey, { ...cell, style: newStyle });
      } else {
        cellsMap.set(cellKey, { value: null, type: 'TEXT', style: newStyle });
      }
    });
  }, [doc, focusedCell]);

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
        hideColumn,
        unhideAllColumns,
        updateColumnWidth,
      }}>

        {children}

      </SheetContext.Provider>

    );

  }

  