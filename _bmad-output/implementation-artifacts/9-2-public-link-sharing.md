# Story 9.2: Public Link Sharing

Status: done

## Story

As a Manager,
I want to share a read-only timeline with my client via a link,
So that they don't need to create an account.

## Acceptance Criteria

1.  **Given** I am in Project Settings
    **When** I generate a Public Link with "Password Protection"
    **Then** the system provides a URL `worktree.pro/s/xyz`
2.  **Given** a visitor opens the link
    **Then** they must enter the password to view the Board (FR6.1, 6.2)
3.  **Given** the board is viewed
    **Then** all access incidents (IP, User Agent) are logged to a SOC2-compliant audit table (QA #6).

## Tasks / Subtasks

- [x] 1. Initialize Story 9.2
  - [x] 1.1 Create story file

- [x] 2. Backend Logic
  - [x] 2.1 Create `PublicToken` Model (token, passwordHash, type, expiresAt)
  - [x] 2.2 Create `ShareService` (generate, validate, revoke)
  - [x] 2.3 Implement `/api/public/:token` endpoints

- [x] 3. Frontend UI
  - [x] 3.1 Create `PublicShareModal`
  - [x] 3.2 Create Public Layout (No Sidebar, simplified header)
  - [x] 3.3 Create `PublicBoard` View

## Dev Agent Record

### Agent Model Used

Antigravity (Retroactive Generation)

### File List

- `apps/backend/src/services/share.service.ts`
- `apps/frontend/features/public/components/PublicShareModal.tsx`
