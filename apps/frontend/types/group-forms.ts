/**
 * Group Forms Types - Version 2.0
 * Modern form builder type system (SurveyJS removed)
 */

// ============================================
// CORE FIELD TYPES
// ============================================

export type FormFieldType =
  // Basic Input Fields
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'url'
  // Date/Time Fields
  | 'date'
  | 'time'
  | 'datetime'
  // Choice Fields
  | 'radio'
  | 'checkbox'
  | 'select'
  // Advanced Fields
  | 'file'
  | 'signature'
  | 'address'
  | 'rating'
  | 'scale'
  | 'smart_table'
  // Structural Elements
  | 'section'
  | 'heading'
  | 'divider'
  // Static Display Elements
  | 'text_element'
  | 'image_element'
  // Calculated
  | 'calculated'

// ============================================
// VALIDATION SYSTEM
// ============================================

export interface ValidationRule {
  type:
    | 'required'
    | 'min_length'      // String length validation
    | 'max_length'      // String length validation
    | 'min_value'       // Number range validation
    | 'max_value'       // Number range validation
    | 'pattern'         // Regex pattern
    | 'email'           // Email format
    | 'url'             // URL format
    | 'phone'           // Phone number format
    | 'date_range'      // Date range validation
    | 'field_match'     // Match another field (e.g., confirm password)
    | 'file_size'       // File size validation
    | 'file_type'       // File type validation
    | 'custom'          // Custom validator function
    // Legacy support (will be converted)
    | 'minLength' | 'maxLength' | 'min' | 'max'

  value?: any           // Generic value (number for min/max, string for pattern)
  message?: string      // Custom error message (optional)

  // Date range specific
  minDate?: string      // ISO date string
  maxDate?: string      // ISO date string

  // Field match specific
  matchFieldName?: string       // Name of field to match
  matchFieldLabel?: string      // Label for error message

  // File validation specific
  maxFileSize?: number          // In bytes
  acceptedTypes?: string[]      // MIME types or extensions
  maxFiles?: number             // For multiple file uploads

  // Custom validator
  customValidator?: (value: any) => boolean

  // Calculated fields
  formula?: string
}

// ============================================
// CONDITIONAL LOGIC SYSTEM
// ============================================

export type ConditionalOperator =
  | 'equals'
  | 'notEquals'
  | 'not_equals'  // Alternative snake_case naming
  | 'contains'
  | 'notContains'
  | 'not_contains'  // Alternative snake_case naming
  | 'greaterThan'
  | 'greater_than'  // Alternative snake_case naming
  | 'lessThan'
  | 'less_than'  // Alternative snake_case naming
  | 'greaterThanOrEqual'
  | 'greater_than_or_equal'  // Alternative snake_case naming
  | 'lessThanOrEqual'
  | 'less_than_or_equal'  // Alternative snake_case naming
  | 'isEmpty'
  | 'is_empty'  // Alternative snake_case naming
  | 'isNotEmpty'
  | 'is_not_empty'  // Alternative snake_case naming
  | 'startsWith'
  | 'starts_with'  // Alternative snake_case naming
  | 'endsWith'
  | 'ends_with'  // Alternative snake_case naming
  | 'in'
  | 'not_in'

export type ConditionalAction =
  | 'show'
  | 'hide'
  | 'require'
  | 'unrequire'
  | 'skip'      // Skip to specific page
  | 'enable'
  | 'disable'
  | 'set_value'

// Condition object for conditional logic
export interface Condition {
  fieldId: string
  operator: ConditionalOperator
  value: any
}

export interface ConditionalRule {
  id: string
  condition?: Condition  // Single condition
  conditions?: Condition[]  // Multiple conditions (AND/OR)
  logicOperator?: 'and' | 'or'  // For multiple conditions
  action: ConditionalAction
  targetFieldIds?: string[]  // For show/hide/require
  targetPageId?: string      // For skip action
}

// Type alias for backward compatibility with phase 5 implementation
export type ConditionalLogic = ConditionalRule

// ============================================
// FIELD CONFIGURATION
// ============================================

export interface ChoiceOption {
  value: string
  text: string
  icon?: string
  color?: string
}

