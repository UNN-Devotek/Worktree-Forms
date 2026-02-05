# Live Sheet Implementation Plan (Smartsheet-Style)

**Author:** Worktree Architect
**Date:** 2026-01-22
**Status:** Approved for Implementation

## Executive Summary

We are pivoting from a "Canvas Spreadsheet" (Excel-clone) approach to a **"Row-Centric Smart Grid"** (Smartsheet-style). This aligns better with Worktree's core value proposition: bridging field data (Forms/Routes) with back-office planning.

**Why not just clone Excel?**
Excel is a 2D canvas of unstructured data. Worktree needs structured data. A "Row" in Worktree represents a real-world entity (a Task, a Stop, an Asset). It needs a stable ID, attachments, activity history, and assignment status. Smartsheet's model (Database disguised as a Spreadsheet) is the correct architectural fit.

## Technical Architecture

### 1. The Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **State & Sync** | **Yjs** | Industry standard for CRDTs. Handles conflict resolution and offline-merging natively. |
| **Transport** | **Hocuspocus** (or custom Socket.io w/ Yjs) | Stateless WebSocket server that binds Yjs documents to Redis/Postgres persistence. |
| **Rendering** | **TanStack Table (v8)** | Headless UI library. Gives us 100% control over markup (unlike Canvas grids) for Accessibility and Custom Cell Renderers. |
| **Virtualization** | **TanStack Virtual** | Essential for rendering 1000+ rows at 60fps without DOM bloat. |
| **Math Engine** | **Hyperformula** | The gold standard headless formula engine (used by Handsontable). Handles DAG dependency graphs for recalculation. |
| **Persistence** | **Postgres (JSONB + Relational)** | We will hybridize storage. Active sheets live in Yjs binaries; Snapshots are saved to Postgres. |

### 2. Data Model (Row-Centric)

Unlike Excel (`Cell["A1"]`), our model is `Row["UUID"] -> Column["FieldID"]`.

**Structure:**
- **Columns:** Typed definitions (`{ id: "status", type: "SELECT", options: [...] }`).
- **Rows:** Objects with stable UUIDs (`{ id: "row_123", data: { "status": "Done", "title": "Fix pipe" } }`).
- **Hierarchy:** Rows have `parentId` and `order` index to support Smartsheet-style indentation/grouping.

### 3. Key Features to Build

#### A. The "Smart" Columns
Standard text columns are insufficient. We need:
- **Status Column:** Dropdown with colored badges (RAG status).
- **User Column:** Renders Avatar, handles "Assignment" notifications on change.
- **Attachment Column:** Shows count of files attached to the row.
- **Formula Column:** Read-only, calculated by Hyperformula on the server (or client-side for speed).

#### B. Row Detail Panel
Clicking a row (or pressing Space) opens a **Side Panel**.
- **Chat:** Contextual discussion *about this specific task*.
- **History:** "Who changed 'Budget' from $500 to $5000?" (Field-level audit).
- **Files:** Drag-and-drop bucket specific to this row.

#### C. Real-Time Collaboration
- **Presence:** Colored borders around cells being edited by others.
- **Locking:** Atomic locking of a cell *while* a user is typing (optimistic).

## Implementation Strategy

### Phase 1: The Virtualized Grid (Read/Write)
- Implement `TanStack Table` with `useVirtualizer`.
- Create the "Cell Factory" (Switch statement for Text/Select/Date renderers).
- Connect to `Y.Map` for real-time updates.

### Phase 2: The Logic Layer
- Integrate `Hyperformula`.
- Implement "Sort" and "Filter" (Client-side first).
- Add "Row Indentation" (Visual tree structure).

### Phase 3: The Integrations
- **Form-to-Sheet:** A Form Submission automatically appends a Row to a specific Sheet.
- **Sheet-to-Route:** "Right-click Row -> Send to Route" functionality.

## Comparison: Custom vs. Libraries

| Feature | NocoDB / RowsnColumns | Custom (Our Plan) |
| :--- | :--- | :--- |
| **Flexibility** | Low (Opinionated UI) | **High** (Pixel-perfect match to our Design System) |
| **Integration** | Hard (Iframe or SDK) | **Seamless** (Native React Components) |
| **Performance** | Variable | **Optimized** (We control the render loop) |
| **Cost** | License Fees (Enterprise) | **Dev Time only** |

**Conclusion:** Building a custom grid on top of headless libraries (`TanStack`, `Yjs`) offers the best balance of "Control vs. Effort" for a core product differentiator.
