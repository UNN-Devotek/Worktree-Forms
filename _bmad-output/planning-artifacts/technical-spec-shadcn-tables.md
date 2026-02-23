# Course Correction: Live Shadcn Table Implementation

## 1. Objective

Replace heavy, complex spreadsheet frameworks (AG Grid, Canvas-based grids) with a lightweight, high-performance "Live Table" built using **Shadcn/UI components**, **TanStack Table**, and **Yjs**.

**Core Philosophy:** "Ship the smallest thing." Simplicity over features.

## 2. Architecture Changes

### A. Deprecations (Remove)

- **AG Grid**: Remove `ag-grid-community`, `ag-grid-react`.
- **Canvas Rendering**: Remove `react-konva`, `konva` (unless used for Signature/PDF). The Grid will be **DOM-based**.
- **Complex Wrappers**: Remove any "Excel-like" wrappers that abstract away the DOM.

### B. The New Stack (Retain/Add)

- **UI Layer**: `components/ui/table.tsx` (Shadcn).
- **Data Layer**: `@tanstack/react-table` (Headless logic for sorting, filtering, columns).
- **Sync Layer**: `yjs` + `y-websocket` (Real-time state).
- **Virtualization**: `@tanstack/react-virtual` (For performance with 10k+ rows).
- **Logic**: `hyperformula` (Keep for cell calculations, running in Web Worker).

## 3. Implementation Specification

### 3.1 Data Model (Yjs)

- **Document Structure**:
  ```ts
  const doc = new Y.Doc();
  const rows = doc.getArray("rows"); // Array of Row Objects
  const columns = doc.getMap("columns"); // Column Definitions
  ```
- **Row Object**:
  ```ts
  {
    id: "cuid",
    data: { "col_1": "Value", "col_2": 123 },
    meta: { "indent": 0, "parent": null }
  }
  ```

### 3.2 The `LiveTable` Component

- **Wrapper**: No canvas. Standard HTML `<table>` via Shadcn.
- **Virtualization**: Use `useVirtualizer` on the `<tbody>` to render only visible rows.
- **Columns**: Dynamic definition based on Yjs `columns` Map.
- **Cells**:
  - **Text**: Simple `<input>` or `ContentEditable`.
  - **Select**: Shadcn `<Select>`.
  - **Member**: Shadcn `<Avatar>` + `<Popover>`.
- **Selection**: Custom hook to track "Selected Cell" (ColIndex, RowIndex). Uses Shadcn `cn()` to apply blue ring.

### 3.3 Feature Parity (Simplified)

- **Sorting/Filtering**: Native TanStack Table features.
- **Drag & Drop**: `@dnd-kit` for Row reordering.
- **Collab**: Yjs Awareness for "Who is here" (Avatars in header, cell borders).
- **Formulas**: Hyperformula instance syncs with Yjs data.

## 4. Migration Steps

1.  **Clean Up**: Uninstall `ag-grid-*`.
2.  **Scaffold**: Create `features/sheets/components/LiveTable.tsx`.
3.  **Connect**: Hook up `useYjsStore` to `LiveTable`.
4.  **Polish**: Apply Shadcn styles to match the "Premium" aesthetic.

## 5. Revised Epics/Stories

- **Epic 6 (Live Smart Grid)** is now **Epic 6 (Live Data Table)**.
- Remove references to "Canvas" or "Excel-like".
- Focus on "Responsive DOM Table".
