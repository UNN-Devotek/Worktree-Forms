# Story 6.4: Project Team Chat

Status: in-progress

## Story

As a Team Member,
I want to discuss project issues in a dedicated channel,
So that communication is centralized.

## Acceptance Criteria

1. **Given** I am on the Chat page/panel
2. **When** I send a message in the #general channel
3. **Then** it appears instantly for all other project members (Realtime Yjs)
4. **And** I can mention `@Mike` (stored as Immutable ID, rendered as Display Name)
5. **And** notifications respect "Office Hours" settings (Logic only)

## Tasks / Subtasks

- [ ] Implement Chat UI Component (AC: 1, 2)
  - [ ] Message List (Virtual/Scrollable)
  - [ ] Message Input with support for Mentions (@ trigger)
- [ ] Wire up Yjs `messages` array (AC: 3)
  - [ ] Sync messages via `y-websocket`
  - [ ] Store simplified message object (id, senderId, text, timestamp)
- [ ] Implement Mentions Parsing (AC: 4)
  - [ ] Dropdown for user selection when typing @
  - [ ] Rendering @mentions in message list
- [ ] Add Office Hours Logic (AC: 5)
  - [ ] Check mock user settings before "notifying" (console log or badge update)

## Dev Notes

- **Architecture**: Reuse `useSheetSync` or create generic `useProjectSync` (Yjs Provider) to share the WebSocket connection if possible, or create a separate room `project-{id}-chat`.
- **UI**: Sidebar or dedicated page. Given "Smart Sheets" epic, a collapsible Sidebar Chat in the Sheet view is highly effective for context.
- **Tech Stack**: Yjs (Y.Array) for message history.

## References

- [Epics.md: Story 6.4](../../_bmad-output/planning-artifacts/epics.md)
