# Story 9.1: Visa Wizard (Onboarding Gate)

Status: in-progress

## Story

As an Admin,
I want to require subcontractors to upload insurance before accessing the dashboard,
So that we stay compliant.

## Acceptance Criteria

1. **Given** an invited user logs in for the first time
2. **When** they check "Pending Compliance" status
3. **Then** they are redirected to the "Visa Wizard"
4. **And** must enable MFA if they have "Admin" privileges (Arch #7)
5. **And** cannot see any project data until they complete the required uploads (FR15.2).

## Tasks / Subtasks

- [ ] **Data Model & Backend**
  - [ ] Add `complianceStatus` and `requiredDocs` to `User` or `Profile`.
  - [ ] Implement `ComplianceService` or `OnboardingService`.
- [ ] **Frontend**
  - [ ] Create `VisaWizard` page/layout.
  - [ ] Middleware check: Redirect specific roles to Wizard if pending.
  - [ ] Step 1: Document Upload (Insurance).
  - [ ] Step 2: MFA Setup (if Admin).
  - [ ] Completion: Update status -> Redirect to Dashboard.

## Dev Notes

- **Role Check**: Use `role` or `systemRole`.
- **MFA**: If implementing full MFA is too heavy, start with a "Confirm Phone" or placeholder step, unless full TOTP is ready. (Scope reduction: Placeholder/Checkbox for "Insurance Verified" or simple file upload).
- **Middleware**: Modify `middleware.ts` to intercept authenticated users with strict `compliance_pending` status.

## References

- [Epics.md: Story 9.1](../../_bmad-output/planning-artifacts/epics.md)
