# Story 2.5: Restore, Blame & Form History

## User Story

**As an** Admin,
**I want to** view the revision history of a form, see who made revisions, and restore a previous version,
**So that** I can recover from accidental destructive edits or audit changes.

## Acceptance Criteria

### 1. Version History List

- [ ] In the Form Builder, there is a "History" or "Versions" tab/modal.
- [ ] The list shows all versions of the form in descending order (newest first).
- [ ] Each entry displays:
  - Version Number (v1, v2, v3)
  - Timestamp (Created At)
  - Author (Blame) - Name/Email of the user who made the change.
  - Changelog/Comment (if available).

### 2. Version Details

- [ ] Clicking a version allows the user to view that version's properties or schema.
- [ ] (MVP) A "View Schema" button showing the JSON is sufficient if visual preview is too complex.

### 3. Rollback / Restore

- [ ] There is a "Restore this Version" action on past versions.
- [ ] Execution:
  - Does NOT delete later versions.
  - Creates a **NEW** version (e.g., v4) that is a copy of the selected version (e.g., v1).
  - Sets the Form's current schema to this restored schema.
  - Logs the action as "Restored from v1".

### 4. Blame Accuracy

- [ ] When a form is updated, the `FormVersion` record correctly records the User ID of the editor.

## Technical Implementation

### Database

- Uses existing `FormVersion` model.
- **Update Required**: Need to ensure `created_by` or similar field exists on `FormVersion` to track specific editor, OR assume `Form.updatedBy` logic if we track that.
- _Check_: `FormVersion` currently has `form_id`, `version`, `schema`, `changelog`, `created_at`. It acts as a log.
- _Missing_: `userId` (the editor). We need to migrate `FormVersion` to include `editorId` or uses context.

### Backend Updates

- `POST /api/forms/:id/update`: Must capture `req.user.id` and save it to the new `FormVersion`.
- `GET /api/forms/:id/versions`: Returns list of versions with User relations.
- `POST /api/forms/:id/versions/:versionId/restore`: Implements rollback logic.

### Frontend Updates

- New `HistoryTab` in `FormBuilder`.
- Integrates `GET` and `POST` restore.

## Dependencies

- Story 2.4 (FormSchema Versioning) - **DONE**
