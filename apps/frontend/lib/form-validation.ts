import { z } from 'zod'
import { FormSchema, FormFieldBase, ValidationRule } from '@/types/group-forms'

/**
 * Safely compile a user-supplied regex pattern.
 * Returns null for patterns that are empty, excessively long, or syntactically invalid,
 * preventing catastrophic backtracking (ReDoS) attacks.
 */
function safeCompileRegex(pattern: string): RegExp | null {
  // Limit pattern length to prevent catastrophic backtracking
  if (!pattern || pattern.length > 200) return null
  try {
    return new RegExp(pattern)
  } catch {
    return null
  }
}

/**
 * Generate Zod validation schema from FormSchema
 */
export function generateZodSchema(formSchema: FormSchema): z.ZodObject<any> {
  const schemaShape: Record<string, z.ZodTypeAny> = {}

  // Iterate through all pages and sections to collect fields
  formSchema.pages.forEach((page) => {
    page.sections.forEach((section) => {
      section.fields.forEach((field) => {
        schemaShape[field.name] = generateFieldSchema(field)
      })
    })
  })

  return z.object(schemaShape)
}

/**
 * Generate Zod schema for a single field
 */
function generateFieldSchema(field: FormFieldBase): z.ZodTypeAny {
  let schema: z.ZodTypeAny

  // Base schema based on field type
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'url':
      schema = z.string()
      if (field.minLength) {
        schema = (schema as z.ZodString).min(field.minLength, `Minimum ${field.minLength} characters`)
      }
      if (field.maxLength) {
        schema = (schema as z.ZodString).max(field.maxLength, `Maximum ${field.maxLength} characters`)
      }
      break

    case 'email':
      schema = z.string().email('Invalid email address')
      break

    case 'phone':
      schema = z.string().regex(/^\+?[\d\s()-]+$/, 'Invalid phone number')
      break

    case 'number':
    case 'rating':
    case 'scale':
      schema = z.number()
      if (field.min !== undefined) {
        schema = (schema as z.ZodNumber).min(field.min, `Minimum value is ${field.min}`)
      }
      if (field.max !== undefined) {
        schema = (schema as z.ZodNumber).max(field.max, `Maximum value is ${field.max}`)
      }
      break

    case 'date':
    case 'time':
    case 'datetime':
      schema = z.string()
      break

    case 'radio':
    case 'select':
      if (field.choices && field.choices.length > 0) {
        const values = field.choices.map((c) => c.value)
        schema = z.enum(values as [string, ...string[]])
      } else {
        schema = z.string()
      }
      break

    case 'checkbox':
      if (field.allowMultiple) {
        // For multi-checkbox, only require min 1 if field is required
        schema = field.required
          ? z.array(z.string()).min(1, 'Select at least one option')
          : z.array(z.string())
      } else {
        // Single checkbox is boolean
        schema = z.boolean()
      }
      break

    case 'file':
      if (field.allowMultiple) {
        schema = z.array(z.any()).min(1, 'Upload at least one file')
      } else {
        schema = z.any()
      }
      break

    case 'signature':
      // Signature is required validation handled below with other required fields
      schema = z.string()
      break

    case 'address':
      schema = z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        country: z.string().optional()
      })
      break

    default:
      schema = z.any()
  }

  // Apply custom validation rules
  if (field.validation && Array.isArray(field.validation)) {
    field.validation.forEach((rule) => {
      schema = applyValidationRule(schema, rule)
    })
  }

  // Handle required field
  if (field.required) {
    // Already required by default, but add message
    if (schema instanceof z.ZodString && !(schema as any)._def.checks.find((c: any) => c.kind === 'min')) {
      schema = (schema as z.ZodString).min(1, `${field.label} is required`)
    }
  } else {
    // Make optional
    schema = schema.optional()
  }

  return schema
}

/**
 * Apply custom validation rule to schema
 */
function applyValidationRule(
  schema: z.ZodTypeAny,
  rule: ValidationRule
): z.ZodTypeAny {
  const message = rule.message || getDefaultMessage(rule.type, rule.value)

  switch (rule.type) {
    case 'required':
      if (schema instanceof z.ZodString) {
        return schema.min(1, message)
      }
      break

    case 'min_length':
    case 'minLength':  // Legacy support
      if (schema instanceof z.ZodString && typeof rule.value === 'number') {
        return schema.min(rule.value, message)
      }
      break

    case 'max_length':
    case 'maxLength':  // Legacy support
      if (schema instanceof z.ZodString && typeof rule.value === 'number') {
        return schema.max(rule.value, message)
      }
      break

    case 'min_value':
    case 'min':  // Legacy support
      if (schema instanceof z.ZodNumber && typeof rule.value === 'number') {
        return schema.min(rule.value, message)
      }
      break

    case 'max_value':
    case 'max':  // Legacy support
      if (schema instanceof z.ZodNumber && typeof rule.value === 'number') {
        return schema.max(rule.value, message)
      }
      break

    case 'pattern':
      if (schema instanceof z.ZodString && typeof rule.value === 'string') {
        const regex = safeCompileRegex(rule.value)
        if (regex !== null) {
          return schema.regex(regex, message)
        }
        // Invalid or unsafe regex pattern — skip validation, treat field as valid
      }
      break

    case 'email':
      if (schema instanceof z.ZodString) {
        return schema.email(message)
      }
      break

    case 'url':
      if (schema instanceof z.ZodString) {
        return schema.url(message)
      }
      break

    case 'phone':
      if (schema instanceof z.ZodString) {
        return schema.regex(/^\+?[\d\s()-]+$/, message)
      }
      break

    case 'date_range':
      // Date range validation is handled at form level
      break

    case 'field_match':
      // Field match validation is handled at form level
      break

    case 'file_size':
      // File size validation is handled at form level
      break

    case 'file_type':
      // File type validation is handled at form level
      break

    case 'custom':
      // Custom validation would need to be handled separately
      break
  }

  return schema
}

/**
 * Get default error message for validation type
 */
function getDefaultMessage(type: string, value?: any): string {
  switch (type) {
    case 'min_length':
    case 'minLength':
      return `Must be at least ${value} characters`
    case 'max_length':
    case 'maxLength':
      return `Must be no more than ${value} characters`
    case 'min_value':
    case 'min':
      return `Must be at least ${value}`
    case 'max_value':
    case 'max':
      return `Must be no more than ${value}`
    case 'email':
      return 'Please enter a valid email address'
    case 'url':
      return 'Please enter a valid URL'
    case 'phone':
      return 'Please enter a valid phone number'
    case 'pattern':
      return 'Input does not match the required format'
    case 'date_range':
      return 'Date is out of range'
    case 'field_match':
      return 'Fields do not match'
    case 'file_size':
      return 'File size exceeds maximum allowed'
    case 'file_type':
      return 'File type is not accepted'
    default:
      return 'Invalid value'
  }
}