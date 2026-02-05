'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useYjsStore } from '../stores/useYjsStore';
import { HyperFormula } from 'hyperformula';
import type { CellStyleConfig, FilterRule } from '../types/cell-styles';
import { DEFAULT_CELL_STYLE } from '../types/cell-styles';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface FocusedCell {
  rowId: string;
  columnId: string;
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
  openDetailPanel: (rowId: string) => void;
  closeDetailPanel: () => void;
  updateCell: (rowId: string, columnId: string, value: any) => void;
  addColumn: (column: any) => void;
  addRow: (row: any) => void;
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
  doc: any; // Yjs document for spreadsheet grid
  token: string; // JWT token for WebSocket auth
  user: { name: string; color: string }; // User info for collaboration
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
  user: { name: string; color: string };
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
  const [cellStyles, setCellStyles] = useState<Map<string, CellStyleConfig>>(new Map());
  const [activeFilters, setActiveFilters] = useState<FilterRule[]>([]);

  const openDetailPanel = (rowId: string) => {
    setSelectedRowId(rowId);
    setIsDetailPanelOpen(true);
  };

  const closeDetailPanel = () => {
    setIsDetailPanelOpen(false);
  };

  // View Persistence - use local state to prevent remounts
  const [activeView, setActiveViewState] = useState<string>('GRID');

  // Sync from URL on mount only (not reactive)
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && ['GRID', 'GANTT', 'CALENDAR', 'CARD'].includes(viewParam)) {
      setActiveViewState(viewParam);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setActiveView = useCallback((view: string) => {
    setActiveViewState(view);
    // Debounced URL update to prevent rapid history pollution
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', view);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [pathname, searchParams, router]);

  // Hyperformula Engine
  const hf = useMemo(() => HyperFormula.buildEmpty({
    licenseKey: 'gpl-v3',
  }), []);

  useEffect(() => {
    connect(sheetId, token, user);
    return () => disconnect();
  }, [sheetId, token, user]);

  useEffect(() => {
    if (!doc) return;

    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    const yColumns = doc.getArray('columns');

    const updateState = () => {
      const order = yOrder.toArray() as string[];
      const allRows = order.map(id => yRows.get(id) as any).filter(Boolean);
      const cols = yColumns.toArray() as any[];
      
      // Update Hyperformula with new data
      const sheetValues = allRows.map(row => {
        return cols.map(col => row[col.id]);
      });

      if (hf.getSheetId('Sheet1') === undefined) {
        hf.addSheet('Sheet1');
      }
      hf.setSheetContent(hf.getSheetId('Sheet1')!, sheetValues);

      // Build tree and flatten for virtualization
      const flattened: any[] = [];
      const buildFlatList = (parentId: string | null = null, depth = 0) => {
        order.forEach(id => {
          const row = yRows.get(id) as any;
          if (row && row.parentId === parentId) {
            const hasChildren = allRows.some(r => r.parentId === id);
            const isExpanded = expandedRows.has(id);
            
            flattened.push({ 
              ...row, 
              depth, 
              hasChildren, 
              isExpanded 
            });

            if (hasChildren && isExpanded) {
              buildFlatList(id, depth + 1);
            }
          }
        });
      };

      buildFlatList(null, 0);
      setData(flattened);
      setColumns(cols);
    };

    yRows.observeDeep(updateState);
    yOrder.observe(updateState);
    yColumns.observe(updateState);

    // Initial load
    updateState();

    return () => {
      yRows.unobserveDeep(updateState);
      yOrder.unobserve(updateState);
      yColumns.unobserve(updateState);
    };
  }, [doc, expandedRows.size, hf]); // Use .size to prevent re-render when Set ref changes

  const getCellResult = (rowId: string, columnId: string) => {
    if (!doc) return null;
    const yOrder = doc.getArray('order');
    const yColumns = doc.getArray('columns');
    
    const rowIndex = yOrder.toArray().indexOf(rowId);
    const colIndex = yColumns.toArray().findIndex((c: any) => c.id === columnId);
    
    if (rowIndex === -1 || colIndex === -1) return null;
    
    const cellValue = hf.getCellValue({ sheet: hf.getSheetId('Sheet1')!, row: rowIndex, col: colIndex });
    if (cellValue instanceof Error) return '#ERROR!';
    return cellValue;
  };

  const updateCell = (rowId: string, columnId: string, value: any) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const row = yRows.get(rowId) as any;
    if (row) {
      yRows.set(rowId, { ...row, [columnId]: value });
    }
  };

  const addColumn = (column: any) => {
    if (!doc) return;
    const yColumns = doc.getArray('columns');
    yColumns.push([column]);
  };

  const addRow = (row: any) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    yRows.set(row.id, { ...row, parentId: null });
    yOrder.push([row.id]);
  };

  const deleteRow = (rowId: string) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    
    // Remove from rows map
    yRows.delete(rowId);
    
    // Remove from order array
    const index = yOrder.toArray().indexOf(rowId);
    if (index > -1) {
      yOrder.delete(index, 1);
    }
  };

  const indentRow = (rowId: string) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    const order = yOrder.toArray() as string[];
    const index = order.indexOf(rowId);
    
    if (index > 0) {
      const currentRow = yRows.get(rowId) as any;
      const prevRowId = order[index - 1];
      
      yRows.set(rowId, { ...currentRow, parentId: prevRowId });
      setExpandedRows(prev => {
        const next = new Set(prev);
        next.add(prevRowId);
        return next;
      });
    }
  };

  const outdentRow = (rowId: string) => {
    if (!doc) return;
    const yRows = doc.getMap('rows');
    const row = yRows.get(rowId) as any;
    
    if (row?.parentId) {
      const parentRow = yRows.get(row.parentId) as any;
      yRows.set(rowId, { ...row, parentId: parentRow?.parentId || null });
    }
  };

  const toggleExpand = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  // Cell style helpers
  const getCellStyleKey = (rowId: string, columnId: string) => `${rowId}:${columnId}`;
  
  const getCellStyle = useCallback((rowId: string, columnId: string): CellStyleConfig => {
    const key = getCellStyleKey(rowId, columnId);
    return cellStyles.get(key) || DEFAULT_CELL_STYLE;
  }, [cellStyles]);
  
  const applyCellStyle = useCallback((rowId: string, columnId: string, style: Partial<CellStyleConfig>) => {
    setCellStyles(prev => {
      const next = new Map(prev);
      const key = getCellStyleKey(rowId, columnId);
      const existing = next.get(key) || { ...DEFAULT_CELL_STYLE };
      next.set(key, { ...existing, ...style });
      return next;
    });
  }, []);

  const toggleCellStyle = useCallback((styleKey: 'bold' | 'italic' | 'strike') => {
    if (!doc || !focusedCell) return;

    const cellKey = `${focusedCell.rowId}:${focusedCell.columnId}`;
    const cellsMap = doc.getMap('cells');
    const current = cellsMap.get(cellKey) as any;
    const currentStyle = current?.style || {};
    const nextValue = !currentStyle[styleKey];

    doc.transact(() => {
      const cell = cellsMap.get(cellKey) as any;
      const newStyle = { ...(cell?.style || {}), [styleKey]: nextValue };
      if (cell) {
        cellsMap.set(cellKey, { ...cell, style: newStyle });
      } else {
        cellsMap.set(cellKey, { value: null, type: 'TEXT', style: newStyle });
      }
    });
  }, [doc, focusedCell]);

  const sortRows = useCallback((columnId: string, direction: 'asc' | 'desc') => {
    if (!doc) return;

    const yRows = doc.getMap('rows');
    const yOrder = doc.getArray('order');
    const currentOrder = yOrder.toArray() as string[];

    // Get all rows with their values for the sort column
    const rowsWithValues = currentOrder.map(rowId => {
      const row = yRows.get(rowId) as any;
      return {
        id: rowId,
        value: row?.[columnId] || '',
        row
      };
    });

    // Sort based on column value
    rowsWithValues.sort((a, b) => {
      const aVal = a.value;
      const bVal = b.value;

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === 'asc' ? 1 : -1;
      if (bVal == null) return direction === 'asc' ? -1 : 1;

      // Numeric comparison if both are numbers
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    // Update the order array in Yjs
    doc.transact(() => {
      // Clear the current order
      yOrder.delete(0, yOrder.length);

      // Insert sorted row IDs
      const sortedIds = rowsWithValues.map(item => item.id);
      yOrder.push(sortedIds);
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
        openDetailPanel,
        closeDetailPanel,
        updateCell,
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
        user
      }}>

        {children}

      </SheetContext.Provider>

    );

  }

  