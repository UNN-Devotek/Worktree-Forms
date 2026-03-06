# Story 2.4: Form Schema Versioning & Migrations

**Epic:** 2: Visual Form Builder & Schema Engine
**Status:** In Progress
**Priority:** High

## User Story

As an Admin,
I want changes to form layouts to be versioned,
So that existing submissions rely on the schema version at the time of submission (FR1.5).

## Acceptance Criteria

1. **Given** a form with "Version 1" and existing submissions
   **When** I add a new field and save
   **Then** the form version increments to "Version 2".

2. **And** old submissions still reference "Version 1" schema components (Arch #12).

3. **And** I can migrate submissions to the new version if needed (optional for now, but infrastructure should exist).

4. **And** rollbacks to previous versions are possible (Lead Dev #5).

## Technical Notes

- **Store:** `form-builder-store.ts` already has `history` (undo/redo), but this is for _session_ edits.
- **Backend:** `FormSchema` in `group-forms.ts` has a `version` string.
- **Requirement:**
  - On Save: Compare current schema with saved schema.
  - If different: Increment version (e.g., `2.0` -> `2.1`).
  - Store previous versions in a `FormVersionEntity` (PK: PROJECT#<id>, SK: FORM#<id>#VERSION#<v>).
  - **Simplification:** For now, just ensuring the JSON blob stores the version and new submissions use it is sufficient. Full archival via DynamoDB entities is preferred.

## Implementation Plan

- Check `FormEntity` definition for versioning support.
- If missing, add `FormVersionEntity`.
- Update `saveForm` action to handle version bumping in DynamoDB.
