'use client'

import { useState } from 'react'
import { FormFieldBase } from '@/types/group-forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, GripVertical, Settings2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { nanoid } from 'nanoid'

interface SmartTableColumnEditorProps {
  columns: FormFieldBase[]
  onChange: (columns: FormFieldBase[]) => void
}

const AVAILABLE_COLUMN_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' }
]

export function SmartTableColumnEditor({ columns, onChange }: SmartTableColumnEditorProps) {
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)

  const addColumn = () => {
    const newColumn: FormFieldBase = {
      id: nanoid(),
      name: `col_${nanoid(4)}`, // shorter name for columns
      type: 'text',
      label: 'New Column',
      required: false,
      colSpan: 12
    }
    onChange([...columns, newColumn])
    setEditingColumnId(newColumn.id)
  }

  const removeColumn = (index: number) => {
    const newColumns = [...columns]
    newColumns.splice(index, 1)
    onChange(newColumns)
    if (editingColumnId === columns[index].id) {
        setEditingColumnId(null)
    }
  }

  const updateColumn = (index: number, updates: Partial<FormFieldBase>) => {
    const newColumns = [...columns]
    newColumns[index] = { ...newColumns[index], ...updates }
    onChange(newColumns)
  }

  const getColumnIndex = (id: string) => columns.findIndex(c => c.id === id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Table Columns</Label>
        <Button variant="outline" size="sm" onClick={addColumn}>
          <Plus className="h-4 w-4 mr-2" />
          Add Column
        </Button>
      </div>

      <div className="space-y-2">
        {columns.map((column, index) => (
          <Card key={column.id} className="p-3">
            {editingColumnId === column.id ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                   <h4 className="text-sm font-medium">Edit Column</h4>
                   <Button variant="ghost" size="sm" onClick={() => setEditingColumnId(null)}>Done</Button>
                </div>
                
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select 
                        value={column.type} 
                        onValueChange={(val) => updateColumn(index, { type: val as any })}
                      >
                         <SelectTrigger className="h-8">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           {AVAILABLE_COLUMN_TYPES.map(t => (
                             <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                        <Label className="text-xs">Required</Label>
                        <div className="h-8 flex items-center">
                            <Switch 
                                checked={column.required} 
                                onCheckedChange={(c) => updateColumn(index, { required: c })} 
                            />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input 
                      className="h-8"
                      value={column.label} 
                      onChange={(e) => updateColumn(index, { label: e.target.value })} 
                    />
                  </div>

                   <div className="space-y-1">
                    <Label className="text-xs">Field Name (Key)</Label>
                    <Input 
                      className="h-8 font-mono text-xs"
                      value={column.name} 
                      onChange={(e) => updateColumn(index, { name: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">{column.label}</p>
                        <p className="text-xs text-muted-foreground">{column.type}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingColumnId(column.id)}>
                        <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeColumn(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                 </div>
              </div>
            )}
          </Card>
        ))}

        {columns.length === 0 && (
            <div className="text-center p-4 border rounded-md border-dashed text-sm text-muted-foreground">
                No columns defined. Add a column to start.
            </div>
        )}
      </div>
    </div>
  )
}
