'use client';

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
    Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ColumnSort {
    sortBy: string;
    sortDir: 'asc' | 'desc';
}

export const DEFAULT_COLUMN_SORT: ColumnSort = {
    sortBy: 'created',
    sortDir: 'desc',
};

const SORT_OPTIONS = [
    { value: 'created', label: 'Created' },
    { value: 'title', label: 'Title' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'type', label: 'Type' },
    { value: 'startDate', label: 'Start Date' },
    { value: 'endDate', label: 'End Date' },
];

interface ColumnSortPopoverProps {
    sort: ColumnSort;
    onSort: (sort: ColumnSort) => void;
    /** Hide these sort fields (e.g. 'status' in drill-down, 'type' in type columns) */
    hideFields?: string[];
}

export function ColumnSortPopover({ sort, onSort, hideFields = [] }: ColumnSortPopoverProps) {
    const options = SORT_OPTIONS.filter(o => !hideFields.includes(o.value));
    const isCustom = sort.sortBy !== 'created' || sort.sortDir !== 'desc';

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        'h-6 w-6 flex items-center justify-center rounded-md transition-colors',
                        isCustom
                            ? 'text-primary bg-primary/10 hover:bg-primary/20'
                            : 'text-muted-foreground hover:bg-background hover:text-foreground',
                    )}
                    title="Sort"
                >
                    <ArrowUpDown className="h-3 w-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1.5" align="start">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                    Sort by
                </p>
                {options.map(opt => {
                    const isActive = sort.sortBy === opt.value;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => onSort({
                                sortBy: opt.value,
                                sortDir: isActive
                                    ? (sort.sortDir === 'asc' ? 'desc' : 'asc')
                                    : 'desc',
                            })}
                            className={cn(
                                'w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition-colors',
                                isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'hover:bg-muted text-foreground',
                            )}
                        >
                            <span>{opt.label}</span>
                            {isActive && (
                                sort.sortDir === 'asc'
                                    ? <ArrowUp className="h-3 w-3" />
                                    : <ArrowDown className="h-3 w-3" />
                            )}
                        </button>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
}
