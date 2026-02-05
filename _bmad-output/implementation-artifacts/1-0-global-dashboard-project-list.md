# Story 1.0: Global Dashboard & Project List

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want to view a list of all my projects and create new ones,
so that I can organize my work and access specific project data.

## Acceptance Criteria

1.  **Given** I am on the Dashboard
2.  **Then** I see a "Projects" section displaying a grid of Project Cards
3.  **And** each card shows the Project Name, Role (Owner/Member), and Status
4.  **And** I can search/filter projects by name
5.  **When** I click "Create Project"
6.  **Then** a Modal opens asking for "Project Name" and "Slug" (auto-generated)
7.  **When** I submit the form
8.  **Then** a new Project is created, and I am redirected to it (or it appears in the list).

## Tasks / Subtasks

- [x] Task 1: Project Actions (Server)
  - [ ] Create `apps/frontend/features/projects/server/project-actions.ts`
  - [ ] Implement `getProjects()`: Fetch using `prisma.project.findMany` (with `where: { members: { some: { userId } } }`)
  - [ ] Implement `createProject(data)`: Create Project + `ProjectMember` (Owner role) + Default `ProjectRoleDefinitions`.

- [x] Task 2: Project List Components
  - [ ] Create `apps/frontend/features/projects/components/project-card.tsx`
  - [ ] Create `apps/frontend/features/projects/components/project-list.tsx` (Grid layout + Search)
  - [ ] Create `apps/frontend/features/projects/components/create-project-dialog.tsx` (Zod form)

- [x] Task 3: Integrate with Dashboard Page
  - [ ] Update `apps/frontend/app/(dashboard)/dashboard/page.tsx`
  - [ ] Add the `<ProjectList />` component below the stats (or as the main view)

## Dev Notes

### Architecture Patterns & Constraints

- **Data Access**: Use Server Actions for mutations (`createProject`). Use Server Components for fetching (`getProjects`).
- **RLS**: Remember, creating a project must also create existing `ProjectMember` record for the creator so they can see it.
- **Slug Generation**: Use `nanoid` or simple regex for slugify.

### Project Structure Notes

- **Feature**: `features/projects` matches the domain exactly.

## Dev Agent Record

### Creation Date

2026-01-13