export interface FormFieldBase {
  id: string
  type: FormFieldType
  name: string
  label: string

  // Common Properties
  required?: boolean
  placeholder?: string
  helpText?: string
  description?: string  // Field description/help text
  defaultValue?: any

  // SIG Request Form: Marks field as locked (cannot be edited/deleted)
  // Only enforced when form.is_sig_request_form is true
  isDefaultField?: boolean

  // Accessibility
  ariaLabel?: string
  ariaDescribedBy?: string

  // Validation
  validation?: ValidationRule[] | {
    formula?: string  // For calculated fields
    [key: string]: any
  }

  // Conditional Logic
  conditionalLogic?: ConditionalRule[]

  // Layout Control (CSS Grid 12-column system)
  colSpan?: number  // 1-12, default 12 (full width)
  order?: number

  // Column Layout (Independent column containers)
  columnIndex?: number   // Which column this field belongs to (0-based, default: 0)
  columnWidth?: number   // Width of column in 12-col grid (shared by all fields in column)

  // Field-Specific Properties
  choices?: ChoiceOption[]      // For radio, checkbox, select
  maxLength?: number            // For text, textarea
  minLength?: number            // For text, textarea
  min?: number                  // For number, date
  max?: number                  // For number, date
  step?: number                 // For number
  rows?: number                 // For textarea
  accept?: string               // For file upload (MIME types)
  maxFileSize?: number          // For file upload (bytes)
  allowMultiple?: boolean       // For file upload, checkbox
  ratingMax?: number            // For rating field
  scaleMin?: number             // For scale field
  scaleMax?: number             // For scale field
  scaleStep?: number            // For scale field
  formula?: string              // For calculated field
  
  // Smart Table Properties
  columns?: FormFieldBase[]     // Recursive definition for table columns
  allowAdd?: boolean
  allowDelete?: boolean
  prefilledRows?: Record<string, any>[]


  // Static Display Element Properties
  content?: string              // For text_element (HTML/rich text)
  headingLevel?: 1 | 2 | 3 | 4  // For heading element (H1-H4)
  imageUrl?: string             // For image_element (MinIO URL)
  imageObjectKey?: string       // For image_element (MinIO object key)
  imageAlt?: string             // For image_element accessibility

  // PDF Overlay Mapping (Epic 8)
  overlay?: {
    x: number
    y: number
    pageIndex: number
    width?: number
    height?: number
  }
}

// ============================================
// FORM STRUCTURE
// ============================================

export interface FormSection {
  id: string
  title?: string
  description?: string
  fields: FormFieldBase[]
  conditionalLogic?: ConditionalRule[]
  backgroundColor?: string
}

export interface FormPage {
  id: string
  title: string
  description?: string
  sections: FormSection[]
  order: number
  conditionalLogic?: ConditionalRule[]  // Page-level logic for skip logic
}

// ============================================
// FORM SETTINGS
// ============================================

export interface FormSettings {
  title?: string                  // Form title (for display in builder)
  showTitle?: boolean             // Show title when rendering form
  renderMode: 'all-in-one' | 'conversational'
  showProgress: boolean
  progressStyle?: 'bar' | 'steps' | 'percentage'
  allowSave: boolean              // Save and continue later
  allowBack: boolean              // Allow going back to previous pages
  saveButtonText?: string
  successMessage: string
  redirectUrl?: string            // Redirect after successful submission
  confirmBeforeSubmit?: boolean
  confirmMessage?: string
  requireAuthentication?: boolean
  allowAnonymous?: boolean
  captchaEnabled?: boolean
  maxSubmissionsPerUser?: number
  submissionDeadline?: string     // ISO 8601 date
  oneResponsePerUser?: boolean    // Limit to one submission per user (maps to !allow_multiple_submissions)
  sig_ids?: number[]              // SIG visibility restriction
  backgroundPdfUrl?: string       // For PDF Overlay Mapping
}

// ============================================
// THEME CONFIGURATION
// ============================================

export interface FormThemeConfig {
  mode: 'light' | 'dark' | 'auto'
  primary_color?: string          // Hex color
  secondary_color?: string        // Hex color
  background_color?: string       // Hex color
  text_color?: string            // Hex color
  border_radius?: number         // px
  logo_url?: string              // MinIO object key
  show_logo?: boolean
  font_family?: 'system' | 'sans' | 'serif' | 'mono'
  custom_css?: string            // Advanced: custom CSS overrides
}

