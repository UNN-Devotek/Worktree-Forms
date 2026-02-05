# Story 1.2: User Management & Invites

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Project Owner,
I want to view a list of all members and invite new ones via email,
so that I can manage my team's access.

## Acceptance Criteria

1.  **Given** I am in Project Settings > Users
2.  **When** I enter `mike@example.com` and select "Technician"
3.  **Then** an invitation email is sent with a magic link
4.  **And** the link requires a "Click to Confirm" step to prevent Outlook Safelinks from consuming the token (Lead Dev #9)
5.  **And** the user appears in the `<UserListTable />` with "Invited" status (FR5.1, 5.2)
6.  **And** I can revoke or **Resend** expired invites (PM #2)
7.  **And** I can revoke invites or remove users (UI Map 17.0).

## Tasks / Subtasks

- [ ] Task 1: Invite Logic (Server)
  - [ ] Create `features/users/server/invite-actions.ts`
  - [ ] Implement `inviteUser(email, role, projectId)`
  - [ ] Generate secure token (use `nanoid` or crypto)
  - [ ] Store invitation in DB (Prisma `Invitation` model?) - _Check Schema first_
  - [ ] Send email (Mock/Console for now, or Resend if configured)

- [ ] Task 2: Invitation Acceptance Flow
  - [ ] Create `app/invite/[token]/page.tsx`
  - [ ] Implement "Click to Confirm" UI
  - [ ] Server Action `acceptInvite(token)`:
    - [ ] Verify token validity/expiry
    - [ ] Link to existing user OR prompt signup
    - [ ] Add `ProjectMember` record
    - [ ] Delete invitation

- [ ] Task 3: User Management UI
  - [ ] Create `features/projects/components/settings/user-list-table.tsx`
  - [ ] Create `features/projects/components/settings/invite-dialog.tsx`
  - [ ] Implement `getProjectMembers(projectId)`
  - [ ] Integrate into `app/(dashboard)/projects/[slug]/settings/users/page.tsx` (Route needs creation)

## Dev Notes

### Architecture Patterns & Constraints

- **Invites**: Use a dedicated `Invitation` table if not present.
- **Safety**: Outlook "Safelinks" will GET any link in email. DO NOT auto-accept on basic GET. Require a POST form submission on the landing page ("Click to Join").

## Dev Agent Record

### Creation Date

2026-01-14
