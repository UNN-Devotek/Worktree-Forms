import { create } from 'zustand'
import { FormSchema, FormFieldBase, FormSection, FormPage } from '@/types/group-forms'
import { nanoid } from 'nanoid'

interface FormBuilderState {
  // Core state
  formSchema: FormSchema | null
  selectedFieldId: string | null
  currentPageIndex: number
  previewMode: 'desktop' | 'tablet' | 'mobile'
  isDirty: boolean

  // History for undo/redo
  history: FormSchema[]
  historyIndex: number

  // Actions - Form
  initializeForm: (schema?: FormSchema) => void
  setFormSchema: (schema: FormSchema) => void
  updateFormSettings: (updates: Partial<FormSchema['settings']>) => void
  updateFormTheme: (updates: Partial<FormSchema['theme']>) => void

  // Actions - Pages
  addPage: () => void
  removePage: (pageIndex: number) => void
  updatePage: (pageIndex: number, updates: Partial<FormPage>) => void
  setCurrentPage: (index: number) => void
  reorderPages: (fromIndex: number, toIndex: number) => void

  // Actions - Sections
  addSection: (pageIndex?: number) => void
  removeSection: (sectionIndex: number, pageIndex?: number) => void
  updateSection: (sectionIndex: number, updates: Partial<FormSection>, pageIndex?: number) => void
  moveSection: (fromIndex: number, toIndex: number, pageIndex?: number) => void

  // Actions - Fields
  addField: (fieldType: string, sectionIndex: number, fieldIndex: number, pageIndex?: number) => void
  removeField: (sectionIndex: number, fieldIndex: number, pageIndex?: number) => void
  updateField: (fieldId: string, updates: Partial<FormFieldBase>) => void
  moveField: (fromSection: number, fromField: number, toSection: number, toField: number, pageIndex?: number) => void
  duplicateField: (sectionIndex: number, fieldIndex: number, pageIndex?: number) => void

  // Actions - Simplified Column Layout (2-column only)
  addHalfWidthField: (fieldType: string, sectionIndex: number, columnIndex: 0 | 1, pageIndex?: number) => void
  setFieldWidth: (sectionIndex: number, fieldIndex: number, colSpan: 6 | 12, columnIndex?: 0 | 1, pageIndex?: number) => void

  // Actions - Selection
  selectField: (fieldId: string | null) => void
  getSelectedField: () => FormFieldBase | null

  // Actions - Preview
  setPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void

  // Actions - Dirty state
  setDirty: (dirty: boolean) => void

