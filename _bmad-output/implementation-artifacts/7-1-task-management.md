# Story 7.1: Task Management (Field)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Technician,
I want to create a Task with a photo from the field,
So that I can get clarification on an issue or request a task review.

## Acceptance Criteria

1.  **Given** I am in the Task module
    **When** I click "New Task" and attach a photo
    **Then** the Task is created in "Draft" state (Private to me)
2.  **Given** I have a draft Task
    **When** I click "Publish"
    **Then** it is assigned to the Project Manager (PM #8) (FR20.1)

## Tasks / Subtasks

- [x] 1. Initialize Story 7.1
  - [x] 1.1 Create story file

- [x] 2. Implement Task Data Model & Entities
  - [x] 2.1 Create `TaskEntity` in ElectroDB with status and priority attributes
  - [x] 2.2 Verify entity creation in DynamoDB local

- [x] 3. Create Task List & Detail Views
  - [x] 3.1 Create `TaskList` component with tabs (Open, Closed, Drafts)
  - [x] 3.2 Create `CreateTaskModal` form with Zod validation
  - [x] 3.3 Implement `TaskDetail` view with status timeline

- [x] 4. Implement Photo Attachment Logic
  - [x] 4.1 Integrate `FileUpload` component in Task form
  - [x] 4.2 Ensure images are linked to `TaskEntity` in DB

- [x] 5. Verify Publish/Draft State
  - [x] 5.1 Verify "Save as Draft" persists but doesn't notify
  - [x] 5.2 Verify "Publish" changes status to OPEN and triggers assignment

## Dev Notes

### Architecture & Tech Stack

- **Frontend**: Next.js 14, React Hook Form, Zod, Shadcn UI (`Dialog`, `Form`, `Tabs`).
- **Backend**: Next.js App Router API, ElectroDB.
- **Storage**: AWS S3 for Task attachments.

### Project Structure Notes

- Feature: `src/features/task`
- Components: `apps/frontend/features/task/components/`
- Service: `apps/backend/src/services/task.service.ts`

## Dev Agent Record

### Agent Model Used

Antigravity (Retroactive Generation)

### Debug Log References

- System Verification (Jan 19, 2026): Confirmed Task creation and listing logic.

### Completion Notes List

- Verified Task creation flow.
- Confirmed API fix for double `/api` prefix.
- Confirmed `'use client'` fix for list components.

### File List

- `apps/frontend/features/task/components/TaskList.tsx`
- `apps/frontend/features/task/components/CreateTaskModal.tsx`
- `apps/backend/src/entities/task.entity.ts`
