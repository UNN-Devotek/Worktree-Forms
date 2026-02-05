# Story 6.5: Notification & Subscription Preferences

Status: in-progress

## Story

As a User,
I want to configure which events trigger email or push notifications,
So that I am not overwhelmed by spam.

## Acceptance Criteria

1. **Given** I am in User Settings (or a Settings Modal)
2. **When** I toggle "Email me when mentioned" to OFF
3. **Then** I no longer receive emails for mentions (Mock Logic)
4. **And** standard "Smart Links" in notifications deep-link directly to the item

## Tasks / Subtasks

- [ ] Create `NotificationSettings` Component (AC: 1, 2)
  - [ ] Toggles for: "Email mentions", "Browser push for assignments", "Daily digest".
  - [ ] Save to `localStorage` (MVP) or Backend.
- [ ] Implement Deep Linking Logic (AC: 4)
  - [ ] URL handling for `?sheetId=...&row=...`.
  - [ ] Auto-scroll/Highlight row on load.
- [ ] Wire up Preference Checks (AC: 3)
  - [ ] Update `ChatPanel` / `RowAssignment` to check prefs before "notifying" (console log).

## Dev Notes

- **Settings Location**: Can be a tab in a global "Settings" modal or a popover.
- **Deep Linking**: `SheetEditor` needs to read URL search params on mount.
- **Storage**: `localStorage` key `user_prefs_{userId}`.

## References

- [Epics.md: Story 6.5](../../_bmad-output/planning-artifacts/epics.md)
