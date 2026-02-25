"use client"

import React, { useMemo, useRef, useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { HyperFormula } from "hyperformula"
import { detectActiveSignature, FUNCTION_SIGNATURES } from '../utils/formula-signatures'
import { cn as _cn } from "@/lib/utils"
import { t } from "@/lib/i18n"

// Loaded once at module level — same list as FormulaBar
const FORMULA_FUNCTIONS = HyperFormula.getRegisteredFunctionNames('enGB')
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
  MessageSquare,
  Paperclip,
  History,
  ChevronDown,
  Check as CheckIcon,
} from "lucide-react"
import { AddRowIcon, AddColumnIcon } from "./icons/SheetIcons"
import { AddColumnDialog } from "./controls/ColumnManagerDialog"

// Fixed width of the row-meta column (number + actions)
const ROW_META_WIDTH = 128

// ---------------------------------------------------------------------------
// Cell reference helpers for formula editing
// ---------------------------------------------------------------------------

function colIndexToLetter(idx: number): string {
  return String.fromCharCode(65 + idx)
}

function cellRef(rowIndex: number, colIndex: number): string {
  return `${colIndexToLetter(colIndex)}${rowIndex + 1}`
}

function rangeRef(r1: number, c1: number, r2: number, c2: number): string {
  const minR = Math.min(r1, r2), maxR = Math.max(r1, r2)
  const minC = Math.min(c1, c2), maxC = Math.max(c1, c2)
  if (minR === maxR && minC === maxC) return cellRef(minR, minC)
  return `${cellRef(minR, minC)}:${cellRef(maxR, maxC)}`
}

interface DragState {
  startRowIndex: number
  startColIndex: number
  endRowIndex: number
  endColIndex: number
}

interface LiveTableProps {
  documentId?: string
  containerClassName?: string
}

