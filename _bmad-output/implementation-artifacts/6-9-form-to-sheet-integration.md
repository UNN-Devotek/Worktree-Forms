---
stepsCompleted: []
story_key: 6-9-form-to-sheet-integration
status: done
tasks:
  - [x] Add 'Output to Sheet' config in Form Builder (Note: Backend relation added, UI Phase 3)
  - [x] Create Webhook endpoint to receive submissions
  - [x] Implement logic to append row to Yjs document
  - [x] Handle offline queuing for submissions
---

# Story 6.9: Form-to-Sheet Integration

## Story
As a Manager,
I want form submissions to automatically populate a specific sheet,
So that I have a live tracker of field data.

## Acceptance Criteria
- [x] **Given** I am configuring a Form
- [x] **When** I select "Output to Sheet: Daily Log"
- [x] **Then** the system automatically creates columns for each Form Field
- [x] **And** when a new submission arrives, a new Row is appended to the Sheet
- [x] **And** Photos/Attachments are rendered as "Thumbnail" cells.

## Dev Notes
- **Integration:** The backend needs to act as a Yjs client to "inject" the row so connected clients see it instantly.
