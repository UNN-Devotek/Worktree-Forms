# Story 1.4: User Profile & Theme Preferences

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want to upload an avatar and set my theme (Dark/Light),
so that I can personalize my experience.

## Acceptance Criteria

1.  **Given** I am on the Profile page
2.  **When** I upload a photo
3.  **Then** it is resized to 256x256 and saved to MinIO (Bucket: `user-profiles`)
4.  **And** if the image fails to load, it gracefully falls back to User Initials (QA #3)
5.  **And** when I toggle "Dark Mode", the preference persists to the DB and applies on my next login (FR10.3).

## Tasks / Subtasks

- [ ] Task 1: Backend API for Avatar
  - [ ] Implement `POST /api/user/avatar` (or Server Action).
  - [ ] Use `sharp` (or similar) to resize image to 256x256 before upload.
  - [ ] Save to MinIO bucket `user-profiles` with key `{{userId}}/avatar.jpg`.
  - [ ] Update `User` table `image` field.

- [ ] Task 2: Profile Page UI
  - [ ] Create `apps/frontend/features/users/components/profile-form.tsx`.
  - [ ] Implement Avatar Uploader with Preview.
  - [ ] Implement "Initials" fallback using `shadcn/ui` `<AvatarFallback>`.

- [ ] Task 3: Theme Persistence
  - [ ] Update `ThemeToggle` to sync with backend (Server Action `updateTheme`).
  - [ ] Store preference in `UserPreference` table (or `User` table if simple).
  - [ ] Ensure `ThemeProvider` initializes with stored preference on load (Server Component injection in RootLayout).

## Dev Notes

### Architecture Patterns & Constraints

- **Storage**: Use MinIO for generic file storage. Ensure `user-profiles` bucket exists.
- **Image Processing**: Resize on server to save bandwidth/storage.
- **Theme**: Currently using `next-themes`. Need to sync this with DB so it persists across devices.

### References

- [Source: epics.md#Story-1.4:-User-Profile-&-Theme-Preferences](file:///c:/Users/White/Documents/Worktree/Worktree/_bmad-output/planning-artifacts/epics.md#Story-1.4:-User-Profile-&-Theme-Preferences)

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash (Planning)

### Creation Date

2026-01-15
