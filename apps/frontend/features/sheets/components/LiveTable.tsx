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
  Paperclip,
  History,
} from "lucide-react"

// Fixed width of the row-meta column (number + actions)
const ROW_META_WIDTH = 140

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
    isDetailPanelOpen,
    copiedRow,
    isCut,
    focusedCell,
    setFocusedCell,
    getCellStyle,
    getCellResult,
    updateColumnWidth,
    deleteRow,
    addRow,
    insertRowAbove,
    duplicateRow,
    clearRowCells,
    copyRow,
    cutRow,
    pasteRowAfter,
    selectedColumnId,
    setSelectedColumnId,
    selectedFormattingRowId,
    setSelectedFormattingRowId,
    collaborators,
  } = useSheet()

  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Build an O(1) lookup map: "rowId:columnId" -> list of collaborators focused there
  const collaboratorCellMap = useMemo(() => {
    const map = new Map<string, Array<{ name: string; color: string }>>()
    for (const collab of collaborators) {
      if (collab.focusedCell) {
        const key = `${collab.focusedCell.rowId}:${collab.focusedCell.columnId}`
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push({ name: collab.name, color: collab.color })
      }
    }
    return map
  }, [collaborators])

  const handleCellFocus = useCallback((rowId: string, columnId: string) => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current)
      blurTimerRef.current = null
    }
    setFocusedCell({ rowId, columnId })
    // Clicking into a cell clears bulk selections
    setSelectedColumnId(null)
    setSelectedFormattingRowId(null)
  }, [setFocusedCell, setSelectedColumnId, setSelectedFormattingRowId])

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
                const rawValue = getValue()
                const displayValue = typeof rawValue === 'string' && rawValue.startsWith('=')
                    ? getCellResult(row.original.id, col.id)
                    : rawValue
                return (
                    <EditableCell
                        rowId={row.original.id}
                        columnId={col.id}
                        initialValue={rawValue}
                        displayValue={displayValue}
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
    [columns, updateCell, handleCellFocus, handleCellBlur, getCellStyle, getCellResult]
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

  // Remeasure rows after the side panel opens/closes — the container width
  // changes during the panel animation, causing row heights to shift (text
  // wrapping changes) which leaves the virtualizer's cached positions stale.
  useEffect(() => {
    const timer = setTimeout(() => {
      rowVirtualizer.measure()
    }, 300)
    return () => clearTimeout(timer)
  }, [isDetailPanelOpen, rowVirtualizer])

  // Clear bulk column/row selection on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedColumnId(null)
        setSelectedFormattingRowId(null)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [setSelectedColumnId, setSelectedFormattingRowId])

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
                                 className={cn(
                                   "relative h-10 px-4 flex items-center font-medium text-muted-foreground border-r select-none cursor-pointer transition-colors",
                                   selectedColumnId === header.column.id
                                     ? "bg-primary/15 text-primary outline outline-2 outline-primary outline-offset-[-1px] z-10"
                                     : "hover:bg-muted/50"
                                 )}
                                 style={{ width: header.getSize() }}
                                 onClick={() => {
                                   setSelectedColumnId(
                                     selectedColumnId === header.column.id ? null : header.column.id
                                   )
                                   setSelectedFormattingRowId(null)
                                   setFocusedCell(null)
                                 }}>
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
                                row.original.id === selectedRowId && "bg-muted shadow-[inset_2px_0_0_hsl(var(--primary))]",
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
                                className={cn(
                                  "flex-none border-r flex items-center px-1.5 min-h-[40px] gap-0.5 transition-colors",
                                  selectedFormattingRowId === row.original.id
                                    ? "bg-primary/15 outline outline-2 outline-primary outline-offset-[-1px] z-10"
                                    : "bg-background/50"
                                )}
                                style={{ width: ROW_META_WIDTH }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Row number — click to select entire row for formatting */}
                                <span
                                  className={cn(
                                    "text-xs tabular-nums select-none w-5 text-right shrink-0 mr-0.5 cursor-pointer rounded px-0.5 hover:bg-primary/20 transition-colors",
                                    selectedFormattingRowId === row.original.id
                                      ? "text-primary font-semibold"
                                      : "text-muted-foreground"
                                  )}
                                  onClick={() => {
                                    const newId = selectedFormattingRowId === row.original.id ? null : row.original.id
                                    setSelectedFormattingRowId(newId)
                                    setSelectedColumnId(null)
                                    setFocusedCell(null)
                                  }}
                                >
                                    {virtualRow.index + 1}
                                </span>

                                {/* Hover-revealed action icons */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    <button
                                        className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
                                        onClick={() => openDetailPanel(row.original.id, 'chat')}
                                        aria-label="Open chat"
                                    >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
                                        onClick={() => openDetailPanel(row.original.id, 'files')}
                                        aria-label="Open files"
                                    >
                                        <Paperclip className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
                                        onClick={() => openDetailPanel(row.original.id, 'history')}
                                        aria-label="Open history"
                                    >
                                        <History className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Data cells */}
                            {row.getVisibleCells().map((cell) => {
                                const colId = cell.column.id
                                const isFocused =
                                    focusedCell?.rowId === row.original.id &&
                                    focusedCell?.columnId === colId
                                const isColSelected = selectedColumnId === colId
                                const isRowSelected = selectedFormattingRowId === row.original.id

                                return (
                                    <div
                                        key={cell.id}
                                        className={cn(
                                            "px-2 border-r flex items-center relative min-h-[40px] transition-colors",
                                            (isFocused || isColSelected || isRowSelected) && "outline outline-2 outline-primary outline-offset-[-1px] z-10",
                                            (isColSelected || isRowSelected) && "bg-primary/10"
                                        )}
                                        style={{ width: cell.column.getSize() }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        {/* Collaborator presence indicator */}
                                        {(() => {
                                          const cellKey = `${row.original.id}:${cell.column.id}`
                                          const collabs = collaboratorCellMap.get(cellKey)
                                          if (!collabs || collabs.length === 0) return null
                                          return (
                                            <div className="absolute top-0 right-0 flex pointer-events-none">
                                              {collabs.slice(0, 3).map((c, i) => (
                                                <div
                                                  key={i}
                                                  className="w-2 h-2 rounded-full border border-white -ml-0.5"
                                                  style={{ backgroundColor: c.color, zIndex: 10 - i }}
                                                  title={c.name}
                                                />
                                              ))}
                                            </div>
                                          )
                                        })()}
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
  /** When provided, shown while not editing (e.g. computed formula result). While editing, initialValue (the raw formula) is used. */
  displayValue?: any
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
  displayValue,
  onChange,
  columnType,
  onFocus,
  onBlur,
  getCellStyle,
}: EditableCellProps) {
    const [value, setValue] = React.useState(initialValue)
    const [isEditing, setIsEditing] = React.useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    React.useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    const handleBlur = () => {
        setIsEditing(false)
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
                className="w-full bg-transparent outline-none focus-visible:outline-none focus-visible:ring-0 border-none p-1 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
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

    // Determine what to display when the cell is not being edited.
    // If a displayValue is provided (e.g. a computed formula result), show that;
    // otherwise fall back to the raw value.
    const renderedDisplay = isEditing ? undefined : (displayValue !== undefined ? displayValue : value)

    // Text cell: use textarea when wrap is enabled so content can flow to multiple lines
    if (cellStyle.wrap) {
        return (
            <textarea
                ref={textareaRef}
                aria-label={t('grid.edit_cell', 'Edit cell value')}
                className="w-full bg-transparent outline-none focus-visible:outline-none focus-visible:ring-0 border-none p-1 resize-none overflow-hidden leading-normal"
                style={{ ...inputStyle, minHeight: '24px' }}
                value={isEditing ? (value ?? '') : (renderedDisplay ?? '')}
                rows={1}
                onChange={e => setValue(e.target.value)}
                onFocus={() => { setIsEditing(true); onFocus(rowId, columnId) }}
                onBlur={handleBlur}
            />
        )
    }

    return (
        <input
            aria-label={t('grid.edit_cell', 'Edit cell value')}
            className="w-full bg-transparent outline-none focus-visible:outline-none focus-visible:ring-0 border-none p-1"
            style={inputStyle}
            value={isEditing ? (value ?? '') : (renderedDisplay ?? '')}
            onChange={e => setValue(e.target.value)}
            onFocus={() => { setIsEditing(true); onFocus(rowId, columnId) }}
            onBlur={handleBlur}
        />
    )
}
