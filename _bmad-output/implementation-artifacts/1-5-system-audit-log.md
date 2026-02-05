# Story 1.5: System Audit Log

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Admin,
I want to see a log of major events,
so that I can audit security and usage.

## Acceptance Criteria

1.  **Given** I am a Project Owner
2.  **When** I view the Audit Log page
3.  **Then** I see a chronological list of actions (Invites, Role Changes, Deletions)
4.  **And** each entry shows User, IP, Timestamp, and Action details (FR5.9).

## Tasks / Subtasks

- [ ] Task 1: Enhance AuditLog Schema
  - [ ] Add `ipAddress` field to `AuditLog` model
  - [ ] Add `projectId` field for project-scoped logs
  - [ ] Add index on `projectId` and `timestamp` for query performance
  - [ ] Run migration

- [ ] Task 2: Audit Logging Helper
  - [ ] Create `lib/audit.ts` with `createAuditLog(action, resource, details, projectId?)` function
  - [ ] Extract IP address from request headers (X-Forwarded-For, X-Real-IP, or req.ip)
  - [ ] Get userId from session

- [ ] Task 3: Integrate Audit Logging
  - [ ] Add audit log to user invite action (Story 1.2)
  - [ ] Add audit log to role change actions (if exists)
  - [ ] Add audit log to project deletion action
  - [ ] Add audit log to user removal action

- [ ] Task 4: Audit Log UI
  - [ ] Create `apps/frontend/features/projects/components/audit-log-table.tsx`
  - [ ] Create `apps/frontend/app/(dashboard)/project/[slug]/audit/page.tsx`
  - [ ] Implement server action to fetch logs (filtered by projectId)
  - [ ] Display in TanStack Table with columns: Timestamp, User, Action, Resource, Details, IP
  - [ ] Add pagination (default 50 per page)
  - [ ] Add filtering by action type

## Dev Notes

### Architecture Patterns & Constraints

- **IP Extraction**: Use `headers()` from `next/headers` in Server Actions to get IP. Check `x-forwarded-for` first (for proxies), then `x-real-ip`, then fallback.
- **Project Scoping**: Audit logs should be scoped to projects. Global logs (e.g., user registration) can have `projectId = null`.
- **Performance**: Index on `(projectId, timestamp DESC)` for efficient queries.
- **Privacy**: Store IP addresses but consider GDPR implications (may need retention policy).

### References

- [Source: epics.md#Story-1.5:-System-Audit-Log](file:///c:/Users/White/Documents/Worktree/Worktree/_bmad-output/planning-artifacts/epics.md#Story-1.5:-System-Audit-Log)

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Planning)

### Creation Date

2026-01-15