export function LiveTable({ containerClassName }: LiveTableProps) {
  const [addColumnOpen, setAddColumnOpen] = useState(false)
  // Only one dropdown cell can be open at a time — key is `rowId:columnId`
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null)

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
    setEditingCell,
    getCellStyle,
    getCellResult,
    cellsRevision,
    updateColumnWidth,
    deleteRow,
    addRow,
    selectedColumnIds,
    setSelectedColumnIds,
    selectedFormattingRowIds,
    setSelectedFormattingRowIds,
    collaborators,
    isFormulaEditing,
    insertCellRefCallback,
    doc,
  } = useSheet()

  // Track comment/file counts per row for blue icon indicators
  const [rowMetaCounts, setRowMetaCounts] = useState<Map<string, { comments: number; files: number }>>(new Map())

  useEffect(() => {
    if (!doc || data.length === 0) return

    const rebuild = () => {
      const next = new Map<string, { comments: number; files: number }>()
      for (const row of data) {
        const comments = doc.getArray(`row-${row.id}-messages`).length
        const files = doc.getArray(`row-${row.id}-files`).length
        if (comments > 0 || files > 0) next.set(row.id, { comments, files })
      }
      setRowMetaCounts(next)
    }

    rebuild()

    // Observe all row meta arrays so counts update live
    const observers: Array<{ arr: any; fn: () => void }> = []
    for (const row of data) {
      const msgArr = doc.getArray(`row-${row.id}-messages`)
      const fileArr = doc.getArray(`row-${row.id}-files`)
      const fn = () => rebuild()
      msgArr.observe(fn)
      fileArr.observe(fn)
      observers.push({ arr: msgArr, fn }, { arr: fileArr, fn })
    }

    return () => {
      for (const { arr, fn } of observers) arr.unobserve(fn)
    }
  }, [doc, data])

  const [refDragState, setRefDragState] = useState<DragState | null>(null)

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
    // Close any open dropdown when focusing a different cell
    setOpenDropdownKey(prev => {
      if (prev && prev !== `${rowId}:${columnId}`) return null
      return prev
    })
    // Clicking into a cell clears bulk selections
    setSelectedColumnIds(new Set())
    setSelectedFormattingRowIds(new Set())
  }, [setFocusedCell, setSelectedColumnIds, setSelectedFormattingRowIds, setOpenDropdownKey])

  const handleCellBlur = useCallback(() => {
    blurTimerRef.current = setTimeout(() => {
      // Keep focusedCell alive if the user clicked into the formula bar
      if (document.activeElement?.closest('[data-formula-bar]')) return
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
                const dropdownKey = `${row.original.id}:${col.id}`
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
                        dropdownOptions={col.options}
                        restrictToList={col.restrictToList}
                        allowMultiple={col.allowMultiple}
                        dropdownKey={dropdownKey}
                        openDropdownKey={openDropdownKey}
                        setOpenDropdownKey={setOpenDropdownKey}
                    />
                )
            }
        }))
    },
    [columns, updateCell, handleCellFocus, handleCellBlur, getCellStyle, getCellResult, cellsRevision, openDropdownKey, setOpenDropdownKey]
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
        setSelectedColumnIds(new Set())
        setSelectedFormattingRowIds(new Set())
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [setSelectedColumnIds, setSelectedFormattingRowIds])

  // Clear ref drag state when mouse is released outside the grid
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (!isFormulaEditing) setRefDragState(null)
    }
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isFormulaEditing])

  // Grid-level keyboard handler: fires when a cell is focused but NOT in text-edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedCell) return
      const active = document.activeElement
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return
      if (active?.closest('[role="dialog"], [role="menu"], [data-radix-popper-content-wrapper]')) return

      const visibleCols = columns.filter((c: any) => !c.hidden)
      const rowIndex = data.findIndex((r: any) => r.id === focusedCell.rowId)
      const colIndex = visibleCols.findIndex((c: any) => c.id === focusedCell.columnId)

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        updateCell(focusedCell.rowId, focusedCell.columnId, '')
        return
      }
      if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault()
        setEditingCell({ rowId: focusedCell.rowId, columnId: focusedCell.columnId })
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setFocusedCell(null)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (rowIndex > 0) setFocusedCell({ rowId: data[rowIndex - 1].id, columnId: focusedCell.columnId })
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (rowIndex < data.length - 1) setFocusedCell({ rowId: data[rowIndex + 1].id, columnId: focusedCell.columnId })
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (colIndex > 0) setFocusedCell({ rowId: focusedCell.rowId, columnId: visibleCols[colIndex - 1].id })
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (colIndex < visibleCols.length - 1) setFocusedCell({ rowId: focusedCell.rowId, columnId: visibleCols[colIndex + 1].id })
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) {
          if (colIndex > 0) setFocusedCell({ rowId: focusedCell.rowId, columnId: visibleCols[colIndex - 1].id })
        } else {
          if (colIndex < visibleCols.length - 1) setFocusedCell({ rowId: focusedCell.rowId, columnId: visibleCols[colIndex + 1].id })
        }
        return
      }
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault()
        const row = data.find((r: any) => r.id === focusedCell.rowId)
        const val = row?.[focusedCell.columnId] ?? ''
        navigator.clipboard.writeText(String(val)).catch(() => {})
        return
      }
      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault()
        const row = data.find((r: any) => r.id === focusedCell.rowId)
        const val = row?.[focusedCell.columnId] ?? ''
        navigator.clipboard.writeText(String(val)).catch(() => {})
        updateCell(focusedCell.rowId, focusedCell.columnId, '')
        return
      }
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault()
        navigator.clipboard.readText().then(text => {
          updateCell(focusedCell.rowId, focusedCell.columnId, text)
        }).catch(() => {})
        return
      }
      // Printable character: start editing with that character as the initial value
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setEditingCell({ rowId: focusedCell.rowId, columnId: focusedCell.columnId, initialValue: e.key })
        return
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [focusedCell, data, columns, updateCell, setFocusedCell, setEditingCell])

  return (
    <>
    <div ref={parentRef} className={cn("h-full w-full overflow-auto border border-table-border bg-table-canvas relative", containerClassName)}>
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-table-header w-full flex">
            {/* Row meta header (number + actions col) */}
            <div
                className={cn(
                  "flex-none h-10 border-r-2 border-b border-table-row-actions-border transition-colors",
                  selectedFormattingRowIds.size > 0 || selectedColumnIds.size > 0
                    ? "bg-primary/15"
                    : "bg-table-row-actions"
                )}
                style={{ width: ROW_META_WIDTH }}
            />
            {table.getHeaderGroups().map((headerGroup) => (
                <div key={headerGroup.id} className="flex">
                    {headerGroup.headers.map((header) => {
                        const colData = columns.find((c: any) => c.id === header.column.id) ?? { id: header.column.id, label: '', type: 'TEXT' };
                        const firstRowId = data[0]?.id
                        const headerHAlign = (firstRowId ? getCellStyle(firstRowId, header.column.id).textAlign : null) || 'left'
                        return (
                        <ColumnContextMenu key={header.id} columnId={header.column.id} column={colData}>
                            <div
                                 className={cn(
                                   "relative h-10 px-4 flex items-center font-medium text-table-header-fg border-r border-b border-table-border select-none cursor-pointer transition-colors",
                                   headerHAlign === 'center' ? 'justify-center' :
                                   headerHAlign === 'right'  ? 'justify-end'    : '',
                                   selectedColumnIds.has(header.column.id)
                                     ? "bg-primary/15 text-primary z-20 border-b-transparent"
                                     : focusedCell?.columnId === header.column.id
                                       ? "bg-primary/10 hover:bg-table-row-hover"
                                       : "hover:bg-table-row-hover"
                                 )}
                                 style={{
                                   width: header.getSize(),
                                   textAlign: headerHAlign as React.CSSProperties['textAlign'],
                                   ...(selectedColumnIds.has(header.column.id) ? {
                                     boxShadow: [
                                       'inset 2px 0 0 var(--primary)',
                                       'inset -2px 0 0 var(--primary)',
                                       'inset 0 2px 0 var(--primary)',
                                     ].join(', '),
                                   } : {}),
                                 }}
                                 onClick={(e) => {
                                   const colId = header.column.id
                                   if (e.ctrlKey || e.metaKey) {
                                     setSelectedColumnIds(prev => {
                                       const next = new Set(prev)
                                       if (next.has(colId)) next.delete(colId); else next.add(colId)
                                       return next
                                     })
                                   } else {
                                     setSelectedColumnIds(
                                       selectedColumnIds.has(colId) && selectedColumnIds.size === 1
                                         ? new Set() : new Set([colId])
                                     )
                                   }
                                   setSelectedFormattingRowIds(new Set())
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
                        );
                    })}
                    {/* Add Column symbol */}
                    <button
                        className="h-10 w-10 flex items-center justify-center text-table-header-fg hover:text-foreground hover:bg-table-row-hover transition-colors shrink-0 border-r border-b border-table-border"
                        onClick={() => setAddColumnOpen(true)}
                        title="Add column"
                        aria-label="Add column"
                    >
                        <AddColumnIcon className="h-4 w-4" />
                    </button>
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
                                "flex absolute w-full border-b border-table-border items-stretch cursor-pointer transition-colors group bg-table-canvas",
                                // Suppress hover on the actively-open row so the `:hover` pseudo-class
                                // doesn't override the selected background after the panel opens.
                                row.original.id === selectedRowId && isDetailPanelOpen
                                  ? "bg-table-row-selected shadow-[inset_2px_0_0_var(--primary)]"
                                  : cn("hover:bg-table-row-hover", row.original.id === selectedRowId && "bg-table-row-selected shadow-[inset_2px_0_0_var(--primary)]"),
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
                                  "flex-none border-r-2 border-b border-table-row-actions-border flex items-center px-2 min-h-[40px] gap-2 transition-colors",
                                  selectedFormattingRowIds.has(row.original.id)
                                    ? "bg-table-row-actions z-10"
                                    : "bg-table-row-actions group-hover:bg-table-row-hover"
                                )}
                                style={{
                                  width: ROW_META_WIDTH,
                                  ...(selectedFormattingRowIds.has(row.original.id) ? {
                                    borderRightWidth: 0,
                                    boxShadow: [
                                      'inset 0 2px 0 var(--primary)',
                                      'inset 0 -2px 0 var(--primary)',
                                      'inset 2px 0 0 var(--primary)',
                                    ].join(', '),
                                  } : {}),
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Row number — click to select entire row for formatting */}
                                <span
                                  className={cn(
                                    "text-sm tabular-nums select-none w-7 text-right shrink-0 cursor-pointer rounded px-0.5 hover:bg-primary/20 transition-colors leading-none self-center",
                                    selectedFormattingRowIds.has(row.original.id)
                                      ? "text-primary font-semibold"
                                      : "text-muted-foreground"
                                  )}
                                  onClick={(e) => {
                                    const rowId = row.original.id
                                    if (e.ctrlKey || e.metaKey) {
                                      setSelectedFormattingRowIds(prev => {
                                        const next = new Set(prev)
                                        if (next.has(rowId)) next.delete(rowId); else next.add(rowId)
                                        return next
                                      })
                                    } else {
                                      setSelectedFormattingRowIds(
                                        selectedFormattingRowIds.has(rowId) && selectedFormattingRowIds.size === 1
                                          ? new Set() : new Set([rowId])
                                      )
                                    }
                                    setSelectedColumnIds(new Set())
                                    setFocusedCell(null)
                                  }}
                                >
                                    {virtualRow.index + 1}
                                </span>

                                {/* Hover-revealed action icons */}
                                {(() => {
                                    const meta = rowMetaCounts.get(row.original.id)
                                    const hasComments = (meta?.comments ?? 0) > 0
                                    const hasFiles = (meta?.files ?? 0) > 0
                                    return (
                                        <div className={cn("flex items-center gap-px transition-opacity self-center", (hasComments || hasFiles) ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                                            <button
                                                className={cn("h-6 w-6 rounded flex items-center justify-center hover:bg-muted transition-colors", hasComments ? "text-blue-500" : "text-muted-foreground hover:text-foreground")}
                                                onClick={() => openDetailPanel(row.original.id, 'chat')}
                                                aria-label="Open chat"
                                            >
                                                <MessageSquare className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                className={cn("h-6 w-6 rounded flex items-center justify-center hover:bg-muted transition-colors", hasFiles ? "text-blue-500" : "text-muted-foreground hover:text-foreground")}
                                                onClick={() => openDetailPanel(row.original.id, 'files')}
                                                aria-label="Open files"
                                            >
                                                <Paperclip className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={() => openDetailPanel(row.original.id, 'history')}
                                                aria-label="Open history"
                                            >
                                                <History className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* Data cells */}
                            {(() => {
                                const visibleCols = columns.filter((c: any) => !c.hidden)
                                return row.getVisibleCells().map((cell) => {
                                    const colId = cell.column.id
                                    const colIndex = visibleCols.findIndex((c: any) => c.id === colId)
                                    const isFocused =
                                        focusedCell?.rowId === row.original.id &&
                                        focusedCell?.columnId === colId
                                    const isColSelected = selectedColumnIds.has(colId)
                                    const isRowSelected = selectedFormattingRowIds.has(row.original.id)

                                    const isInRefDrag = isFormulaEditing && refDragState !== null && (() => {
                                        const minR = Math.min(refDragState.startRowIndex, refDragState.endRowIndex)
                                        const maxR = Math.max(refDragState.startRowIndex, refDragState.endRowIndex)
                                        const minC = Math.min(refDragState.startColIndex, refDragState.endColIndex)
                                        const maxC = Math.max(refDragState.startColIndex, refDragState.endColIndex)
                                        return virtualRow.index >= minR && virtualRow.index <= maxR &&
                                               colIndex >= minC && colIndex <= maxC
                                    })()

                                    const thisCellStyle = getCellStyle(row.original.id, colId)
                                    const cellVAlign = thisCellStyle.verticalAlign || 'middle'
                                    const cellHAlign = thisCellStyle.textAlign || 'left'

                                    const isFirstRow = virtualRow.index === 0
                                    const isLastRow  = virtualRow.index === data.length - 1
                                    const isFirstCol = colIndex === 0
                                    const isLastCol  = colIndex === visibleCols.length - 1

                                    // Build perimeter-only selection borders using inset box-shadow.
                                    // box-shadow doesn't conflict with Tailwind border classes and
                                    // var(--primary) is a complete oklch() value (not raw hsl channels).
                                    const selectionShadow = (() => {
                                        if (isFocused || isInRefDrag) return undefined
                                        const c = 'var(--primary)'
                                        const w = 2 // border width in px
                                        if (isColSelected) {
                                            const shadows = [
                                                `inset ${w}px 0 0 ${c}`,   // left
                                                `inset -${w}px 0 0 ${c}`,  // right
                                            ]
                                            // No top on first row — header cell flows into it
                                            if (isLastRow)  shadows.push(`inset 0 -${w}px 0 ${c}`)  // bottom
                                            return shadows.join(', ')
                                        }
                                        if (isRowSelected) {
                                            const shadows = [
                                                `inset 0 ${w}px 0 ${c}`,   // top
                                                `inset 0 -${w}px 0 ${c}`,  // bottom
                                            ]
                                            // No left on first col — row actions cell flows into it
                                            if (isLastCol)  shadows.push(`inset -${w}px 0 0 ${c}`)  // right
                                            return shadows.join(', ')
                                        }
                                        return undefined
                                    })()

                                    return (
                                        <div
                                            key={cell.id}
                                            className={cn(
                                                "px-2 border-r border-table-border flex relative min-h-[40px] transition-colors",
                                                cellVAlign === 'top'    ? 'items-start pt-1'  :
                                                cellVAlign === 'bottom' ? 'items-end pb-1'    :
                                                                           'items-center',
                                                cellHAlign === 'center' ? 'justify-center' :
                                                cellHAlign === 'right'  ? 'justify-end'    : '',
                                                isFocused && "outline outline-2 outline-primary outline-offset-[-1px] z-10",
                                                (isColSelected || isRowSelected) && "bg-primary/15 z-[1]",
                                                isInRefDrag && "bg-blue-200/50 outline outline-2 outline-blue-400",
                                                isFormulaEditing && "cursor-crosshair"
                                            )}
                                            style={{ width: cell.column.getSize(), textAlign: cellHAlign as React.CSSProperties['textAlign'], boxShadow: selectionShadow }}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (!isFormulaEditing) {
                                                    handleCellFocus(row.original.id, colId)
                                                }
                                            }}
                                            onMouseDown={(e) => {
                                                if (isFormulaEditing) {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setRefDragState({
                                                        startRowIndex: virtualRow.index,
                                                        startColIndex: colIndex,
                                                        endRowIndex: virtualRow.index,
                                                        endColIndex: colIndex,
                                                    })
                                                } else {
                                                    e.stopPropagation()
                                                }
                                            }}
                                            onMouseEnter={() => {
                                                if (isFormulaEditing && refDragState) {
                                                    setRefDragState(prev => prev
                                                        ? { ...prev, endRowIndex: virtualRow.index, endColIndex: colIndex }
                                                        : null
                                                    )
                                                }
                                            }}
                                            onMouseUp={(e) => {
                                                if (isFormulaEditing && refDragState) {
                                                    e.preventDefault()
                                                    const refStr = rangeRef(
                                                        refDragState.startRowIndex,
                                                        refDragState.startColIndex,
                                                        refDragState.endRowIndex,
                                                        refDragState.endColIndex,
                                                    )
                                                    insertCellRefCallback.current?.(refStr)
                                                    setRefDragState(null)
                                                }
                                            }}
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
                                })
                            })()}
                        </div>
                    </CellContextMenu>
                )
            })}
        </div>

        {/* Add Row symbol — sits below all virtualized rows */}
        <button
            className="flex items-center gap-1.5 px-3 h-9 w-full text-xs text-table-header-fg hover:text-foreground hover:bg-table-row-hover transition-colors border-b border-table-border sticky left-0"
            style={{ paddingLeft: `${ROW_META_WIDTH / 2 - 8}px` }}
            onClick={() => addRow({ id: crypto.randomUUID(), parentId: null })}
            aria-label="Add row"
        >
            <AddRowIcon className="h-3.5 w-3.5" />
        </button>
    </div>

    <AddColumnDialog open={addColumnOpen} onOpenChange={setAddColumnOpen} />
    </>
  )
}


// ---------------------------------------------------------------------------
// Image / Link cell helpers
// ---------------------------------------------------------------------------

interface ImageCellData { url: string; width: number; height: number }
interface LinkCellData  { url: string; text: string }

function parseImageValue(v: string): ImageCellData | null {
  if (!v.startsWith('__img__')) return null
  try { return JSON.parse(v.slice(7)) as ImageCellData } catch { return null }
}

function parseLinkValue(v: string): LinkCellData | null {
  if (!v.startsWith('__link__')) return null
  try { return JSON.parse(v.slice(8)) as LinkCellData } catch { return null }
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
  /** DROPDOWN column props */
  dropdownOptions?: string[]
  restrictToList?: boolean
  allowMultiple?: boolean
  /** Singleton dropdown control — only one open at a time */
  dropdownKey?: string
  openDropdownKey?: string | null
  setOpenDropdownKey?: (key: string | null) => void
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
  dropdownOptions,
  restrictToList,
  allowMultiple,
  dropdownKey,
  openDropdownKey,
  setOpenDropdownKey,
}: EditableCellProps) {
    const { setIsFormulaEditing, insertCellRefCallback, editingCell, setEditingCell, updateColumnWidth } = useSheet()
    const [value, setValue] = React.useState(initialValue)
    const [isEditing, setIsEditing] = React.useState(false)
    const [autocompleteMatches, setAutocompleteMatches] = useState<string[]>([])
    const [activeIndex, setActiveIndex] = useState(-1)
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)
    const [signatureInfo, setSignatureInfo] = useState<{ fnName: string; argIndex: number } | null>(null)
    const [signaturePos, setSignaturePos] = useState<{ top: number; left: number } | null>(null)
    const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    // Keep a ref so the insertCellRefCallback closure is never stale
    const valueRef = useRef<any>(initialValue)
    // DROPDOWN cell state
    const [ddOpen, _setDdOpen] = useState(false)
    const [ddFilter, setDdFilter] = useState('')
    const [ddMenuPos, setDdMenuPos] = useState<{ top: number; left: number; width: number } | null>(null)
    const cellDivRef = useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        setValue(initialValue)
        valueRef.current = initialValue
    }, [initialValue])

    // Enter edit mode when editingCell context points at this cell
    useEffect(() => {
        if (editingCell?.rowId === rowId && editingCell?.columnId === columnId) {
            setIsEditing(true)
            if (editingCell.initialValue !== undefined) {
                setValue(editingCell.initialValue)
                valueRef.current = editingCell.initialValue
            }
            requestAnimationFrame(() => {
                const el = inputRef.current || textareaRef.current
                if (!el) return
                el.focus()
                if (editingCell.initialValue !== undefined) {
                    const len = editingCell.initialValue.length
                    el.setSelectionRange(len, len)
                } else {
                    el.select()
                }
            })
        }
    }, [editingCell, rowId, columnId])

    /** Append closing parens to balance any unclosed ones in a formula */
    const autoClose = (v: any): any => {
        if (typeof v !== 'string' || !v.startsWith('=')) return v
        const open = (v.match(/\(/g) || []).length
        const close = (v.match(/\)/g) || []).length
        const missing = open - close
        return missing > 0 ? v + ')'.repeat(missing) : v
    }

    /** Activate formula-editing mode and register the ref-insertion callback */
    const activateFormulaMode = (el: HTMLInputElement | HTMLTextAreaElement | null) => {
        setIsFormulaEditing(true)
        insertCellRefCallback.current = (ref: string) => {
            if (!el) return
            const pos = (el as HTMLInputElement).selectionStart ?? String(valueRef.current ?? '').length
            const v = String(valueRef.current ?? '')
            const newVal = v.slice(0, pos) + ref + v.slice(pos)
            valueRef.current = newVal
            setValue(newVal)
            requestAnimationFrame(() => {
                el.focus();
                (el as HTMLInputElement).setSelectionRange(pos + ref.length, pos + ref.length)
            })
        }
    }

    const computeAutocomplete = (v: string, cursorPos: number) => {
        if (!v.startsWith('=')) { setAutocompleteMatches([]); return }
        const textToCursor = v.slice(0, cursorPos)
        const lastDelim = Math.max(
            textToCursor.lastIndexOf('='),
            textToCursor.lastIndexOf('('),
            textToCursor.lastIndexOf(','),
            textToCursor.lastIndexOf(' '),
        )
        const token = textToCursor.slice(lastDelim + 1).replace(/^[^a-zA-Z]+/, '')
        if (token.length < 1) { setAutocompleteMatches([]); return }
        const matches = FORMULA_FUNCTIONS.filter(fn => fn.startsWith(token.toUpperCase())).slice(0, 10)
        setAutocompleteMatches(matches)
        setActiveIndex(-1)
    }

    const computeSignature = (v: string, cursorPos: number) => {
        setSignatureInfo(detectActiveSignature(v, cursorPos))
    }

    const handleSelect = (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target as HTMLInputElement
        computeSignature(target.value, target.selectionStart ?? target.value.length)
    }

    const insertFunction = (fnName: string) => {
        const el = (inputRef.current || textareaRef.current) as HTMLInputElement | null
        const pos = el?.selectionStart ?? String(valueRef.current ?? '').length
        const v = String(valueRef.current ?? '')
        const textToCursor = v.slice(0, pos)
        const lastDelim = Math.max(
            textToCursor.lastIndexOf('='),
            textToCursor.lastIndexOf('('),
            textToCursor.lastIndexOf(','),
            textToCursor.lastIndexOf(' '),
        )
        const rawStart = lastDelim + 1
        const leadingNonAlpha = textToCursor.slice(rawStart).match(/^[^a-zA-Z]*/)?.[0].length ?? 0
        const tokenStart = rawStart + leadingNonAlpha
        const insertion = fnName + '('
        const newVal = v.slice(0, tokenStart) + insertion + v.slice(pos)
        valueRef.current = newVal
        setValue(newVal)
        setAutocompleteMatches([])
        setActiveIndex(-1)
        const newCursor = tokenStart + insertion.length
        requestAnimationFrame(() => {
            if (el) { el.focus(); el.setSelectionRange(newCursor, newCursor) }
        })
    }

    const handleBlur = () => {
        setIsEditing(false)
        setEditingCell(null)
        setIsFormulaEditing(false)
        insertCellRefCallback.current = null
        setAutocompleteMatches([])
        setActiveIndex(-1)
        setSignatureInfo(null)
        const committed = autoClose(value)
        if (committed !== initialValue) {
            onChange(committed)
        }
        onBlur()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // Autocomplete navigation
        if (autocompleteMatches.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex(prev => Math.min(prev + 1, autocompleteMatches.length - 1))
                return
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex(prev => Math.max(prev - 1, -1))
                return
            }
            if ((e.key === 'Enter' || e.key === 'Tab') && activeIndex >= 0) {
                e.preventDefault()
                insertFunction(autocompleteMatches[activeIndex])
                return
            }
            if (e.key === 'Escape') {
                e.preventDefault()
                setAutocompleteMatches([])
                setActiveIndex(-1)
                return
            }
        }
        if (e.key === 'Enter') {
            e.preventDefault()
            const committed = autoClose(value)
            if (committed !== initialValue) onChange(committed)
            setIsEditing(false)
            setEditingCell(null)
            setIsFormulaEditing(false)
            insertCellRefCallback.current = null
            setAutocompleteMatches([])
            setSignatureInfo(null)
            ;(e.target as HTMLElement).blur()
        }
        if (e.key === 'Escape') {
            setValue(initialValue)
            valueRef.current = initialValue
            setIsEditing(false)
            setEditingCell(null)
            setIsFormulaEditing(false)
            insertCellRefCallback.current = null
            setAutocompleteMatches([])
            setSignatureInfo(null)
            ;(e.target as HTMLElement).blur()
        }
        e.stopPropagation()
    }

    const cellStyle = getCellStyle(rowId, columnId)
    const inputStyle: React.CSSProperties = {
        fontWeight: cellStyle.fontWeight === 'bold' ? 'bold' : 'normal',
        fontStyle: cellStyle.fontStyle === 'italic' ? 'italic' : 'normal',
        textDecoration: cellStyle.textDecoration === 'none' || !cellStyle.textDecoration
            ? 'none'
            : cellStyle.textDecoration,
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

    // Compute fixed-position coordinates for the autocomplete portal
    const showDropdown = autocompleteMatches.length > 0
    useEffect(() => {
        if (!showDropdown) { setDropdownPos(null); return }
        const el = (inputRef.current || textareaRef.current) as HTMLElement | null
        if (!el) return
        const rect = el.getBoundingClientRect()
        setDropdownPos({ top: rect.bottom + 2, left: rect.left, width: Math.max(rect.width, 224) })
    }, [showDropdown, autocompleteMatches])

    // Signature tooltip: only show when autocomplete is not open
    const showSignature = signatureInfo !== null && !showDropdown
    useEffect(() => {
        if (!showSignature) { setSignaturePos(null); return }
        const el = (inputRef.current || textareaRef.current) as HTMLElement | null
        if (!el) return
        const rect = el.getBoundingClientRect()
        setSignaturePos({ top: rect.bottom + 2, left: rect.left })
    }, [showSignature, signatureInfo])

    // Position the dropdown menu portal when it opens.
    // For DROPDOWN column type, use the singleton openDropdownKey; otherwise the local ddOpen (unused).
    const isThisDdOpen = columnType === 'DROPDOWN' ? openDropdownKey === dropdownKey : ddOpen
    useEffect(() => {
        if (!isThisDdOpen || !cellDivRef.current) { setDdMenuPos(null); return }
        const rect = cellDivRef.current.getBoundingClientRect()
        setDdMenuPos({ top: rect.bottom + 1, left: rect.left, width: Math.max(rect.width, 200) })
    }, [isThisDdOpen])

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

    if (columnType === 'DROPDOWN') {
        const options = dropdownOptions ?? []
        const openDd = () => setOpenDropdownKey?.(dropdownKey ?? null)
        const closeDd = () => setOpenDropdownKey?.(null)

        // Parse the stored value into an array of selected items
        let selectedValues: string[] = []
        if (allowMultiple) {
            try { selectedValues = value ? JSON.parse(value) : [] }
            catch { selectedValues = value ? String(value).split(',').map((s: string) => s.trim()).filter(Boolean) : [] }
        } else {
            selectedValues = value != null && value !== '' ? [String(value)] : []
        }

        const displayText = selectedValues.join(', ')
        const filteredOptions = options.filter(o =>
            o.toLowerCase().includes(ddFilter.toLowerCase())
        )

        const handleSelect = (option: string) => {
            if (allowMultiple) {
                const next = selectedValues.includes(option)
                    ? selectedValues.filter((v: string) => v !== option)
                    : [...selectedValues, option]
                const stored = JSON.stringify(next)
                setValue(stored)
                onChange(stored)
            } else {
                setValue(option)
                onChange(option)
                closeDd()
                setDdFilter('')
                onBlur()
            }
        }

        const handleFreeInput = (inputVal: string) => {
            if (!inputVal.trim()) return
            if (allowMultiple) {
                const next = [...selectedValues, inputVal.trim()]
                const stored = JSON.stringify(next)
                setValue(stored)
                onChange(stored)
            } else {
                setValue(inputVal.trim())
                onChange(inputVal.trim())
                closeDd()
            }
            setDdFilter('')
        }

        const closeDropdown = () => {
            closeDd()
            setDdFilter('')
            onBlur()
        }

        return (
            <>
                <div
                    ref={cellDivRef}
                    className="w-full h-full min-h-[24px] px-1 flex items-center gap-1 group select-none relative"
                    style={inputStyle}
                    tabIndex={0}
                    onClick={() => onFocus(rowId, columnId)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isThisDdOpen ? closeDd() : openDd() }
                        if (e.key === 'Escape') closeDropdown()
                        e.stopPropagation()
                    }}
                    onFocus={() => onFocus(rowId, columnId)}
                >
                    <span className="flex-1 truncate text-sm">{displayText}</span>
                    <button
                        type="button"
                        className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); isThisDdOpen ? closeDd() : openDd() }}
                        tabIndex={-1}
                    >
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </button>
                </div>

                {isThisDdOpen && ddMenuPos && typeof document !== 'undefined' && createPortal(
                    <div
                        data-dropdown-menu="true"
                        style={{ position: 'fixed', top: ddMenuPos.top, left: ddMenuPos.left, width: ddMenuPos.width, zIndex: 9999 }}
                        className="bg-background border border-border rounded shadow-lg overflow-hidden"
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        {/* Filter/type input — only shown when there are more than 8 options */}
                        {(options.length > 8 || !restrictToList) && (
                        <div className="p-1.5 border-b border-border">
                            <input
                                autoFocus
                                readOnly={restrictToList && options.length <= 8}
                                className="w-full text-sm px-2 py-1 outline-none bg-muted/40 rounded border-0"
                                placeholder={restrictToList ? 'Search options...' : 'Search or type value...'}
                                value={ddFilter}
                                onChange={e => setDdFilter(e.target.value)}
                                onMouseDown={e => e.stopPropagation()}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !restrictToList && ddFilter.trim()) {
                                        handleFreeInput(ddFilter)
                                    }
                                    if (e.key === 'Escape') closeDropdown()
                                    e.stopPropagation()
                                }}
                            />
                        </div>
                        )}

                        {/* Options list */}
                        <div className="max-h-48 overflow-y-auto p-1.5 space-y-px">
                            {filteredOptions.length === 0 && (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground italic rounded">
                                    {restrictToList
                                        ? (options.length === 0 ? 'No options defined' : 'No matches')
                                        : 'Press Enter to add as custom value'}
                                </div>
                            )}
                            {filteredOptions.map(option => {
                                const isSelected = selectedValues.includes(option)
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        className={cn(
                                            'w-full px-2 py-1.5 text-sm text-left flex items-center gap-2 rounded transition-colors cursor-pointer',
                                            isSelected
                                                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                                : 'text-foreground hover:bg-muted'
                                        )}
                                        onMouseDown={(e) => { e.preventDefault(); handleSelect(option) }}
                                    >
                                        {allowMultiple && (
                                            <div className={cn(
                                                'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                                                isSelected ? 'bg-primary border-primary' : 'border-border'
                                            )}>
                                                {isSelected && <CheckIcon className="h-2.5 w-2.5 text-primary-foreground" />}
                                            </div>
                                        )}
                                        <span className="flex-1 truncate">{option}</span>
                                        {!allowMultiple && isSelected && (
                                            <CheckIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Multi-select done button */}
                        {allowMultiple && (
                            <div className="border-t border-border p-1.5 flex justify-end">
                                <button
                                    type="button"
                                    className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                    onMouseDown={(e) => { e.preventDefault(); closeDropdown() }}
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>,
                    document.body
                )}
            </>
        )
    }

    if (columnType === 'NUMBER') {
        return (
            <input
                type="number"
                aria-label={t('grid.edit_number', 'Edit number value')}
                className="w-full bg-transparent outline-none focus-visible:outline-none focus-visible:ring-0 border-none p-1"
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

    // Autocomplete portal — rendered at document.body so it escapes overflow+stacking contexts
    const autocompletePortal = showDropdown && dropdownPos && typeof document !== 'undefined'
        ? createPortal(
            <div
                style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
                className="bg-neutral-800 border border-neutral-600 shadow-lg rounded-md max-h-48 overflow-y-auto"
            >
                {autocompleteMatches.map((fn, idx) => (
                    <div
                        key={fn}
                        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); insertFunction(fn) }}
                        className={_cn('px-3 py-1.5 text-sm font-mono cursor-pointer text-neutral-100 hover:bg-neutral-600', idx === activeIndex && 'bg-neutral-600')}
                    >
                        {fn}<span className="text-neutral-400">(</span>
                    </div>
                ))}
            </div>,
            document.body
        )
        : null

    // Signature tooltip portal — shown below the input when cursor is inside a known function call
    const signaturePortal = showSignature && signaturePos && signatureInfo && typeof document !== 'undefined'
        ? createPortal(
            <div
                style={{ position: 'fixed', top: signaturePos.top, left: signaturePos.left, zIndex: 9998 }}
                className="bg-neutral-800 border border-neutral-600 shadow-lg rounded-md px-3 py-2 text-sm font-mono text-neutral-100 max-w-sm pointer-events-none"
            >
                <div>
                    <span className="text-yellow-300">{signatureInfo.fnName}</span>
                    <span className="text-neutral-400">(</span>
                    {FUNCTION_SIGNATURES[signatureInfo.fnName]?.args.map((arg, idx) => (
                        <React.Fragment key={idx}>
                            {idx > 0 && <span className="text-neutral-400">, </span>}
                            <span className={_cn(
                                idx === signatureInfo.argIndex ? 'text-white font-bold underline' : 'text-neutral-400',
                                !arg.required && 'italic'
                            )}>
                                {!arg.required ? `[${arg.name}]` : arg.name}
                            </span>
                        </React.Fragment>
                    ))}
                    <span className="text-neutral-400">)</span>
                </div>
                {FUNCTION_SIGNATURES[signatureInfo.fnName]?.description && (
                    <div className="text-neutral-400 text-xs mt-1 font-sans">
                        {FUNCTION_SIGNATURES[signatureInfo.fnName].description}
                    </div>
                )}
            </div>,
            document.body
        )
        : null

    // Image / Link cells — rendered in view mode only (double-click to edit as plain text)
    if (!isEditing) {
        const rawStr = String(value ?? '')
        const imgData = parseImageValue(rawStr)
        if (imgData) {
            const displayW = imgSize?.width  ?? imgData.width
            const displayH = imgSize?.height ?? imgData.height

            const handleResizeMouseDown = (e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                const startX = e.clientX
                const startW = displayW
                const startH = displayH
                const aspect = startH / startW

                const onMove = (me: MouseEvent) => {
                    const dw = me.clientX - startX
                    const newW = Math.max(40, Math.min(400, startW + dw))
                    setImgSize({ width: newW, height: Math.round(newW * aspect) })
                }
                const onUp = (me: MouseEvent) => {
                    const dw = me.clientX - startX
                    const newW = Math.max(40, Math.min(400, startW + dw))
                    const newH = Math.round(newW * aspect)
                    onChange(`__img__${JSON.stringify({ url: imgData.url, width: newW, height: newH })}`)
                    updateColumnWidth(columnId, newW + 24)
                    setImgSize(null)
                    document.removeEventListener('mousemove', onMove)
                    document.removeEventListener('mouseup', onUp)
                }
                document.addEventListener('mousemove', onMove)
                document.addEventListener('mouseup', onUp)
            }

            return (
                <div className="relative p-1 flex-shrink-0" style={{ width: displayW + 8, height: displayH + 8 }}>
                    <img
                        src={imgData.url}
                        alt=""
                        draggable={false}
                        style={{ width: displayW, height: displayH, objectFit: 'contain', display: 'block' }}
                    />
                    <div
                        className="absolute bottom-0 right-0 w-3 h-3 bg-primary opacity-60 hover:opacity-100 cursor-se-resize"
                        onMouseDown={handleResizeMouseDown}
                    />
                </div>
            )
        }

        const linkData = parseLinkValue(rawStr)
        if (linkData) {
            return (
                <div className="w-full min-h-[24px] p-1 truncate" style={inputStyle}>
                    <a
                        href={linkData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline hover:text-blue-700"
                        onClick={e => e.stopPropagation()}
                        onDoubleClick={e => {
                            e.stopPropagation()
                            setIsEditing(true)
                            setEditingCell({ rowId, columnId })
                            onFocus(rowId, columnId)
                        }}
                    >
                        {linkData.text || linkData.url}
                    </a>
                </div>
            )
        }
    }

    // Text cell: use textarea when wrap is enabled so content can flow to multiple lines
    if (cellStyle.wrap) {
        if (!isEditing) {
            return (
                <div
                    className="w-full min-h-[24px] p-1 cursor-default select-none whitespace-pre-wrap break-words leading-normal"
                    style={inputStyle}
                    onDoubleClick={() => {
                        setIsEditing(true)
                        setEditingCell({ rowId, columnId })
                        onFocus(rowId, columnId)
                    }}
                >
                    {renderedDisplay != null && renderedDisplay !== '' ? String(renderedDisplay) : ''}
                </div>
            )
        }
        return (
            <>
                <textarea
                    ref={textareaRef}
                    aria-label={t('grid.edit_cell', 'Edit cell value')}
                    className="w-full bg-transparent outline-none focus-visible:outline-none focus-visible:ring-0 border-none p-1 resize-none overflow-hidden leading-normal"
                    style={{ ...inputStyle, minHeight: '24px' }}
                    value={value ?? ''}
                    rows={1}
                    onChange={e => {
                        const v = e.target.value
                        valueRef.current = v
                        setValue(v)
                        const pos = e.target.selectionStart ?? v.length
                        computeAutocomplete(v, pos)
                        computeSignature(v, pos)
                        if (v.startsWith('=')) activateFormulaMode(e.target)
                        else { setIsFormulaEditing(false); insertCellRefCallback.current = null }
                    }}
                    onFocus={(e) => {
                        onFocus(rowId, columnId)
                        if (String(value ?? '').startsWith('=')) {
                            activateFormulaMode(e.target)
                            const pos = e.target.selectionStart ?? String(value ?? '').length
                            computeSignature(String(value ?? ''), pos)
                        }
                    }}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onSelect={handleSelect}
                    autoFocus
                />
                {autocompletePortal}
                {signaturePortal}
            </>
        )
    }

    // View mode — single click selects the cell, double click enters edit mode
    if (!isEditing) {
        return (
            <div
                className="w-full min-h-[24px] p-1 cursor-default select-none truncate"
                style={inputStyle}
                onDoubleClick={() => {
                    setIsEditing(true)
                    setEditingCell({ rowId, columnId })
                    onFocus(rowId, columnId)
                }}
            >
                {renderedDisplay != null && renderedDisplay !== '' ? String(renderedDisplay) : ''}
            </div>
        )
    }

    // Edit mode — double click or keyboard triggered
    return (
        <>
            <input
                ref={inputRef}
                aria-label={t('grid.edit_cell', 'Edit cell value')}
                className="w-full bg-transparent outline-none focus-visible:outline-none focus-visible:ring-0 border-none p-1"
                style={inputStyle}
                value={value ?? ''}
                onChange={e => {
                    const v = e.target.value
                    valueRef.current = v
                    setValue(v)
                    const pos = e.target.selectionStart ?? v.length
                    computeAutocomplete(v, pos)
                    computeSignature(v, pos)
                    if (v.startsWith('=')) activateFormulaMode(e.target)
                    else { setIsFormulaEditing(false); insertCellRefCallback.current = null }
                }}
                onFocus={(e) => {
                    onFocus(rowId, columnId)
                    if (String(value ?? '').startsWith('=')) {
                        activateFormulaMode(e.target)
                        const pos = e.target.selectionStart ?? String(value ?? '').length
                        computeSignature(String(value ?? ''), pos)
                    }
                }}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onSelect={handleSelect}
                autoFocus
            />
            {autocompletePortal}
            {signaturePortal}
        </>
    )
}