  // Actions - History
  pushToHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

/**
 * Migrate form schema to new 2-column layout.
 * Converts colSpan 4 or 3 to 12 (full width).
 */
function migrateFormSchema(schema: FormSchema): FormSchema {
  return {
    ...schema,
    pages: schema.pages.map(page => ({
      ...page,
      sections: page.sections.map(section => ({
        ...section,
        fields: section.fields.map(field => {
          // Convert 1/3 and 1/4 width to full width
          if (field.colSpan === 4 || field.colSpan === 3) {
            return { ...field, colSpan: 12, columnIndex: undefined }
          }
          // Ensure colSpan is either 6 or 12
          if (field.colSpan && field.colSpan !== 6 && field.colSpan !== 12) {
            return { ...field, colSpan: 12, columnIndex: undefined }
          }
          return field
        })
      }))
    }))
  }
}

/**
 * Create default form schema
 */
function createDefaultFormSchema(): FormSchema {
  return {
    version: '2.0',
    pages: [
      {
        id: nanoid(),
        title: 'Untitled Form',
        description: '',
        sections: [],
        order: 0
      }
    ],
    settings: {
      renderMode: 'all-in-one' as const,
      showProgress: true,
      progressStyle: 'bar' as const,
      allowSave: false,
      allowBack: true,
      successMessage: 'Thank you for your submission!',
      requireAuthentication: false,
      allowAnonymous: true,
      captchaEnabled: false
    },
    theme: {
      mode: 'auto' as const,
      show_logo: true
    }
  }
}

/**
 * Create default field with type-specific defaults
 */
function createDefaultField(type: string): FormFieldBase {
  const baseField: FormFieldBase = {
    id: nanoid(),
    type: type as any,
    name: `field_${nanoid(6)}`,
    label: 'New Field',
    required: false,
    colSpan: 12
  }

  // Type-specific defaults
  switch (type) {
    case 'text':
      return { ...baseField, label: 'Short Text', placeholder: 'Enter text...' }
    case 'textarea':
      return { ...baseField, label: 'Long Text', placeholder: 'Enter your response...', rows: 4 }
    case 'email':
      return { ...baseField, label: 'Email Address', placeholder: 'you@example.com' }
    case 'phone':
      return { ...baseField, label: 'Phone Number', placeholder: '(123) 456-7890' }
    case 'radio':
      return {
        ...baseField,
        label: 'Multiple Choice',
        choices: [
          { value: 'option1', text: 'Option 1' },
          { value: 'option2', text: 'Option 2' },
          { value: 'option3', text: 'Option 3' }
        ]
      }
    case 'checkbox':
      return {
        ...baseField,
        label: 'Checkboxes',
        allowMultiple: true,
        choices: [
          { value: 'option1', text: 'Option 1' },
          { value: 'option2', text: 'Option 2' },
          { value: 'option3', text: 'Option 3' }
        ]
      }
    case 'select':
      return {
        ...baseField,
        label: 'Dropdown',
        placeholder: 'Select an option...',
        choices: [
          { value: 'option1', text: 'Option 1' },
          { value: 'option2', text: 'Option 2' },
          { value: 'option3', text: 'Option 3' }
        ]
      }
    case 'date':
      return { ...baseField, label: 'Date' }
    case 'file':
      return {
        ...baseField,
        label: 'File Upload',
        accept: '*',
        maxFileSize: 10485760, // 10MB
        allowMultiple: false
      }
    case 'rating':
      return {
        ...baseField,
        label: 'Rating',
        ratingMax: 5
      }
    case 'signature':
      return {
        ...baseField,
        label: 'Signature'
      }
    // Static Display Elements
    case 'text_element':
      return {
        ...baseField,
        label: '',  // Elements don't need labels in the traditional sense
        content: ''  // Empty by default, supports markdown: **bold**, *italic*, [links](url)
      }
    case 'heading':
      return {
        ...baseField,
        label: 'Section Heading',
        headingLevel: 2 as 1 | 2 | 3 | 4,
        description: ''
      }
    case 'image_element':
      return {
        ...baseField,
        label: '',  // Elements don't need labels
        imageUrl: '',
        imageObjectKey: '',
        imageAlt: 'Form image'
      }
    default:
      return baseField
  }
}

/**
 * Create default section
 */
function createDefaultSection(): FormSection {
  return {
    id: nanoid(),
    title: 'New Section',
    fields: []
  }
}

export const useFormBuilderStore = create<FormBuilderState>((set, get) => ({
  // Initial state
  formSchema: null,
  selectedFieldId: null,
  currentPageIndex: 0,
  previewMode: 'desktop',
  isDirty: false,
  history: [],
  historyIndex: -1,

  // Form actions
  initializeForm: (schema) => {
    // Apply migration for new 2-column layout if schema provided
    let initialSchema = schema ? migrateFormSchema(schema) : createDefaultFormSchema()
    
    // Ensure at least one page exists
    if (!initialSchema.pages || initialSchema.pages.length === 0) {
        initialSchema = {
            ...initialSchema,
            pages: [
                {
                    id: nanoid(),
                    title: 'Page 1',
                    sections: [],
                    order: 0
                }
            ]
        }
    }

    set({
      formSchema: initialSchema,
      history: [initialSchema],
      historyIndex: 0,
      isDirty: false,
      selectedFieldId: null,
      currentPageIndex: 0
    })
  },

  setFormSchema: (schema) => {
    set({ formSchema: schema, isDirty: true })
    get().pushToHistory()
  },

  updateFormSettings: (updates) => {
    const { formSchema } = get()
    if (!formSchema) return

    set({
      formSchema: {
        ...formSchema,
        settings: { ...formSchema.settings, ...updates }
      },
      isDirty: true
    })
    get().pushToHistory()
  },

  updateFormTheme: (updates) => {
    const { formSchema } = get()
    if (!formSchema) return

    set({
      formSchema: {
        ...formSchema,
        theme: { ...formSchema.theme, ...updates }
      },
      isDirty: true
    })
    get().pushToHistory()
  },

  // Page actions
  addPage: () => {
    const { formSchema } = get()
    if (!formSchema) return

    const newPage: FormPage = {
      id: nanoid(),
      title: `Page ${formSchema.pages.length + 1}`,
      sections: [],
      order: formSchema.pages.length
    }

    set({
      formSchema: {
        ...formSchema,
        pages: [...formSchema.pages, newPage]
      },
      isDirty: true
    })
    get().pushToHistory()
  },

  removePage: (pageIndex) => {
    const { formSchema, currentPageIndex } = get()
    if (!formSchema || formSchema.pages.length <= 1) return

    const newPages = formSchema.pages.filter((_, idx) => idx !== pageIndex)
    // Adjust currentPageIndex if needed
    let newCurrentPageIndex = currentPageIndex
    if (currentPageIndex >= newPages.length) {
      newCurrentPageIndex = newPages.length - 1
    } else if (currentPageIndex > pageIndex) {
      newCurrentPageIndex = currentPageIndex - 1
    }

    set({
      formSchema: {
        ...formSchema,
        pages: newPages
      },
      currentPageIndex: newCurrentPageIndex,
      isDirty: true
    })
    get().pushToHistory()
  },

  setCurrentPage: (index) => {
    const { formSchema } = get()
    if (!formSchema || index < 0 || index >= formSchema.pages.length) return
    set({ currentPageIndex: index })
  },

  reorderPages: (fromIndex, toIndex) => {
    const { formSchema, currentPageIndex } = get()
    if (!formSchema) return

    const newPages = [...formSchema.pages]
    const [movedPage] = newPages.splice(fromIndex, 1)
    newPages.splice(toIndex, 0, movedPage)

    // Update order values
    newPages.forEach((page, idx) => {
      page.order = idx
    })

    // Adjust currentPageIndex to follow the moved page if it was selected
    let newCurrentPageIndex = currentPageIndex
    if (currentPageIndex === fromIndex) {
      newCurrentPageIndex = toIndex
    } else if (fromIndex < currentPageIndex && toIndex >= currentPageIndex) {
      newCurrentPageIndex = currentPageIndex - 1
    } else if (fromIndex > currentPageIndex && toIndex <= currentPageIndex) {
      newCurrentPageIndex = currentPageIndex + 1
    }

    set({
      formSchema: {
        ...formSchema,
        pages: newPages
      },
      currentPageIndex: newCurrentPageIndex,
      isDirty: true
    })
    get().pushToHistory()
  },

  updatePage: (pageIndex, updates) => {
    const { formSchema } = get()
    if (!formSchema) return

    const newPages = [...formSchema.pages]
    newPages[pageIndex] = { ...newPages[pageIndex], ...updates }

    set({
      formSchema: {
        ...formSchema,
        pages: newPages
      },
      isDirty: true
    })
    get().pushToHistory()
  },

  // Section actions
  addSection: (pageIndex = 0) => {
    const { formSchema } = get()
    if (!formSchema) return

    const newSection = createDefaultSection()
    const newPages = [...formSchema.pages]
    
    // Safety check: ensure page exists
    if (!newPages[pageIndex]) {
        console.error(`Page at index ${pageIndex} not found`)
        return
    }

    newPages[pageIndex] = {
      ...newPages[pageIndex],
      sections: [...(newPages[pageIndex].sections || []), newSection]
    }

    set({
      formSchema: {
        ...formSchema,
        pages: newPages
      },
      isDirty: true
    })
    get().pushToHistory()
  },

  removeSection: (sectionIndex, pageIndex = 0) => {
    const { formSchema } = get()
    if (!formSchema) return

    const newPages = [...formSchema.pages]
    newPages[pageIndex] = {
      ...newPages[pageIndex],
      sections: newPages[pageIndex].sections.filter((_, idx) => idx !== sectionIndex)
    }

    set({
      formSchema: {
        ...formSchema,
        pages: newPages
      },
      isDirty: true
    })
    get().pushToHistory()
  },

  updateSection: (sectionIndex, updates, pageIndex = 0) => {
    const { formSchema } = get()
    if (!formSchema) return

    const newPages = [...formSchema.pages]
    const newSections = [...newPages[pageIndex].sections]
    newSections[sectionIndex] = { ...newSections[sectionIndex], ...updates }
    newPages[pageIndex] = { ...newPages[pageIndex], sections: newSections }

    set({
      formSchema: {
        ...formSchema,
        pages: newPages
      },
      isDirty: true
    })
    get().pushToHistory()
  },

  moveSection: (fromIndex, toIndex, pageIndex = 0) => {
    const { formSchema } = get()
    if (!formSchema) return

    const newPages = [...formSchema.pages]
    const sections = [...newPages[pageIndex].sections]
    const [moved] = sections.splice(fromIndex, 1)
    sections.splice(toIndex, 0, moved)
    newPages[pageIndex] = { ...newPages[pageIndex], sections }

    set({
      formSchema: {
        ...formSchema,
        pages: newPages
      },
      isDirty: true
    })
    get().pushToHistory()
  },

  // Field actions
  addField: (fieldType, sectionIndex, fieldIndex, pageIndex = 0) => {
    const { formSchema } = get()
    if (!formSchema) return

    const newField = createDefaultField(fieldType)
    const newPages = [...formSchema.pages]
    const newSections = [...newPages[pageIndex].sections]
    const newFields = [...newSections[sectionIndex].fields]

    newFields.splice(fieldIndex, 0, newField)
    newSections[sectionIndex] = { ...newSections[sectionIndex], fields: newFields }
    newPages[pageIndex] = { ...newPages[pageIndex], sections: newSections }

    set({
      formSchema: {
        ...formSchema,
        pages: newPages
      },
      isDirty: true,
      selectedFieldId: newField.id
    })
    get().pushToHistory()
  },

  removeField: (sectionIndex, fieldIndex, pageIndex = 0) => {
    const { formSchema, selectedFieldId } = get()
    if (!formSchema) return

    const newPages = [...formSchema.pages]
    const newSections = [...newPages[pageIndex].sections]
    const removedField = newSections[sectionIndex].fields[fieldIndex]

    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      fields: newSections[sectionIndex].fields.filter((_, idx) => idx !== fieldIndex)
    }
    newPages[pageIndex] = { ...newPages[pageIndex], sections: newSections }

    set({
      formSchema: {
        ...formSchema,
        pages: newPages
      },
      isDirty: true,
      selectedFieldId: selectedFieldId === removedField.id ? null : selectedFieldId
    })
    get().pushToHistory()
  },

  updateField: (fieldId, updates) => {
    const { formSchema } = get()
    if (!formSchema) return

    const newPages = formSchema.pages.map(page => ({
      ...page,
      sections: page.sections.map(section => ({
        ...section,
        fields: section.fields.map(field =>
          field.id === fieldId ? { ...field, ...updates } : field
        )
      }))
    }))

    set({
      formSchema: {
        ...formSchema,
        pages: newPages
      },
      isDirty: true
    })
    get().pushToHistory()
  },

  moveField: (fromSection, fromField, toSection, toField, pageIndex = 0) => {
    const { formSchema } = get()
    if (!formSchema) return

    const newPages = [...formSchema.pages]
    const newSections = [...newPages[pageIndex].sections]

    // Remove from source
    const field = newSections[fromSection].fields[fromField]
    newSections[fromSection] = {
      ...newSections[fromSection],
      fields: newSections[fromSection].fields.filter((_, idx) => idx !== fromField)
    }

    // Add to destination
    const targetFields = [...newSections[toSection].fields]
    targetFields.splice(toField, 0, field)
    newSections[toSection] = { ...newSections[toSection], fields: targetFields }

    newPages[pageIndex] = { ...newPages[pageIndex], sections: newSections }

    set({
      formSchema: {
        ...formSchema,
        pages: newPages
      },
      isDirty: true
    })
    get().pushToHistory()
  },

  duplicateField: (sectionIndex, fieldIndex, pageIndex = 0) => {
    const { formSchema } = get()
    if (!formSchema) return

    const newPages = [...formSchema.pages]
    const field = newPages[pageIndex].sections[sectionIndex].fields[fieldIndex]
    const duplicatedField = {
      ...field,
      id: nanoid(),
      name: `${field.name}_copy_${nanoid(4)}`
    }

    const newSections = [...newPages[pageIndex].sections]
    const newFields = [...newSections[sectionIndex].fields]
    newFields.splice(fieldIndex + 1, 0, duplicatedField)
    newSections[sectionIndex] = { ...newSections[sectionIndex], fields: newFields }
    newPages[pageIndex] = { ...newPages[pageIndex], sections: newSections }

    set({
      formSchema: {
        ...formSchema,
        pages: newPages
      },
      isDirty: true,
      selectedFieldId: duplicatedField.id
    })
    get().pushToHistory()
  },

  // Simplified Column Layout actions (2-column only)
  addHalfWidthField: (fieldType, sectionIndex, columnIndex, pageIndex = 0) => {
    const { formSchema } = get()
    if (!formSchema) return

    const newPages = [...formSchema.pages]
    const newSections = [...newPages[pageIndex].sections]
    const fields = [...newSections[sectionIndex].fields]

    // Create new field with half-width settings
    const newField: FormFieldBase = {
      ...createDefaultField(fieldType),
      colSpan: 6,
      columnIndex
    }

    // Add to end of section
    fields.push(newField)

    newSections[sectionIndex] = { ...newSections[sectionIndex], fields }
    newPages[pageIndex] = { ...newPages[pageIndex], sections: newSections }

    set({
      formSchema: { ...formSchema, pages: newPages },
      isDirty: true,
      selectedFieldId: newField.id
    })
    get().pushToHistory()
  },

  setFieldWidth: (sectionIndex, fieldIndex, colSpan, columnIndex, pageIndex = 0) => {
    const { formSchema } = get()
    if (!formSchema) return

    const newPages = [...formSchema.pages]
    const newSections = [...newPages[pageIndex].sections]
    const fields = [...newSections[sectionIndex].fields]

    if (!fields[fieldIndex]) return

    // Update field with new width
    fields[fieldIndex] = {
      ...fields[fieldIndex],
      colSpan,
      columnIndex: colSpan === 12 ? undefined : (columnIndex ?? 0)
    }

    newSections[sectionIndex] = { ...newSections[sectionIndex], fields }
    newPages[pageIndex] = { ...newPages[pageIndex], sections: newSections }

    set({
      formSchema: { ...formSchema, pages: newPages },
      isDirty: true
    })
    get().pushToHistory()
  },

  // Selection actions
  selectField: (fieldId) => {
    set({ selectedFieldId: fieldId })
  },

  getSelectedField: () => {
    const { formSchema, selectedFieldId } = get()
    if (!formSchema || !selectedFieldId) return null

    for (const page of formSchema.pages) {
      for (const section of page.sections) {
        const field = section.fields.find(f => f.id === selectedFieldId)
        if (field) return field
      }
    }
    return null
  },

  // Preview actions
  setPreviewMode: (mode) => {
    set({ previewMode: mode })
  },

  // Dirty state actions
  setDirty: (dirty) => {
    set({ isDirty: dirty })
  },

  // History actions
  pushToHistory: () => {
    const { formSchema, history, historyIndex } = get()
    if (!formSchema) return

    // Remove any history after current index (for redo)
    const newHistory = history.slice(0, historyIndex + 1)

    // Add current state
    newHistory.push(formSchema)

    // Keep only last 50 states to prevent memory issues
    const trimmedHistory = newHistory.slice(-50)

    set({
      history: trimmedHistory,
      historyIndex: trimmedHistory.length - 1
    })
  },

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return

    const newIndex = historyIndex - 1
    set({
      formSchema: history[newIndex],
      historyIndex: newIndex,
      isDirty: true
    })
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return

    const newIndex = historyIndex + 1
    set({
      formSchema: history[newIndex],
      historyIndex: newIndex,
      isDirty: true
    })
  },

  canUndo: () => {
    const { historyIndex } = get()
    return historyIndex > 0
  },

  canRedo: () => {
    const { history, historyIndex } = get()
    return historyIndex < history.length - 1
  }
}))
