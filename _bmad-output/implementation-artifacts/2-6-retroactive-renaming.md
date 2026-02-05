# Story 2.6: Retroactive Renaming & Data Migration

## User Story

**As an** Admin,
**I want** the system to automatically update existing submission data and file names when I rename a field in the Form Builder,
**So that** my historical data remains consistent and files are searchable by the new field name.

## Acceptance Criteria

### 1. Detect Field Renaming

- [ ] During `updateForm`, the system identifies if a Field's `name` or `label` has changed while preserving its `id` (if IDs are stable) or if a heuristic determines a name change.
- [ ] Trigger the migration process if a change is detected.
- [ ] (MVP) Focus on explicit Key changes.

### 2. Update Submission Data Headers (JSON Migration)

- [ ] **Scenario**: Field "Qty" renamed to "Quantity".
- [ ] System iterates through all `Submissions` for this `Form`.
- [ ] Updates the JSON `data` payload: `{ "Qty": 5 }` -> `{ "Quantity": 5 }`.
- [ ] **Note**: This is critical so the data doesn't disappear from the UI (which looks for "Quantity").

### 3. Rename Associated Files (FR1.6)

- [ ] **Scenario**: File uploaded as `Qty_2024-01-01.pdf`.
- [ ] System finds `FileUpload` records linked to this field.
- [ ] Updates the `filename` metadata to `Quantity_2024-01-01.pdf`.
- [ ] (Bonus) Updates the S3/MinIO Object Key if feasible (might be expensive, metadata update is MVP).

### 4. Background Processing (Simulated)

- [ ] The operation happens asynchronously (or effectively so) to not block the Admin's "Save" response.
- [ ] Admin receives a notification when migration is complete (optional for MVP).

## Technical Implementation

### Key Challenges

1.  **Stable IDs**: Does our Form Builder use stable IDs?
    - If yes: Easy. Find field by ID, check if Label != Old Label.
    - If no (Array Index only): Hard/Risky.
    - _Assumption_: We explicitly handle `id` in our schema.

2.  **Migration Logic**:
    - `POST /api/forms/:id/migrate`: Internal or triggered by Update.
    - `MigrationService`:
      - `migrateSubmissionKeys(formId, oldKey, newKey)`
      - `renameFiles(formId, oldKeyCandidate, newKeyCandidate)`

### Database Updates

- None required (Data is JSON).

### Security

- Only Form Editor/Admin can trigger.

## Dependencies

- Story 2.4 (Versioning) - We should start a **NEW VERSION** before migrating, or migrate the data to match the _New_ Version?
- **Decision**: Historic data (v1) should ideally stay as v1.
- **Conflict**: If we rename the Key, we are effectively modifying history to match the _current_ schema.
- **Clarification**: Usually "Retroactive Renaming" means "Update everything so it looks like it was always this way".
- **Refined Approach**: Update the **Latest** Version's submissions? Or ALL?
- _PRD FR1.6 says_: "rename all associated existing files". Implies global update.
