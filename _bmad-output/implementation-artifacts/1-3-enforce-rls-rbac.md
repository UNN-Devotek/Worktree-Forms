# Story 1.3: Enforce RLS & RBAC

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to ensure data isolation at the database level,
so that users cannot access data from other projects or exceed their privileges.

## Acceptance Criteria

1.  **Given** a user is logged in
2.  **When** they attempt to query `SELECT * FROM forms` via the API
3.  **Then** the query only returns rows where `project_id` matches their current project context
4.  **And** `current_setting` is set safely within a transaction to handle connection pooling (Arch #3)
5.  **And** if they try to `DELETE` a project without `OWNER` role, the DB throws a Policy Violation error (FR5.3, FR5.4).

## Tasks / Subtasks

- [ ] Task 1: Enable RLS on Core Tables
  - [ ] Enable RLS on `Project`, `ProjectMember`, `Form`, `Submission` tables via migration.
  - [ ] Create `app.current_project_id` setting definition in Postgres.
  - [ ] Create RLS policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE` using `current_setting('app.current_project_id')`.

- [ ] Task 2: Prisma Client Extension for RLS
  - [ ] Create `src/server/db/rls-extension.ts` (or similar) to extend Prisma Client.
  - [ ] Implement `$extends` query middleware to set `app.current_project_id` and `app.current_user_id` before queries.
  - [ ] Ensure transaction safety (use interactive transactions if needed for setting variables).

- [ ] Task 3: RBAC Delete Policy
  - [ ] Create a Postgres function `check_is_owner(project_id, user_id)` or similar.
  - [ ] Add `BEFORE DELETE` trigger or RLS Policy on `Project` table to enforce `OWNER` role.

- [ ] Task 4: Verification & Testing
  - [ ] Write a test case trying to access Project B's data while "logged in" as Project A's user.
  - [ ] Verify `DELETE` project fails for non-owner.

## Dev Notes

### Architecture Patterns & Constraints

- **RLS Strategy**: Use `current_setting('app.current_project_id')`.
- **Prisma**: Use Client Extensions (`$extends`) to wrap queries in a transaction that sets the config variable.
- **Bypass**: Create a "Bypass" client (e.g. `prismaAdmin`) for internal jobs (using `bypass_rls` role or similar), but for standard API calls, ALWAYS use the RLS client.

### Recent Changes (Context)

- **Database**: Ensure `migrations` folder is updated properly.
- **Dependencies**: Uses `prisma` and `postgres`.

## Dev Agent Record

### Creation Date

2026-01-15
