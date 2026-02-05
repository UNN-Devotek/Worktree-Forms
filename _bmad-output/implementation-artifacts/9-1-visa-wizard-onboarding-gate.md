# Story 9.1: Visa Wizard (Onboarding Gate)

Status: done

## Story

As an Admin,
I want to require subcontractors to upload insurance before accessing the dashboard,
So that we stay compliant.

## Acceptance Criteria

1.  **Given** an invited user logs in for the first time
    **When** they check "Pending Compliance" status
    **Then** they are redirected to the "Visa Wizard"
2.  **Given** the user is an Admin
    **Then** they must enable MFA (Arch #7)
3.  **Given** the user is pending
    **Then** they cannot see any project data until they complete the required uploads (FR15.2)

## Tasks / Subtasks

- [x] 1. Initialize Story 9.1
  - [x] 1.1 Create story file

- [x] 2. Data Model & Backend
  - [x] 2.1 Update `User` model with `complianceStatus` (PENDING, APPROVED, REJECTED)
  - [x] 2.2 Create `ComplianceService` (upload, approve, reject)
  - [x] 2.3 Implement `/api/users/compliance` endpoints

- [x] 3. Frontend Wizard
  - [x] 3.1 Create `VisaWizard` steps (Insurance, License, W9)
  - [x] 3.2 Implement File Upload UI
  - [x] 3.3 Create `/onboarding` page

- [x] 4. Security & Middleware
  - [x] 4.1 Implement Middleware Redirect: If status != APPROVED -> /onboarding
  - [x] 4.2 Restrict API access to non-onboarding routes

## Dev Agent Record

### Agent Model Used

Antigravity (Retroactive Generation)

### Verification

- E2E Test: `tests/e2e/onboarding.spec.ts` (Running in background)
