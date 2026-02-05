'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  GridReadyEvent, 
  CellValueChangedEvent,
  ValueSetterParams,
  ValueGetterParams,
  ICellRendererParams,
  ModuleRegistry
} from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useTheme } from 'next-themes';
import { ImageCellRenderer } from './renderers/ImageCellRenderer';
import { AttachmentCellRenderer } from './renderers/AttachmentCellRenderer';

interface AGGridEditorProps {
  sheetId: string;
  initialCells?: Array<{
    row: number;
    col: number;
    value?: string;
    type?: 'text' | 'number' | 'formula' | 'image' | 'attachment';
    images?: any[];
    files?: any[];
  }>;
  onCellChange?: (cells: Array<{ 
    row: number; 
    col: number; 
    value: string;
    type?: string;
    images?: any[];
    files?: any[];
  }>) => void;
}

export const AGGridEditor: React.FC<AGGridEditorProps> = ({ 
  sheetId, 
  initialCells = [],
  onCellChange 
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  
  // Yjs setup for collaboration
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const yArrayRef = useRef<Y.Array<any> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Convert NocoDB cells to AG Grid row data
  const rowData = useMemo(() => {
    if (!initialCells || initialCells.length === 0) {
      // Create empty grid with 100 rows x 26 columns
      return Array.from({ length: 100 }, (_, rowIndex) => {
        const row: any = { id: rowIndex };
        // Cells are initially empty strings
        return row;
      });
    }

    // Build row data from cells
    const rows: any[] = [];
    const maxRow = Math.max(...initialCells.map(c => c.row), 99);
    
    for (let r = 0; r <= maxRow; r++) {
      const row: any = { id: r };
      for (let col = 0; col < 26; col++) {
        const colName = String.fromCharCode(65 + col);
        const cell = initialCells.find(c => c.row === r && c.col === col);
        // Store cell data. If it has type/images, store the object. Else just value.
        if (cell?.type === 'image' || cell?.type === 'attachment') {
            row[colName] = {
                value: cell.value || '',
                type: cell.type,
                images: cell.images,
                files: cell.files
            };
        } else {
            row[colName] = cell?.value || '';
        }
      }
      rows.push(row);
    }

    return rows;
  }, [initialCells]);

  // Value Getter: Handles object vs string
  const valueGetter = (params: ValueGetterParams) => {
      const field = params.colDef.field;
      if (!field || !params.data) return '';
      return params.data[field];
  };

  // Value Setter: Handles updating the cell data
  const valueSetter = (params: ValueSetterParams) => {
      const field = params.colDef.field;
      if (!field) return false;

      // Check if we are setting a structured object (from custom renderer) or a string (from text editor)
      const newValue = params.newValue;
      
      if (typeof newValue === 'object' && newValue !== null) {
          // Setting full object (e.g. from Image Render Upload)
          params.data[field] = newValue;
      } else {
          // Setting simple string (text edit)
          // Maintain existing type if present, or default to text
          const existing = params.data[field];
          if (typeof existing === 'object' && existing !== null) {
              params.data[field] = { ...existing, value: newValue };
          } else {
              params.data[field] = newValue;
          }
      }
      return true;
  };

  // Column definitions (A-Z)
  const columnDefs = useMemo<ColDef[]>(() => {
    // ID Column with Drag Handle
    const cols: ColDef[] = [
      {
        field: 'id',
        headerName: '',
        width: 60,
        pinned: 'left',
        editable: false,
        rowDrag: true, // Enable row dragging
        cellStyle: { 
          backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
          fontWeight: 'bold',
          textAlign: 'center',
          cursor: 'grab'
        },
        valueFormatter: (params) => `${params.value + 1}` // 1-based index display
      }
    ];

    for (let i = 0; i < 26; i++) {
      const colName = String.fromCharCode(65 + i);
      cols.push({
        field: colName,
        headerName: colName,
        editable: true,
        width: 120,
        valueGetter: valueGetter,
        valueSetter: valueSetter,
        // Dynamic Renderer Selection
        cellRendererSelector: (params: ICellRendererParams) => {
            const value = params.value;
            if (typeof value === 'object' && value !== null) {
                if (value.type === 'image') {
                    return { component: ImageCellRenderer };
                }
                if (value.type === 'attachment') {
                    return { component: AttachmentCellRenderer };
                }
            }
            return undefined; // Use default renderer
        },
        // Formatter for default text renderer to show just the string value
        valueFormatter: (params) => {
            const val = params.value;
            if (typeof val === 'object' && val !== null) {
                return val.value || '';
            }
            return val;
        }
      });
    }

    return cols;
  }, [theme]);

  // Initialize Yjs collaboration
  useEffect(() => {
    if (!mounted) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Use window.location.hostname for the WS server if we are not on localhost, 
    // but default to localhost if NEXT_PUBLIC_WS_URL is missing.
    const defaultWsHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${defaultWsHost}:1234`;
    
    console.log(`[AGGrid] Connecting to WebSocket: ${wsUrl}`);
    const provider = new WebsocketProvider(wsUrl, `sheet-${sheetId}`, ydoc);
    providerRef.current = provider;

    const yArray = ydoc.getArray('cells');
    yArrayRef.current = yArray;

    // Listen for remote changes
    yArray.observe(() => {
      // Re-render grid with updated data if remote change
      // Note: This is a brute force full update. 
      // Optimized approach: handle specific deltas.
      if (gridRef.current?.api) {
        const updatedData = yArray.toArray();
        if (updatedData.length > 0) {
            // Check if we need to update to avoid loop? 
            // setGridOption('rowData'...) triggers refresh.
            // Ideally we only update if content changed significantly or let AG Grid diff it.
            // AG Grid's immutableData or transaction update is better but rowData replace works for simplicity.
            gridRef.current.api.setGridOption('rowData', updatedData);
        }
      }
    });

    // Initial Sync: If local has data but Yjs empty, push local.
    // If Yjs has data, use Yjs (remote wins on load? or merge? usually remote wins).
    // But rowData comes from NocoDB (DB source of truth).
    // Logic: Load from DB. If Yjs is active and has data, it might be newer (if unsaved)?
    // But we trust DB load mostly. 
    // Let's seed Yjs if empty.
    if (yArray.length === 0 && rowData.length > 0) {
      ydoc.transact(() => {
        yArray.insert(0, rowData);
      });
    }

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [mounted, sheetId, rowData]); // rowData dependency handles initial load

  // Handle cell value changes
  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { data, colDef } = event;
    const rowIndex = data.id; // Correct ID reference? Yes, data.id is row index
    const colName = colDef.field;
    
    if (!colName) return;

    // Update Yjs
    if (ydocRef.current && yArrayRef.current) {
        // We find the index in YArray that matches data.id
        // Since we allow reordering, physical pos != data.id necessarily if we just move row UI.
        // But here we assume rowData array index maps 1:1 to YArray index for simplicity
        // UNLESS we reorder.
        // IF we reorder, 'data.id' (original row index) might be at a different position.
        // Let's assume for now we use index-based access.
        
        // Find current index of this row data in the grid to update YArray at that index?
        // Or find the object in YArray by ID? YArray is an array of objects.
        // We can traverse YArray to find object with .id === rowIndex.
        const yArray = yArrayRef.current;
        let targetIndex = -1;
        
        // Linear search in YArray (not efficient for large sheets but safe)
        // Or assume if no reordering happened, it is at rowIndex.
        // If reordering is supported, we must search.
        const yArr = yArray.toArray();
        targetIndex = yArr.findIndex((r: any) => r.id === rowIndex);

        if (targetIndex !== -1) {
             ydocRef.current.transact(() => {
                const existingRow = yArray.get(targetIndex);
                // Update just the changed field
                // Create new row object with update
                const updatedRow = { ...existingRow, [colName]: data[colName] };
                yArray.delete(targetIndex, 1);
                yArray.insert(targetIndex, [updatedRow]);
             });
        }
    }

    // Notify parent component for persistence
    if (onCellChange && gridRef.current?.api) {
        // Collect all changes? Or just sending generic "save" signal.
        // Parent expects an array of ALL cells to save full state (simplest for now).
        // OR differences. `saveSheetData` in NocoDB actions uses `replaceCells`.
        // So we need FULL state of the sheet.
        // This is heavy for every change.
        // Optimization: Debounce in parent handles this. We just send the full data.
        
        const allCells: Array<any> = [];
        gridRef.current.api.forEachNode((node) => {
            // If we reordered, node.rowIndex is the new display position.
            // NocoDB 'row' field should probably reflect the DISPLAY position.
            // So we should use node.rowIndex!
            const displayRowIndex = node.rowIndex;
            
            if (displayRowIndex === undefined || displayRowIndex === null) return;

            Object.keys(node.data).forEach((key) => {
                if (key !== 'id' && node.data[key]) {
                    const colIndex = key.charCodeAt(0) - 65;
                    const cellVal = node.data[key]; // string or object
                    
                    if (typeof cellVal === 'object') {
                        allCells.push({
                            row: displayRowIndex,
                            col: colIndex,
                            value: cellVal.value,
                            type: cellVal.type,
                            images: cellVal.images,
                            files: cellVal.files
                        });
                    } else if (cellVal !== '') {
                        allCells.push({
                            row: displayRowIndex,
                            col: colIndex,
                            value: cellVal
                        });
                    }
                }
            });
        });
        onCellChange(allCells);
    }
  }, [onCellChange]);

  // Handle Row Drag End - Sync reordering
  const onRowDragEnd = useCallback(() => {
      // The grid has already updated its internal rowData order because rowDragManaged=true.
      // We just need to sync this new order to Yjs.
      if (gridRef.current?.api && ydocRef.current && yArrayRef.current) {
          const newOrderData: any[] = [];
          gridRef.current.api.forEachNode((node) => {
              newOrderData.push(node.data);
          });

          // Update Yjs with new order
          ydocRef.current.transact(() => {
              const yArray = yArrayRef.current!;
              yArray.delete(0, yArray.length); // Clear all
              yArray.insert(0, newOrderData);  // Insert sorted
          });

          // Trigger save to persist new row orders (indexes)
          // We call a fake cell value changed or just directly notify parent?
          // Since we rely on cell change to trigger save..
          // Let's manually trigger onCellChange with the new structure.
          if (onCellChange) {
             const allCells: Array<any> = [];
             newOrderData.forEach((rowData, rowIndex) => {
                 Object.keys(rowData).forEach((key) => {
                    if (key !== 'id' && rowData[key]) {
                        const colIndex = key.charCodeAt(0) - 65;
                        const cellVal = rowData[key];
                         if (typeof cellVal === 'object') {
                            allCells.push({
                                row: rowIndex, // Use new index
                                col: colIndex,
                                value: cellVal.value,
                                type: cellVal.type,
                                images: cellVal.images,
                                files: cellVal.files
                            });
                        } else if (cellVal !== '') {
                            allCells.push({
                                row: rowIndex,
                                col: colIndex,
                                value: cellVal
                            });
                        }
                    }
                 });
             });
             onCellChange(allCells);
          }
      }
      console.log('Row reordered');
  }, [onCellChange]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    // gridApi ref is already handled by AgGridReact ref
    console.log('[AGGrid] Grid ready', params.api ? 'API OK' : 'No API');
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading spreadsheet...</div>
      </div>
    );
  }

  return (
    <div 
      className={`h-full w-full ${theme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}`}
    >
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        onGridReady={onGridReady}
        onCellValueChanged={onCellValueChanged}
        onRowDragEnd={onRowDragEnd}
        defaultColDef={{
          sortable: true, // caution with drag & sort conflict
          filter: true,
          resizable: true,
          suppressMovable: true // prevent column moving if desired
        }}
        rowSelection="multiple"
        enableRangeSelection={true}
        animateRows={true}
        suppressRowClickSelection={true}
        rowDragManaged={true} // AG Grid manages the drag UI
      />
    </div>
  );
};
