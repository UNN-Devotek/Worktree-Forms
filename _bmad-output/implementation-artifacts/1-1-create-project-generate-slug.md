# Story 1.1: Create Project & Generate Slug

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Project Creator,
I want to create a new Project with a name and generated URL slug,
so that I can establish a secure workspace for my team.

## Acceptance Criteria

1.  **Given** I am on the global dashboard
2.  **When** I click "Create Project" and enter "Headquarters Reno"
3.  **Then** a new Project entity is created with slug `headquarters-reno`
4.  **And** I am redirected to `/project/headquarters-reno`
5.  **And** a dedicated MinIO bucket path `/project-uuid/` is reserved (using UUID not Slug to allow renaming) (Arch #9)
6.  **And** I am assigned the "Owner" role for this project
7.  **And** long project names are truncated with an ellipsis and show full text on hover (QA #4).

## Tasks / Subtasks

- [ ] Task 1: S3/MinIO Client Setup (AC: 5)
  - [ ] Install `@aws-sdk/client-s3`
  - [ ] Create `apps/frontend/lib/storage.ts` with `ensureProjectBucket`
  - [ ] Configure `MINIO_` env vars in `apps/frontend/.env`

- [ ] Task 2: Project Creation & Storage Integration (AC: 3, 5, 6)
  - [ ] Update `createProject` in `project-actions.ts` to call `ensureProjectBucket`
  - [ ] Ensure transaction rollback or failure handling if storage fails (consistency)

- [ ] Task 3: Verification (AC: 1, 2, 4, 7)
  - [ ] Verify slug generation (already done in 1.0, but double check)
  - [ ] Verify Owner role assignment (already done in 1.0)
  - [ ] Verify MinIO folder creation (`.keep` file)
  - [ ] Verify generic MinIO access

## Dev Notes

### Architecture Patterns & Constraints

- **Storage**: Use "Folder Reservation" pattern. S3 is flat, so create `projects/{uuid}/.keep`.
- **Naming**: Use UUID for storage path, not Slug (Slugs change, UUIDs don't).

## Dev Agent Record

### Creation Date

2026-01-14
