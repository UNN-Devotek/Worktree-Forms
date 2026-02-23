"use client"

import React, { useMemo, useRef, useCallback, useEffect } from "react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Trash2,
  CopyPlus,
  ArrowUp,
  ArrowDown,
  Scissors,
  Copy,
  ClipboardPaste,
  Eraser,
  MessageSquare,
} from "lucide-react"

// Fixed width of the row-meta column (number + actions)
const ROW_META_WIDTH = 64

interface LiveTableProps {
  documentId?: string
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
    deleteRow,
    addRow,
    insertRowAbove,
    duplicateRow,
    clearRowCells,
    copyRow,
    cutRow,
    pasteRowAfter,
  } = useSheet()

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
      const sizing = typeof updater === 'function'
        ? updater(table.getState().columnSizing)
        : updater
      Object.entries(sizing).forEach(([colId, width]) => {
        updateColumnWidth(colId, width as number)
      })
    },
  })

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
        <div className="sticky top-0 z-10 bg-background border-b w-full flex">
            {/* Row meta header (number + actions col) */}
            <div
                className="flex-none h-10 border-r bg-background"
                style={{ width: ROW_META_WIDTH }}
            />
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
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = table.getRowModel().rows[virtualRow.index]
                if (!row) return null

                const isRowCut = isCut && copiedRow?.id === row.original.id

                return (
                    <CellContextMenu key={row.id} rowId={row.original.id}>
                        <div
                            data-index={virtualRow.index}
                            ref={(node) => rowVirtualizer.measureElement(node)}
                            className={cn(
                                "flex absolute w-full border-b items-stretch cursor-pointer transition-colors group",
                                "hover:bg-muted/50",
                                row.original.id === selectedRowId && "bg-muted border-l-2 border-l-primary",
                                isRowCut && "opacity-50 border-dashed"
                            )}
                            style={{
                                transform: `translateY(${virtualRow.start}px)`,
                                minHeight: `${virtualRow.size}px`,
                            }}
                            onClick={() => openDetailPanel(row.original.id)}
                        >
                            {/* Row meta: number + actions */}
                            <div
                                className="flex-none border-r flex items-center justify-between px-1.5 min-h-[40px] gap-1 bg-background/50"
                                style={{ width: ROW_META_WIDTH }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span className="text-xs text-muted-foreground tabular-nums select-none w-5 text-right shrink-0">
                                    {virtualRow.index + 1}
                                </span>
                                <RowActionsMenu
                                    rowId={row.original.id}
                                    copiedRow={copiedRow}
                                    onCut={() => cutRow(row.original.id)}
                                    onCopy={() => copyRow(row.original.id)}
                                    onPaste={() => pasteRowAfter(row.original.id)}
                                    onClear={() => clearRowCells(row.original.id)}
                                    onInsertAbove={() => insertRowAbove(row.original.id)}
                                    onInsertBelow={() => addRow({ id: crypto.randomUUID(), parentId: null }, row.original.id)}
                                    onDelete={() => deleteRow(row.original.id)}
                                    onDuplicate={() => duplicateRow(row.original.id)}
                                    onComment={() => openDetailPanel(row.original.id)}
                                />
                            </div>

                            {/* Data cells */}
                            {row.getVisibleCells().map((cell) => {
                                const colId = cell.column.id
                                const isFocused =
                                    focusedCell?.rowId === row.original.id &&
                                    focusedCell?.columnId === colId

                                return (
                                    <div
                                        key={cell.id}
                                        className={cn(
                                            "px-2 border-r flex items-center relative min-h-[40px]",
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

// ---------------------------------------------------------------------------
// Row actions dropdown
// ---------------------------------------------------------------------------

interface RowActionsMenuProps {
  rowId: string
  copiedRow: any
  onCut: () => void
  onCopy: () => void
  onPaste: () => void
  onClear: () => void
  onInsertAbove: () => void
  onInsertBelow: () => void
  onDelete: () => void
  onDuplicate: () => void
  onComment: () => void
}

function RowActionsMenu({
  copiedRow,
  onCut, onCopy, onPaste, onClear,
  onInsertAbove, onInsertBelow, onDelete, onDuplicate, onComment,
}: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "h-6 w-6 rounded flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-muted text-muted-foreground hover:text-foreground",
          )}
          onClick={(e) => e.stopPropagation()}
          aria-label="Row actions"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuItem onSelect={onCut}>
          <Scissors className="mr-2 h-4 w-4" /> Cut
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onCopy}>
          <Copy className="mr-2 h-4 w-4" /> Copy
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onPaste} disabled={copiedRow === null}>
          <ClipboardPaste className="mr-2 h-4 w-4" /> Paste
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onClear}>
          <Eraser className="mr-2 h-4 w-4" /> Clear Contents
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onInsertAbove}>
          <ArrowUp className="mr-2 h-4 w-4" /> Insert Row Above
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onInsertBelow}>
          <ArrowDown className="mr-2 h-4 w-4" /> Insert Row Below
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}>
          <CopyPlus className="mr-2 h-4 w-4" /> Duplicate Row
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onComment}>
          <MessageSquare className="mr-2 h-4 w-4" /> Add Comment...
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={onDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete Row
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ---------------------------------------------------------------------------
// EditableCell
// ---------------------------------------------------------------------------

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
    const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    }

    // Auto-resize textarea when value or wrap state changes
    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${el.scrollHeight}px`
    }, [value, cellStyle.wrap])

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
                className="w-full bg-transparent outline-none focus-visible:outline-none focus-visible:ring-0 border-none p-1 text-right"
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
                className="w-full bg-transparent outline-none focus-visible:outline-none focus-visible:ring-0 border-none p-1"
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

    // Text cell: use textarea when wrap is enabled so content can flow to multiple lines
    if (cellStyle.wrap) {
        return (
            <textarea
                ref={textareaRef}
                aria-label={t('grid.edit_cell', 'Edit cell value')}
                className="w-full bg-transparent outline-none focus-visible:outline-none focus-visible:ring-0 border-none p-1 resize-none overflow-hidden leading-normal"
                style={{ ...inputStyle, minHeight: '24px' }}
                value={value ?? ''}
                rows={1}
                onChange={e => setValue(e.target.value)}
                onFocus={() => onFocus(rowId, columnId)}
                onBlur={handleBlur}
            />
        )
    }

    return (
        <input
            aria-label={t('grid.edit_cell', 'Edit cell value')}
            className="w-full bg-transparent outline-none focus-visible:outline-none focus-visible:ring-0 border-none p-1"
            style={inputStyle}
            value={value ?? ''}
            onChange={e => setValue(e.target.value)}
            onFocus={() => onFocus(rowId, columnId)}
            onBlur={handleBlur}
        />
    )
}
