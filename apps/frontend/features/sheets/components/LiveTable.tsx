"use client"

import React, { useMemo, useRef } from "react"
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



interface LiveTableProps {
  documentId?: string // Optional now since provider has it
  containerClassName?: string
}

export function LiveTable({ containerClassName }: LiveTableProps) {
  const { data, columns, updateCell, selectedRowId, openDetailPanel } = useSheet()

  const tableColumns = useMemo<ColumnDef<any>[]>(
    () => {
        if (!columns || columns.length === 0) return []
        
        return columns.map((col: any) => ({
            accessorKey: col.id,
            header: col.label || col.id,
            size: col.width || 120,
            cell: ({ row, getValue }: any) => {
                const initialValue = getValue()
                // Finding #9 (R8): pass column type for type-aware rendering
                return (
                    <EditableCell 
                        initialValue={initialValue} 
                        onChange={(val) => updateCell(row.original.id, col.id, val)}
                        columnType={col.type}
                    />
                )
            }
        }))
    },
    [columns, updateCell]
  )

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
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
                        <div key={header.id} 
                             className="h-10 px-4 flex items-center font-medium text-muted-foreground border-r"
                             style={{ width: header.getSize() }}>
                            {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                )}
                        </div>
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
                
                return (
                    <div
                        key={row.id}
                        data-index={virtualRow.index}
                        ref={(node) => rowVirtualizer.measureElement(node)}
                        className={cn(
                            "flex absolute w-full border-b items-center cursor-pointer transition-colors",
                            "hover:bg-muted/50",
                            row.original.id === selectedRowId && "bg-muted border-l-2 border-l-primary"
                        )}
                        style={{
                            transform: `translateY(${virtualRow.start}px)`,
                            height: `${virtualRow.size}px`
                        }}
                        onClick={() => openDetailPanel(row.original.id)}
                    >
                        {row.getVisibleCells().map((cell) => (
                            <div key={cell.id} 
                                 className="px-2 border-r h-full flex items-center" 
                                 style={{ width: cell.column.getSize() }}
                                 onClick={(e) => e.stopPropagation()}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                        ))}
                    </div>
                )
            })}
        </div>
    </div>
  )
}

function EditableCell({ initialValue, onChange, columnType }: { initialValue: any, onChange: (val: any) => void, columnType?: string }) {
    const [value, setValue] = React.useState(initialValue)

    // Sync from props if external change
    React.useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    const onBlur = () => {
        if (value !== initialValue) {
            onChange(value)
        }
    }

    // Finding #9 (R8): render type-aware inputs instead of always plain text
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
            />
        )
    }

    if (columnType === 'NUMBER') {
        return (
            <input
                type="number"
                aria-label={t('grid.edit_number', 'Edit number value')}
                className="w-full h-full bg-transparent outline-none border-none p-1 text-right"
                value={value ?? ''}
                onChange={e => setValue(e.target.value === '' ? '' : Number(e.target.value))}
                onBlur={onBlur}
            />
        )
    }

    if (columnType === 'DATE') {
        return (
            <input
                type="date"
                aria-label={t('grid.edit_date', 'Edit date value')}
                className="w-full h-full bg-transparent outline-none border-none p-1"
                value={value ?? ''}
                onChange={e => {
                    setValue(e.target.value)
                    onChange(e.target.value)
                }}
            />
        )
    }

    return (
        <input
            aria-label={t('grid.edit_cell', 'Edit cell value')}
            className="w-full h-full bg-transparent outline-none border-none p-1"
            value={value ?? ''}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
        />
    )
}
