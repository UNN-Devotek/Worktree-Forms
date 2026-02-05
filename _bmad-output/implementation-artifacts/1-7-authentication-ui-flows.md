---
stepsCompleted: []
story_key: 1-7-authentication-ui-flows
status: done
tasks:
  - [x] Create AuthShell layout
  - [x] Implement LoginForm component
  - [x] Implement SignupForm component
  - [x] Add Zod validation
  - [x] Add password show/hide toggle
---

# Story 1.7: Authentication UI Flows

## Story
As a User,
I want to see branded Login and Signup pages,
So that I can access the system.

## Acceptance Criteria
- [x] **Given** I visit `/login` or `/signup`
- [x] **Then** I see the branded `AuthShell` layout
- [x] **And** the forms render correctly with validation (Zod)
- [x] **And** successful login redirects to `/dashboard` (UI Map 2.1, 2.2)
- [x] **And** backend supports IdP-Initiated SSO hooks for future Enterprise expansion (Arch #6)
- [x] **And** password fields include a "Show/Hide" toggle eye icon (UX #4).

## Dev Notes
- Moved from Epic 0 to Epic 1 during refactor.
- Already implemented in `apps/frontend/app/(auth)`.
