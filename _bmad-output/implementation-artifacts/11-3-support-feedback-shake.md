# Story 11.3: Support & Feedback Shake

Status: ready-for-dev

## Story

As a User,
I want to report a bug by shaking my phone,
So that I can quickly capture the context.

## Acceptance Criteria

1.  **Given** I am on the mobile app
    **When** I shake the device
    **Then** a Feedback Form pops up
2.  **Given** the form opens
    **Then** it automatically attaches a screenshot and device logs (FR19.4)

## Tasks / Subtasks

- [ ] 1. Mobile Shake Detection
  - [ ] 1.1 Implement `useShake` hook (Accelerometer API)
  - [ ] 1.2 Add debouncing to prevent accidental triggers

- [ ] 2. Feedback Form UI
  - [ ] 2.1 Create `FeedbackModal`
  - [ ] 2.2 Implement `html2canvas` for Screenshot capture
  - [ ] 2.3 Implement Log collector (`console.history`)

- [ ] 3. Backend Submission
  - [ ] 3.1 Use `SupportTicket` model
  - [ ] 3.2 Add `/api/support/tickets` endpoint

## Dev Agent Record

### Agent Model Used

Antigravity (Retroactive Generation)
