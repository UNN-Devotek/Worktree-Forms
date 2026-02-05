'use client'

import { forwardRef } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { FormFieldBase } from '@/types/group-forms'
import { FieldWrapper } from '../base/FieldWrapper'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { getFieldComponent } from '@/lib/field-registry'

interface SmartTableFieldProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

export const SmartTableField = forwardRef<HTMLDivElement, SmartTableFieldProps>(
  ({ field, mode = 'render' }, ref) => {
    // Builder Mode: Show placeholder or configuration UI shortcut
    if (mode === 'builder') {
      return (
        <FieldWrapper
          id={field.id}
          label={field.label}
          helpText={field.helpText}
          required={field.required}
          colSpan={field.colSpan}
        >
          <div className="border rounded-md p-4 bg-muted/20">
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-muted-foreground/25 rounded">
              <span className="text-muted-foreground">Smart Table Configuration</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Configure columns in the properties panel
            </p>
          </div>
        </FieldWrapper>
      )
    }

    // Render/Preview Logic
    const { control } = useFormContext()
    const { fields,append, remove } = useFieldArray({
      control,
      name: field.name
    })



    // Get columns from field definition
    const columns = field.columns || []

    const handleAddRow = () => {
        // Create empty row object based on columns
        const newRow: Record<string, any> = {}
        columns.forEach(col => {
            newRow[col.name] = '' // Default value, ideally from type defaults
        })
        append(newRow)
    }

    // Initialize with prefilled rows if empty and not yet dirty
    // (This logic might move to a useEffect)

    return (
      <FieldWrapper
        id={field.id}
        label={field.label}
        helpText={field.helpText}
        required={field.required}
        colSpan={field.colSpan}
        className="overflow-x-auto"
      >
        <div ref={ref} className="space-y-4">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.id} className="min-w-[150px]">
                      {col.label}
                      {col.required && <span className="text-destructive ml-1">*</span>}
                    </TableHead>
                  ))}
                  {(field.allowDelete !== false) && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((row, index) => (
                  <TableRow key={row.id}>
                    {columns.map((col) => {
                      const FieldComponent = getFieldComponent(col.type)
                      if (!FieldComponent) return <TableCell key={col.id}>Unsupported</TableCell>

                      // Recursive field rendering
                      // We need to construct a field definition that points to the correct array index
                      // e.g., "tableName.0.columnName"
                      const arrayFieldName = `${field.name}.${index}.${col.name}`
                      
                      // Create a temporary field config for the cell, overriding the name and hiding label
                      const cellFieldConfig = {
                        ...col,
                        name: arrayFieldName,
                        label: '', // Hide label in table cell
                        helpText: '' // Hide help text in table cell to save space
                      }

                      return (
                        <TableCell key={col.id} className="align-top">
                          <FieldComponent field={cellFieldConfig} mode={mode} />
                        </TableCell>
                      )
                    })}
                    
                    {(field.allowDelete !== false) && (
                      <TableCell className="align-top pt-4">
                         <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="h-8 w-8 text-destructive hover:text-destructive/90"
                         >
                            <Trash2 className="h-4 w-4" />
                         </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                
                {fields.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
                            No entries yet.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {(field.allowAdd !== false) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Row
            </Button>
          )}
        </div>
      </FieldWrapper>
    )
  }
)

SmartTableField.displayName = 'SmartTableField'
