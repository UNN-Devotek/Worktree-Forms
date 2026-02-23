"use client"

import React, { useMemo, useRef, useCallback } from "react"
import { t } from "@/lib/i18n"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useSheet } from "../providers/SheetProvider"
import { cn } from "@/lib/utils"
import { CellContextMenu, ColumnContextMenu } from "./grid/GridContextMenu"



interface LiveTableProps {
  documentId?: string // Optional now since provider has it
  containerClassName?: string
}

export function LiveTable({ containerClassName }: LiveTableProps) {
  const {
    data,
    columns,
    updateCell,
    selectedRowId,
    openDetailPanel,
    copiedRow,
    isCut,
    focusedCell,
    setFocusedCell,
    getCellStyle,
    updateColumnWidth,
  } = useSheet()

  // Delay clearing focusedCell so toolbar button clicks register before blur fires
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCellFocus = useCallback((rowId: string, columnId: string) => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current)
      blurTimerRef.current = null
    }
    setFocusedCell({ rowId, columnId })
  }, [setFocusedCell])

  const handleCellBlur = useCallback(() => {
    blurTimerRef.current = setTimeout(() => {
      setFocusedCell(null)
    }, 200)
  }, [setFocusedCell])

  const tableColumns = useMemo<ColumnDef<any>[]>(
    () => {
        if (!columns || columns.length === 0) return []

        return columns.filter((col: any) => !col.hidden).map((col: any) => ({
            accessorKey: col.id,
            header: col.label || col.id,
            size: col.width || 120,
            cell: ({ row, getValue }: any) => {
                const initialValue = getValue()
                return (
                    <EditableCell
                        rowId={row.original.id}
                        columnId={col.id}
                        initialValue={initialValue}
                        onChange={(val) => updateCell(row.original.id, col.id, val)}
                        columnType={col.type}
                        onFocus={handleCellFocus}
                        onBlur={handleCellBlur}
                        getCellStyle={getCellStyle}
                    />
                )
            }
        }))
    },
    [columns, updateCell, handleCellFocus, handleCellBlur, getCellStyle]
  )

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    onColumnSizingChange: (updater) => {
      // Persist final sizes to Yjs when resizing ends
      const sizing = typeof updater === 'function'
        ? updater(table.getState().columnSizing)
        : updater
      Object.entries(sizing).forEach(([colId, width]) => {
        updateColumnWidth(colId, width as number)
      })
    },
  })

  // Virtualization
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  })

  return (
    <div ref={parentRef} className={cn("h-full w-full overflow-auto border rounded-md relative", containerClassName)}>
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b grid w-full">
            {table.getHeaderGroups().map((headerGroup) => (
                <div key={headerGroup.id} className="flex">
                    {headerGroup.headers.map((header) => (
                        <ColumnContextMenu key={header.id} columnId={header.column.id}>
                            <div
                                 className="relative h-10 px-4 flex items-center font-medium text-muted-foreground border-r select-none"
                                 style={{ width: header.getSize() }}>
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                {/* Resize handle */}
                                <div
                                    onMouseDown={header.getResizeHandler()}
                                    onTouchStart={header.getResizeHandler()}
                                    className={cn(
                                        "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none",
                                        "hover:bg-primary/60 active:bg-primary",
                                        "transition-colors",
                                        header.column.getIsResizing() && "bg-primary"
                                    )}
                                />
                            </div>
                        </ColumnContextMenu>
                    ))}
                </div>
            ))}
        </div>

        {/* Virtualized Body */}
        <div
            className="relative w-full"
            style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
            }}
        >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = table.getRowModel().rows[virtualRow.index]
                if (!row) return null

                const isRowCut = isCut && copiedRow?.id === row.original.id;

                return (
                    <CellContextMenu key={row.id} rowId={row.original.id}>
                        <div
                            data-index={virtualRow.index}
                            ref={(node) => rowVirtualizer.measureElement(node)}
                            className={cn(
                                "flex absolute w-full border-b items-center cursor-pointer transition-colors",
                                "hover:bg-muted/50",
                                row.original.id === selectedRowId && "bg-muted border-l-2 border-l-primary",
                                isRowCut && "opacity-50 border-dashed"
                            )}
                            style={{
                                transform: `translateY(${virtualRow.start}px)`,
                                height: `${virtualRow.size}px`
                            }}
                            onClick={() => openDetailPanel(row.original.id)}
                        >
                            {row.getVisibleCells().map((cell) => {
                                const colId = cell.column.id
                                const isFocused =
                                    focusedCell?.rowId === row.original.id &&
                                    focusedCell?.columnId === colId

                                return (
                                    <div
                                        key={cell.id}
                                        className={cn(
                                            "px-2 border-r h-full flex items-center relative",
                                            isFocused && "outline outline-2 outline-primary outline-offset-[-1px] z-10"
                                        )}
                                        style={{ width: cell.column.getSize() }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </div>
                                )
                            })}
                        </div>
                    </CellContextMenu>
                )
            })}
        </div>
    </div>
  )
}