// ============================================
// MAIN FORM SCHEMA (v2.0)
// ============================================

export interface FormSchema {
  version: string              // "2.0"
  pages: FormPage[]
  settings: FormSettings
  theme: FormThemeConfig
  metadata?: {
    createdBy?: string
    createdAt?: string
    lastModifiedBy?: string
    lastModifiedAt?: string
    tags?: string[]
  }
}

// ============================================
// DATABASE MODELS
// ============================================

export type FormType = 'application' | 'general' | 'sub_group_application' | 'survey' | 'registration'
export type SubmissionStatus = 'received' | 'pending' | 'approved' | 'rejected' | 'draft'

export interface GroupForm {
  id: number
  group_id: number
  slug: string                   // URL-friendly identifier (unique per group)
  targetSheetId?: string | null  // Linked live table (project-scoped forms)
  title: string
  description?: string
  form_type: FormType
  form_schema: FormSchema        // API returns form_schema (renamed from form_json in backend)
  form_json?: FormSchema         // Legacy alias for backwards compatibility
  version: string                // "2.0"
  is_active: boolean
  is_published: boolean          // Draft until published
  is_sig_request_form?: boolean  // SIG request forms have locked default fields
  allow_multiple_submissions: boolean
  requires_approval: boolean
  visible_to_non_members: boolean
  visible_to_members: boolean
  target_sub_group_id?: number
  created_by: string
  createdAt: string
  updatedAt: string

  // Analytics metadata
  submission_count?: number
  pending_count?: number         // Number of pending submissions requiring review
  view_count?: number
  completion_rate?: number       // Percentage of started forms that were completed
  avg_completion_time?: number   // Seconds

  // User-specific state (from available forms endpoint)
  has_submission?: boolean       // Whether current user has already submitted this form
  submission_id?: number         // ID of user's latest submission
  submission_status?: SubmissionStatus  // Status of user's latest submission
  submission_reviewed_at?: string  // When submission was reviewed
  submission_read_at?: string      // When user acknowledged the review
  has_unread_review?: boolean      // True if submission reviewed but not read
}

export interface GroupFormSubmission {
  id: number
  form_id: number
  group_id: number
  user_id: string
  response_data: Record<string, any>  // Field name -> value mapping
  status: SubmissionStatus
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  read_at?: string                    // When user acknowledged the review result
  submitted_at: string
  updatedAt: string
  pdf_filename?: string
  pdf_url?: string

  // Metadata
  submission_time?: number       // Time taken to complete (seconds)
  device_type?: 'desktop' | 'tablet' | 'mobile'
  ip_address?: string
  user_agent?: string

