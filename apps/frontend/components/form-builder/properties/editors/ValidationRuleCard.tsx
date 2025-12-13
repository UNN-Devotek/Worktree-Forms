'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RegexPatternSelector } from './RegexPatternSelector'
import { ValidationRule } from '@/types/group-forms'

interface ValidationRuleCardProps {
  rule: ValidationRule
  availableTypes: string[]
  onChange: (updates: Partial<ValidationRule>) => void
}

export function ValidationRuleCard({
  rule,
  availableTypes,
  onChange
}: ValidationRuleCardProps) {
  return (
    <div className="space-y-4">
      {/* Validation Type */}
      <div className="space-y-2">
        <Label>Validation Type</Label>
        <Select
          value={rule.type}
          onValueChange={(type) => onChange({ type: type as any })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select validation type" />
          </SelectTrigger>
          <SelectContent>
            {availableTypes.includes('min_length') && (
              <SelectItem value="min_length">Minimum Length</SelectItem>
            )}
            {availableTypes.includes('max_length') && (
              <SelectItem value="max_length">Maximum Length</SelectItem>
            )}
            {availableTypes.includes('min_value') && (
              <SelectItem value="min_value">Minimum Value</SelectItem>
            )}
            {availableTypes.includes('max_value') && (
              <SelectItem value="max_value">Maximum Value</SelectItem>
            )}
            {availableTypes.includes('pattern') && (
              <SelectItem value="pattern">Pattern (Regex)</SelectItem>
            )}
            {availableTypes.includes('email') && (
              <SelectItem value="email">Email Format</SelectItem>
            )}
            {availableTypes.includes('phone') && (
              <SelectItem value="phone">Phone Format</SelectItem>
            )}
            {availableTypes.includes('url') && (
              <SelectItem value="url">URL Format</SelectItem>
            )}
            {availableTypes.includes('date_range') && (
              <SelectItem value="date_range">Date Range</SelectItem>
            )}
            {availableTypes.includes('file_size') && (
              <SelectItem value="file_size">File Size</SelectItem>
            )}
            {availableTypes.includes('file_type') && (
              <SelectItem value="file_type">File Type</SelectItem>
            )}
            {availableTypes.includes('custom') && (
              <SelectItem value="custom">Custom</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Value Input (conditional based on type) */}
      {['min_length', 'max_length', 'min_value', 'max_value'].includes(rule.type) && (
        <div className="space-y-2">
          <Label>Value</Label>
          <Input
            type="number"
            value={rule.value as number || ''}
            onChange={(e) => onChange({ value: parseInt(e.target.value) })}
            placeholder="Enter value"
          />
        </div>
      )}

      {/* Pattern Input */}
      {rule.type === 'pattern' && (
        <div className="space-y-2">
          <Label>Regular Expression Pattern</Label>
          <RegexPatternSelector
            value={rule.value as string || ''}
            onChange={(pattern) => onChange({ value: pattern })}
          />
        </div>
      )}

      {/* Date Range Inputs */}
      {rule.type === 'date_range' && (
        <>
          <div className="space-y-2">
            <Label>Minimum Date (Optional)</Label>
            <Input
              type="date"
              value={rule.minDate || ''}
              onChange={(e) => onChange({ minDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Maximum Date (Optional)</Label>
            <Input
              type="date"
              value={rule.maxDate || ''}
              onChange={(e) => onChange({ maxDate: e.target.value })}
            />
          </div>
        </>
      )}

      {/* File Size Input */}
      {rule.type === 'file_size' && (
        <div className="space-y-2">
          <Label>Maximum File Size (MB)</Label>
          <Input
            type="number"
            value={rule.maxFileSize ? rule.maxFileSize / 1048576 : ''}
            onChange={(e) => onChange({ maxFileSize: parseInt(e.target.value) * 1048576 })}
            placeholder="Enter size in MB"
            min="1"
          />
        </div>
      )}

      {/* File Type Input */}
      {rule.type === 'file_type' && (
        <div className="space-y-2">
          <Label>Accepted File Types</Label>
          <Input
            type="text"
            value={rule.acceptedTypes?.join(', ') || ''}
            onChange={(e) => onChange({ acceptedTypes: e.target.value.split(',').map(t => t.trim()) })}
            placeholder="e.g., .pdf, .doc, .docx, image/*"
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated list of file extensions or MIME types
          </p>
        </div>
      )}

      {/* Custom Error Message */}
      <div className="space-y-2">
        <Label>Custom Error Message (Optional)</Label>
        <Textarea
          value={rule.message || ''}
          onChange={(e) => onChange({ message: e.target.value })}
          placeholder="Leave empty to use default message"
          rows={2}
        />
      </div>
    </div>
  )
}
