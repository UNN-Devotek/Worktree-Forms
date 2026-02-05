# Story 3.4: Deep Linking

Status: ready-for-dev

## Story

As a Technician,
I want to tap a link in my SMS/Email and open the specific Job/Stop in the app,
So that I can get straight to work.

## Acceptance Criteria

1.  **Given** a URL `worktree://project/123/stop/456` (or https equiv)
    **When** tapped on mobile
    **Then** the app opens directly to `StopDetail`.
2.  **Given** I am not logged in
    **Then** it redirects to Login, then to the Target.

## Tasks

- [ ] Configure `next.config.js` or PWA manifest for deep links.
- [ ] Handle URL params in `layout.tsx` or `middleware.ts`.
- [ ] Test `router.push` handling.
