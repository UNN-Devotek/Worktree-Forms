# Story 2.2: Verify Field Validation & Logic

**Epic:** 2: Visual Form Builder & Schema Engine
**Status:** Done
**Priority:** High

## User Story

As an Admin,
I want to set required fields and visibility rules,
So that I collect high-quality data.

## Acceptance Criteria

1. **Given** I have a "Reason" field
   **When** I set "Conditional Visibility" to show only if "Status" == "Failed"
   **Then** the field is hidden by default in the runner

2. **And** appears only when the condition is met (using `json-logic` standard library) (Arch #8)

3. **And** when hidden, the field value is explicitly cleared to prevent "Zombie Data" (Lead Dev #3)

4. **And** validation errors trigger a smooth scroll to the error location (UX #3)

5. **And** I can mark fields as "Required" which prevents submission if empty (FR1.2).

## Technical Notes

- **Existing Implementation:** `apps/frontend/components/form-builder/properties/tabs/LogicTab.tsx`
- **Lib:** `json-logic` (implied by AC, verified in code)
- **Status:** Verified by User & Code Inspection.
