'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFormBuilderStore } from '@/lib/stores/form-builder-store'
import { ChoiceEditor } from '../editors/ChoiceEditor'
import { ImageUploadField } from '../editors/ImageUploadField'
import { FormFieldBase } from '@/types/group-forms'
import { isElementType } from '@/lib/field-registry'

interface PropertiesTabProps {
  field: FormFieldBase
  groupId: number
  formId?: number
}

export function PropertiesTab({ field, groupId, formId }: PropertiesTabProps) {
  const { updateField } = useFormBuilderStore()

  const handleUpdate = (updates: Partial<typeof field>) => {
    updateField(field.id, updates)
  }

  // Find available column for half-width fields
  // Uses getState() to get CURRENT store state at click time, not stale render-time state
  const getAvailableColumnIndex = (): 0 | 1 => {
    const { formSchema, currentPageIndex } = useFormBuilderStore.getState()

    if (!formSchema) {
      return 0
    }

    const currentPage = formSchema.pages[currentPageIndex]
    if (!currentPage) {
      return 0
    }

    // Find the section containing this field
    for (const section of currentPage.sections) {
      const fieldInSection = section.fields.find(f => f.id === field.id)
      if (fieldInSection) {
        // Check if there's already a half-width field in the left column (excluding current field)
        const hasLeftField = section.fields.some(
          f => f.id !== field.id && f.colSpan === 6 && f.columnIndex === 0
        )
        return hasLeftField ? 1 : 0
      }
    }
    return 0
  }

  const hasChoices = ['radio', 'checkbox', 'select'].includes(field.type)
  const isElement = isElementType(field.type)

  return (
    <div className="space-y-6">
      {/* Label - For form fields and heading elements */}
      {(!isElement || field.type === 'heading') && (
        <div className="space-y-2">
          <Label htmlFor="field-label" data-property="label">
            {field.type === 'heading' ? 'Heading Text' : 'Label'}
          </Label>
          <Input
            id="field-label"
            value={field.label || ''}
            onChange={(e) => handleUpdate({ label: e.target.value })}
            placeholder={field.type === 'heading' ? 'Enter heading text' : 'Enter field label'}
          />
        </div>
      )}

      {/* Heading Level (for heading element) */}
      {field.type === 'heading' && (
        <div className="space-y-2">
          <Label htmlFor="field-headingLevel">Heading Level</Label>
          <Select
            value={field.headingLevel?.toString() || '2'}
            onValueChange={(value) => handleUpdate({ headingLevel: parseInt(value) as 1 | 2 | 3 | 4 })}
          >
            <SelectTrigger id="field-headingLevel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">H1 - Large</SelectItem>
              <SelectItem value="2">H2 - Medium</SelectItem>
              <SelectItem value="3">H3 - Small</SelectItem>
              <SelectItem value="4">H4 - Extra Small</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Text Content (for text_element) */}
      {field.type === 'text_element' && (
        <div className="space-y-2">
          <Label htmlFor="field-content">Content</Label>
          <Textarea
            id="field-content"
            value={field.content || ''}
            onChange={(e) => handleUpdate({ content: e.target.value })}
            placeholder="Enter your text here..."
            rows={8}
          />
          <p className="text-xs text-muted-foreground">
            Supports markdown: **bold**, *italic*, [link text](url)
          </p>
        </div>
      )}

      {/* Image Upload (for image_element) */}
      {field.type === 'image_element' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Image</Label>
            <ImageUploadField
              groupId={groupId}
              formId={formId}
              currentUrl={field.imageUrl}
              currentObjectKey={field.imageObjectKey}
              onUpload={(objectKey, url) => handleUpdate({
                imageObjectKey: objectKey,
                imageUrl: url
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-imageAlt">Alt Text</Label>
            <Input
              id="field-imageAlt"
              value={field.imageAlt || ''}
              onChange={(e) => handleUpdate({ imageAlt: e.target.value })}
              placeholder="Describe the image for accessibility"
            />
          </div>
        </div>
      )}

      {/* Placeholder */}
      {['text', 'textarea', 'email', 'phone', 'url'].includes(field.type) && (
        <div className="space-y-2">
          <Label htmlFor="field-placeholder" data-property="placeholder">
            Placeholder
          </Label>
          <Input
            id="field-placeholder"
            value={field.placeholder || ''}
            onChange={(e) => handleUpdate({ placeholder: e.target.value })}
            placeholder="Enter placeholder text"
          />
        </div>
      )}

      {/* Help Text / Description - For form fields and heading elements */}
      {(!isElement || field.type === 'heading') && (
        <div className="space-y-2">
          <Label htmlFor="field-help" data-property="helpText">
            {field.type === 'heading' ? 'Description' : 'Help Text'}
          </Label>
          <Textarea
            id="field-help"
            value={field.type === 'heading' ? (field.description || '') : (field.helpText || '')}
            onChange={(e) => handleUpdate(
              field.type === 'heading'
                ? { description: e.target.value }
                : { helpText: e.target.value }
            )}
            placeholder={field.type === 'heading' ? 'Optional description below heading' : 'Provide additional context or instructions'}
            rows={3}
          />
        </div>
      )}

      {/* Required - Only for form fields, not elements */}
      {!isElement && (
        <div className="flex items-center justify-between">
          <Label htmlFor="field-required">Required</Label>
          <Switch
            id="field-required"
            data-property="required"
            checked={field.required || false}
            onCheckedChange={(checked) => handleUpdate({ required: checked })}
          />
        </div>
      )}

      {/* Field Width - Simplified 2-option toggle */}
      <div className="space-y-2">
        <Label>Field Width</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={field.colSpan === 12 || !field.colSpan ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => handleUpdate({ colSpan: 12, columnIndex: undefined })}
          >
            Full Width
          </Button>
          <Button
            type="button"
            variant={field.colSpan === 6 ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => {
              // Always calculate available column - this ensures proper pairing
              const columnIndex = getAvailableColumnIndex()
              handleUpdate({ colSpan: 6, columnIndex })
            }}
          >
            Half Width
          </Button>
        </div>
      </div>

      {/* Choices Editor (for radio, checkbox, select) */}
      {hasChoices && (
        <div className="space-y-2">
          <Label>Choices</Label>
          <ChoiceEditor
            choices={field.choices || []}
            onChange={(choices) => handleUpdate({ choices })}
          />
        </div>
      )}

      {/* Field-specific properties */}
      {field.type === 'textarea' && (
        <div className="space-y-2">
          <Label htmlFor="field-rows">Rows</Label>
          <Input
            id="field-rows"
            type="number"
            min="2"
            max="20"
            value={field.rows || 4}
            onChange={(e) => handleUpdate({ rows: parseInt(e.target.value) })}
          />
        </div>
      )}

      {field.type === 'rating' && (
        <div className="space-y-2">
          <Label htmlFor="field-ratingMax">Maximum Rating</Label>
          <Input
            id="field-ratingMax"
            type="number"
            min="3"
            max="10"
            value={field.ratingMax || 5}
            onChange={(e) => handleUpdate({ ratingMax: parseInt(e.target.value) })}
          />
        </div>
      )}

      {field.type === 'file' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="field-accept">Accepted File Types</Label>
            <Input
              id="field-accept"
              value={field.accept || '*'}
              onChange={(e) => handleUpdate({ accept: e.target.value })}
              placeholder=".pdf,.doc,.docx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-maxFileSize">Max File Size (MB)</Label>
            <Input
              id="field-maxFileSize"
              type="number"
              min="1"
              max="100"
              value={(field.maxFileSize || 20971520) / 1048576}
              onChange={(e) => handleUpdate({
                maxFileSize: parseInt(e.target.value) * 1048576
              })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="field-allowMultiple">Allow Multiple Files</Label>
            <Switch
              id="field-allowMultiple"
              checked={field.allowMultiple || false}
              onCheckedChange={(checked) => handleUpdate({ allowMultiple: checked })}
            />
          </div>
        </>
      )}
    </div>
  )
}
