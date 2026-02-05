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
  activeFilters: FilterRule[];
  setActiveFilters: (filters: FilterRule[]) => void;
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

  // View Persistence
  const activeView = searchParams.get('view') || 'GRID';
  const setActiveView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.push(`${pathname}?${params.toString()}`);
  };

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
  }, [doc, expandedRows, hf]);

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
        activeFilters,
        setActiveFilters,
        isConnected,
        doc,
        token,
        user
      }}>

        {children}

      </SheetContext.Provider>

    );

  }

  