interface EditableCellProps {
  rowId: string
  columnId: string
  initialValue: any
  onChange: (val: any) => void
  columnType?: string
  onFocus: (rowId: string, columnId: string) => void
  onBlur: () => void
  getCellStyle: (rowId: string, columnId: string) => any
}

function EditableCell({
  rowId,
  columnId,
  initialValue,
  onChange,
  columnType,
  onFocus,
  onBlur,
  getCellStyle,
}: EditableCellProps) {
    const [value, setValue] = React.useState(initialValue)

    // Sync from props if external change
    React.useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    const handleBlur = () => {
        if (value !== initialValue) {
            onChange(value)
        }
        onBlur()
    }

    const cellStyle = getCellStyle(rowId, columnId)
    const inputStyle: React.CSSProperties = {
        fontWeight: cellStyle.fontWeight === 'bold' ? 'bold' : 'normal',
        fontStyle: cellStyle.fontStyle === 'italic' ? 'italic' : 'normal',
        textDecoration: cellStyle.textDecoration === 'none' || !cellStyle.textDecoration
            ? 'none'
            : cellStyle.textDecoration,
        textAlign: cellStyle.textAlign || 'left',
        color: cellStyle.color || undefined,
        backgroundColor: cellStyle.backgroundColor || undefined,
        whiteSpace: cellStyle.wrap ? 'pre-wrap' : undefined,
    }

    if (columnType === 'CHECKBOX') {
        return (
            <input
                type="checkbox"
                aria-label={t('grid.edit_checkbox', 'Toggle checkbox')}
                className="h-4 w-4 cursor-pointer"
                checked={!!value}
                onChange={(e) => {
                    setValue(e.target.checked)
                    onChange(e.target.checked)
                }}
                onFocus={() => onFocus(rowId, columnId)}
                onBlur={onBlur}
            />
        )
    }

    if (columnType === 'NUMBER') {
        return (
            <input
                type="number"
                aria-label={t('grid.edit_number', 'Edit number value')}
                className="w-full h-full bg-transparent outline-none border-none p-1 text-right"
                style={inputStyle}
                value={value ?? ''}
                onChange={e => setValue(e.target.value === '' ? '' : Number(e.target.value))}
                onFocus={() => onFocus(rowId, columnId)}
                onBlur={handleBlur}
            />
        )
    }

    if (columnType === 'DATE') {
        return (
            <input
                type="date"
                aria-label={t('grid.edit_date', 'Edit date value')}
                className="w-full h-full bg-transparent outline-none border-none p-1"
                style={inputStyle}
                value={value ?? ''}
                onChange={e => {
                    setValue(e.target.value)
                    onChange(e.target.value)
                }}
                onFocus={() => onFocus(rowId, columnId)}
                onBlur={handleBlur}
            />
        )
    }

    return (
        <input
            aria-label={t('grid.edit_cell', 'Edit cell value')}
            className="w-full h-full bg-transparent outline-none border-none p-1"
            style={inputStyle}
            value={value ?? ''}
            onChange={e => setValue(e.target.value)}
            onFocus={() => onFocus(rowId, columnId)}
            onBlur={handleBlur}
        />
    )
}
