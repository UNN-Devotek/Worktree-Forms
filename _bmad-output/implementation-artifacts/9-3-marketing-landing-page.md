# Story 9.3: Marketing Landing Page

Status: done

## Story

As a Visitor,
I want to see a product showcase at the root URL if I am not logged in,
So that I understand what Worktree is.

## Acceptance Criteria

1.  **Given** I am unauthenticated
    **When** I visit the root URL `/`
    **Then** I see the Marketing Landing Page (Hero, Features, Pricing) (FR6.3)
2.  **Given** I am authenticated
    **When** I visit `/`
    **Then** I am redirected to `/dashboard` automatically

## Tasks / Subtasks

- [x] 1. Initialize Story 9.3
  - [x] 1.1 Create story file

- [x] 2. UI Implementation
  - [x] 2.1 Create Hero Section (Modern, Dark Mode)
  - [x] 2.2 Create Value Props Grid
  - [x] 2.3 Footer & CTA

- [x] 3. Routing & Middleware
  - [x] 3.1 Configure `app/page.tsx` as Landing Page
  - [x] 3.2 Update Middleware to allow public access to `/` but protect `/dashboard`

## Dev Agent Record

### Agent Model Used

Antigravity (Retroactive Generation)

### File List

- `apps/frontend/app/page.tsx`
- `middleware.ts`