  // Relations (populated by backend)
  user?: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
  reviewer?: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
  form?: GroupForm
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateFormData {
  title: string
  description?: string
  form_type: FormType
  form_json: FormSchema
  is_active?: boolean
  is_published?: boolean
  allow_multiple_submissions?: boolean
  requires_approval?: boolean
  visible_to_non_members?: boolean
  visible_to_members?: boolean
  target_sub_group_id?: number
  sig_ids?: number[]  // SIG visibility restriction
  folderId?: number
  groupSlug?: string  // Optional project slug for project-scoped association
}

export interface UpdateFormData {
  title?: string
  description?: string
  form_json?: FormSchema
  is_active?: boolean
  is_published?: boolean
  allow_multiple_submissions?: boolean
  requires_approval?: boolean
  visible_to_non_members?: boolean
  visible_to_members?: boolean
  sig_ids?: number[]  // SIG visibility restriction
  folderId?: number
}

export interface SubmitFormData {
  response_data: Record<string, any>
  device_type?: 'desktop' | 'tablet' | 'mobile'
  submission_time?: number
}

export interface ReviewSubmissionData {
  status: 'approved' | 'rejected'
  review_notes?: string
}

export interface FormsSettingsData {
  forms_enabled?: boolean
  requires_application_form?: boolean
  active_application_form_id?: number | null
  sig_requests_accepting?: boolean  // Whether accepting new SIG creation requests
}

export interface AvailableFormsResponse {
  forms: GroupForm[]
  is_member: boolean
  total_unread_reviews: number  // Count of forms with unread review results
}

// ============================================
// FORM ANALYTICS TYPES (Phase 8)
// ============================================

export interface FormAnalytics {
  form_id: number
  total_submissions: number
  total_views: number
  completion_rate: number        // Percentage
  avg_completion_time: number    // Seconds
  submissions_by_date: Array<{
    date: string              // YYYY-MM-DD
    count: number
  }>
  submissions_by_status: Record<SubmissionStatus, number>
  field_completion_rates: Record<string, number>  // fieldId -> completion %
  drop_off_points: Array<{
    field_id: string
    field_label: string
    drop_off_rate: number    // Percentage of users who abandoned at this field
  }>
  device_breakdown: {
    desktop: number
    tablet: number
    mobile: number
  }
  peak_submission_hours: number[]  // Hours of day (0-23)
}

export interface GroupFormAnalytics {
  group_id: number
  total_forms: number
  total_submissions: number
  active_forms: number
  forms_by_type: Record<FormType, number>
  recent_activity: Array<{
    form_id: number
    form_title: string
    submission_count: number
    last_submission: string
  }>
}

// ============================================
// WORKFLOW/AUTOMATION TYPES (Phase 9)
// ============================================

export type WorkflowTrigger =
  | 'form_submitted'
  | 'form_approved'
  | 'form_rejected'
  | 'field_value_equals'
  | 'submission_count_threshold'

export type WorkflowAction =
  | 'send_email'
  | 'webhook'
  | 'create_task'
  | 'assign_role'
  | 'send_notification'
  | 'update_user_field'

export interface WorkflowRule {
  id: string
  name: string
  form_id: number
  enabled: boolean
  trigger: {
    type: WorkflowTrigger
    conditions?: Array<{
      field_id?: string
      operator?: ConditionalOperator
      value?: any
    }>
  }
  actions: Array<{
    type: WorkflowAction
    config: Record<string, any>  // Action-specific configuration
    delay?: number               // Delay in seconds before executing
  }>
  createdAt: string
  updatedAt: string
}

export interface WebhookConfig {
  url: string
  method: 'POST' | 'PUT'
  headers?: Record<string, string>
  include_user_data: boolean
  include_form_schema: boolean
  secret?: string  // For HMAC signature
}

// ============================================
// FORM TEMPLATES
// ============================================

export interface FormTemplate {
  id: string
  name: string
  description: string
  category: 'general' | 'business' | 'education' | 'healthcare' | 'event' | 'survey'
  thumbnail_url?: string
  form_schema: FormSchema
  tags: string[]
  popularity: number
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding Form',
    description: 'Collect essential information from new employees',
    category: 'business',
    tags: ['hr', 'onboarding', 'employment'],
    popularity: 95,
    form_schema: {
      version: '2.0',
      pages: [
        {
          id: 'page_1',
          title: 'Personal Information',
          description: 'Please provide your personal details',
          sections: [
            {
              id: 'section_1',
              fields: [
                {
                  id: 'field_1',
                  type: 'text',
                  name: 'full_name',
                  label: 'Full Name',
                  required: true,
                  colSpan: 12
                },
                {
                  id: 'field_2',
                  type: 'email',
                  name: 'email',
                  label: 'Email Address',
                  required: true,
                  colSpan: 6
                },
                {
                  id: 'field_3',
                  type: 'phone',
                  name: 'phone',
                  label: 'Phone Number',
                  required: true,
                  colSpan: 6
                },
                {
                  id: 'field_4',
                  type: 'date',
                  name: 'start_date',
                  label: 'Start Date',
                  required: true,
                  colSpan: 6
                }
              ]
            }
          ],
          order: 0
        }
      ],
      settings: {
        renderMode: 'all-in-one',
        showProgress: true,
        allowSave: true,
        allowBack: true,
        successMessage: 'Thank you! Your information has been received.'
      },
      theme: {
        mode: 'auto',
        show_logo: true
      }
    }
  }
  // More templates defined in Phase 7
]
