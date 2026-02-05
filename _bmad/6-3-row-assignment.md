# Story 6.3: Row Assignment & Action Inbox

**As a Manager,**
I want to assign a specific row to a technician,
So that they know it is their responsibility.

## Acceptance Criteria

1.  **Context Menu Assignment**:
    - **Given** I right-click a row in the Smart Sheet
    - **When** I select "Assign to..."
    - **Then** I can choose a user from the project members list.

2.  **Visual Indication**:
    - **Given** a row is assigned
    - **Then** the row highlights or displays the assignee's avatar (e.g., in a dedicated "Assignee" column or overlay).

3.  **Notification & Inbox**:
    - **Given** a row is assigned to "Mike"
    - **Then** Mike receives a notification.
    - **And** the item appears in Mike's "Action Inbox" (FR7.2).

4.  **Mobile Support (Inbox)**:
    - **Given** I am on mobile in the Inbox
    - **Then** I can swipe to dismiss/archive the inbox item (UX #3).

## Implementation Plan

1.  **Backend Extensions**:
    - Extend `Sheet` or create `SheetAssignment` model to track row-level assignments.
    - Or store assignment metadata in Yjs `Y.Map` (preferred for real-time reactivity).

2.  **Frontend (Sheet)**:
    - Implement "Right-Click Context Menu" in FortuneSheet (using `onContextMenu` or FortuneSheet API).
    - Add "Assignee" column type or visualization.

3.  **Action Inbox UI**:
    - Create `/dashboard/inbox` or sidebar widget.
    - List assigned rows with deep links to the specific sheet/row.

4.  **Notifications**:
    - Trigger system notification (Toast/DB Notification) on assignment.

## Technical Notes

- FortuneSheet context menu customization might be limited. If so, we can use a custom context menu overlaid on the grid.
- Storing assignments in Yjs ensures real-time updates for all users.
