'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, X, Plus, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSheet } from '../../providers/SheetProvider';
import type { FilterRule, FilterOperator } from '../../types/cell-styles';

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'is_blank', label: 'Is blank' },
  { value: 'is_not_blank', label: 'Is not blank' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
];

interface FilterModalProps {
  className?: string;
}

export function FilterModal({ className }: FilterModalProps) {
  const { columns, activeFilters, setActiveFilters } = useSheet();
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterRule[]>([]);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalFilters([...activeFilters]);
    }
    setOpen(isOpen);
  };

  const addFilter = () => {
    const newFilter: FilterRule = {
      id: `filter-${Date.now()}`,
      columnId: columns[0]?.id || '',
      operator: 'contains',
      value: '',
      enabled: true,
    };
    setLocalFilters([...localFilters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setLocalFilters(localFilters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<FilterRule>) => {
    setLocalFilters(localFilters.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  };

  const handleApply = () => {
    setActiveFilters(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    setActiveFilters([]);
    setLocalFilters([]);
    setOpen(false);
  };

  const activeCount = activeFilters.filter(f => f.enabled).length;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("h-8 px-2 gap-1", className)}
        >
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs">Filter</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Filter Data</DialogTitle>
          <DialogDescription>
            Add filter rules to show only matching rows
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
          {localFilters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No filters applied</p>
              <p className="text-sm">Click "Add Filter" to get started</p>
            </div>
          ) : (
            localFilters.map((filter, index) => (
              <div 
                key={filter.id} 
                className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30"
              >
                <Switch
                  checked={filter.enabled}
                  onCheckedChange={(checked) => 
                    updateFilter(filter.id, { enabled: checked })
                  }
                />
                
                <Select
                  value={filter.columnId}
                  onValueChange={(value) => 
                    updateFilter(filter.id, { columnId: value })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col: { id: string; label: string }) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.label || col.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filter.operator}
                  onValueChange={(value: FilterOperator) => 
                    updateFilter(filter.id, { operator: value })
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {!['is_blank', 'is_not_blank'].includes(filter.operator) && (
                  <Input
                    placeholder="Value"
                    value={String(filter.value || '')}
                    onChange={(e) => 
                      updateFilter(filter.id, { value: e.target.value })
                    }
                    className="flex-1"
                  />
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeFilter(filter.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addFilter}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Filter
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear All
          </Button>
          <Button size="sm" onClick={handleApply} className="gap-1">
            <Check className="h-4 w-4" />
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
