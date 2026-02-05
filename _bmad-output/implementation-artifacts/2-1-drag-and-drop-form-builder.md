# Story 2.1: Verify Drag-and-Drop Form Builder

**Epic:** 2: Visual Form Builder & Schema Engine
**Status:** In Progress
**Priority:** High

## User Story

As an Admin,
I want to drag fields onto a canvas to design a form,
So that I don't need to write code.

## Acceptance Criteria

1. **Given** I am in the Form Builder
   **When** I drag a "Text Field" from the toolbox to the canvas
   **Then** it appears in the form preview

2. **And** I can click it to edit its label, placeholder, and description (FR1.1)

3. **And** field descriptions appear as "Tooltips" or helper text on hover (PM #3)

4. **And** field labels are sanitized to prevent XSS injection (QA #3).

## Technical Notes

- **Existing Implementation:** `apps/frontend/components/form-builder/`
- **Route:** `/forms/[formSlug]/edit`
- **Lib:** `@dnd-kit`
- **Goal:** Verify gap analysis against acceptance criteria.
