import { TextField } from '@/components/forms/fields/input/TextField'
import { TextAreaField } from '@/components/forms/fields/input/TextAreaField'
import { EmailField } from '@/components/forms/fields/input/EmailField'
import { PhoneField } from '@/components/forms/fields/input/PhoneField'
import { RadioField } from '@/components/forms/fields/selection/RadioField'
import { CheckboxField } from '@/components/forms/fields/selection/CheckboxField'
import { SelectField } from '@/components/forms/fields/selection/SelectField'
import { DateField } from '@/components/forms/fields/datetime/DateField'
import { FileField } from '@/components/forms/fields/advanced/FileField'
import { RatingField } from '@/components/forms/fields/advanced/RatingField'
import { SignatureField } from '@/components/forms/fields/advanced/SignatureField'
import { TextElement } from '@/components/forms/fields/elements/TextElement'
import { HeadingElement } from '@/components/forms/fields/elements/HeadingElement'
import { ImageElement } from '@/components/forms/fields/elements/ImageElement'
import { ComponentType } from 'react'

export interface FieldRegistryEntry {
  component: ComponentType<any>
  icon: string
  category: 'input' | 'selection' | 'datetime' | 'advanced' | 'structural' | 'element'
  label: string
  description: string
  isElement?: boolean  // True for static display elements (not form inputs)
}

export const FIELD_REGISTRY: Record<string, FieldRegistryEntry> = {
  text: {
    component: TextField,
    icon: 'Type',
    category: 'input',
    label: 'Short Text',
    description: 'Single-line text input'
  },
  textarea: {
    component: TextAreaField,
    icon: 'AlignLeft',
    category: 'input',
    label: 'Long Text',
    description: 'Multi-line text area'
  },
  // SurveyJS alias for textarea
  comment: {
    component: TextAreaField,
    icon: 'AlignLeft',
    category: 'input',
    label: 'Long Text',
    description: 'Multi-line text area (SurveyJS compatibility)'
  },
  email: {
    component: EmailField,
    icon: 'Mail',
    category: 'input',
    label: 'Email',
    description: 'Email address input'
  },
  phone: {
    component: PhoneField,
    icon: 'Phone',
    category: 'input',
    label: 'Phone',
    description: 'Phone number input with formatting'
  },
  radio: {
    component: RadioField,
    icon: 'CircleDot',
    category: 'selection',
    label: 'Multiple Choice',
    description: 'Radio button group (single selection)'
  },
  checkbox: {
    component: CheckboxField,
    icon: 'CheckSquare',
    category: 'selection',
    label: 'Checkboxes',
    description: 'Multiple selection checkboxes'
  },
  select: {
    component: SelectField,
    icon: 'ChevronDown',
    category: 'selection',
    label: 'Dropdown',
    description: 'Dropdown select menu'
  },
  date: {
    component: DateField,
    icon: 'Calendar',
    category: 'datetime',
    label: 'Date',
    description: 'Date picker with calendar'
  },
  file: {
    component: FileField,
    icon: 'Upload',
    category: 'advanced',
    label: 'File Upload',
    description: 'File upload with drag-and-drop, multiple files, and preview'
  },
  rating: {
    component: RatingField,
    icon: 'Star',
    category: 'advanced',
    label: 'Rating',
    description: 'Star rating input'
  },
  signature: {
    component: SignatureField,
    icon: 'Pen',
    category: 'advanced',
    label: 'Signature',
    description: 'E-signature capture with canvas'
  },
  // Static Display Elements (not form inputs)
  text_element: {
    component: TextElement,
    icon: 'FileText',
    category: 'element',
    label: 'Text Block',
    description: 'Rich text content with formatting',
    isElement: true
  },
  heading: {
    component: HeadingElement,
    icon: 'Heading',
    category: 'element',
    label: 'Heading',
    description: 'Section heading (H1-H4)',
    isElement: true
  },
  image_element: {
    component: ImageElement,
    icon: 'Image',
    category: 'element',
    label: 'Image',
    description: 'Display an uploaded image',
    isElement: true
  }
}

/**
 * Get field component by type
 */
export function getFieldComponent(type: string) {
  return FIELD_REGISTRY[type]?.component
}

/**
 * Get all fields by category
 */
export function getFieldsByCategory(category: FieldRegistryEntry['category']) {
  return Object.entries(FIELD_REGISTRY)
    .filter(([_, entry]) => entry.category === category)
    .map(([type, entry]) => ({ type, ...entry }))
}

/**
 * Get all available field types
 */
export function getAllFieldTypes() {
  return Object.keys(FIELD_REGISTRY)
}

/**
 * Check if a field type exists in the registry
 */
export function isValidFieldType(type: string): boolean {
  return type in FIELD_REGISTRY
}

/**
 * Get fields filtered by whether they are static elements or form inputs
 * @param isElement - true to get static elements, false to get form inputs
 */
export function getFieldsByElement(isElement: boolean) {
  return Object.entries(FIELD_REGISTRY)
    .filter(([_, entry]) => (entry.isElement ?? false) === isElement)
    .map(([type, entry]) => ({ type, ...entry }))
}

/**
 * Check if a field type is a static element (not a form input)
 */
export function isElementType(type: string): boolean {
  return FIELD_REGISTRY[type]?.isElement ?? false
}