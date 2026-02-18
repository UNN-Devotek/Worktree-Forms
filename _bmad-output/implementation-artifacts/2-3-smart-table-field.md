# Story 2.3: Smart Table Field (Repeater)

**Epic:** 2: Visual Form Builder & Schema Engine
**Status:** Ready for Dev
**Priority:** High

## User Story

As an Admin,
I want to configure a table functionality field,
So that technicians can enter multiple rows of data (e.g., parts used).

## Acceptance Criteria

1. **Given** I am configuring a "Table" field
   **When** I define columns "Item Name", "Quantity", "Notes"
   **Then** the form runner displays a dynamic table

2. **And** I can configure "Item Name" to be Read-Only with pre-filled rows (FR1.4)

3. **And** I can control if pre-filled rows are deletable or fixed (UX #8).

## Technical Notes

- **Type:** `smart_table` (add to `FormFieldType`)
- **Structure:**
  - `columns`: Array of field definitions (subset of supported types).
  - `allowAdd`: boolean
  - `allowDelete`: boolean
  - `prefilledRows`: Array of values.
- **UI:**
  - Desktop: **Shadcn Table** layout.
  - Mobile: Card list layout (Stack).
