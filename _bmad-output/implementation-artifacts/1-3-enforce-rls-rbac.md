# Story 1.3: Enforce Tenant Isolation & RBAC

Status: ready-for-dev

## Story

As a Developer,
I want to ensure data isolation at the application level using DynamoDB partition keys,
so that users cannot access data from other projects or exceed their privileges.

## Acceptance Criteria

1.  **Given** a user is logged in
2.  **When** they attempt to query entities via the API
3.  **Then** the query must strictly include the `projectId` in the `PK` (Partition Key)
4.  **And** the `requireProjectAccess(userId, projectId, role)` middleware must validate access before any DB operation
5.  **And** if they try to `DELETE` a project without `OWNER` role, the server throws a `Forbidden` error (FR5.3, FR5.4).

## Tasks / Subtasks

- [ ] Task 1: Implement `requireProjectAccess` Middleware
  - [ ] Create `apps/backend/src/middleware/rbac.ts`.
  - [ ] Implement logic to check `ProjectMember` entity in DynamoDB for the given `userId` and `projectId`.
  - [ ] Cache results in ElastiCache (Redis) to minimize DynamoDB hits on every request.

- [ ] Task 2: Standardize ElectroDB Scoping
  - [ ] Ensure all Entity definitions use `PK: PROJECT#<projectId>`.
  - [ ] Verify that every query in the repository layer explicitly passes the `projectId` from the authenticated context.

- [ ] Task 3: RBAC Delete Logic
  - [ ] Implement `checkIsOwner(projectId, userId)` helper.
  - [ ] Add guard clauses to `ProjectEntity.delete()` callers to enforce `OWNER` role.

- [ ] Task 4: Verification & Testing
  - [ ] Write integration tests using `vitest-dynalite`.
  - [ ] Attempt to access Project B's data while "logged in" as Project A's user (verify cross-tenant failure).
  - [ ] Verify `DELETE` project fails for non-owner.

## Dev Notes

### Architecture Patterns & Constraints

- **Isolation Strategy**: Multi-tenancy is enforced via Partition Key (`PK`) isolation. `PK` must always start with `PROJECT#<projectId>`.
- **Middleware**: Use `requireProjectAccess()` for all project-scoped routes.
- **Testing**: Never mock the SDK; use `vitest-dynalite` to run real queries against a local DynamoDB instance.

### Recent Changes (Context)

- **Database**: Migrated from Postgres RLS to DynamoDB Single-Table Design.
- **Dependencies**: Uses `electrodb` and `@aws-sdk/client-dynamodb`.

## Dev Agent Record

### Creation Date

2026-03-05 (Updated from 2026-01-15)
