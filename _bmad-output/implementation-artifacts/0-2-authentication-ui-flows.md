# Story 0.2: Authentication UI Flows

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want to see branded Login and Signup pages,
so that I can access the system securely.

As a Developer (in Dev Mode),
I want a "Backdoor" to login instantly as Admin or User,
so that I don't have to type credentials repeatedly during testing.

## Acceptance Criteria

1.  **Given** I visit `/login` or `/signup`
2.  **Then** I see the branded `AuthShell` layout
3.  **And** the forms render correctly with validation (Zod)
4.  **And** successful login redirects to `/dashboard` (UI Map 2.1, 2.2)
5.  **And** password fields include a "Show/Hide" toggle eye icon (UX #4).
6.  **And** (Dev Only) If `NODE_ENV=development` AND `ENABLE_DEV_TOOLS=true`, I see "Dev Login" buttons for Admin and User.

## Tasks / Subtasks

- [x] Task 1: Auth Layout & UI (AC: 2)
  - [x] Create `apps/frontend/app/(auth)/layout.tsx` (Branded Shell)
  - [x] Implement `apps/frontend/features/users/components/auth-shell.tsx`

- [x] Task 2: Login Form (AC: 3, 4, 5)
  - [x] Create `apps/frontend/features/users/components/login-form.tsx`
  - [x] Implement Zod schema validation (Removed - OAuth only)
  - [x] Integrate with `next-auth/react` `signIn` (Microsoft Entra ID)
  - [x] Add "Show Password" toggle (Removed - OAuth only)

- [x] Task 3: Signup Form (AC: 3, 4)
  - [x] Create `apps/frontend/features/users/components/signup-form.tsx` (Removed per user request)
  - [x] Implement Zod schema (Removed)
  - [x] Connect to `register` server action (Removed)

- [x] Task 4: Dev Backdoor (AC: 6)
  - [x] Create `apps/frontend/features/users/components/dev-login-buttons.tsx`
  - [x] Implement one-click login logic (bypass password or use known dev credentials)
  - [x] Guard with `process.env.NODE_ENV === 'development'` check
  - [x] Add to Login Page bottom area

## Dev Notes

### Architecture Patterns & Constraints

- **NextAuth**: Use the standard `signIn('credentials')` flow.
- **Security**: The "Backdoor" MUST be strictly stripped or disabled in production builds. Use `process.env` checks.
- **Components**: Reuse `shadcn/ui` components (Input, Button, Card).

### Project Structure Notes

- **Feature**: `features/users` is the home for Auth UI.
- **Routes**: `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`.

## Dev Agent Record

### Creation Date

2026-01-13

### Implementation Notes (2026-01-14)

- Implemented `AuthShell` and Branding.
- Implemented `LoginForm` with "Sign in with Microsoft".
- Implemented `DevLoginButtons` (visible only in development).
- **Modification**: Removed Email/Password Login field and Signup flow entirely per user request.
- **Modification**: Deleted unused `signup-form.tsx`, `signup/page.tsx`, and associated Zod schemas.
