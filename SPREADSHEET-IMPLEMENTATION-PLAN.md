# Spreadsheet Implementation Plan - Status Report

**Last Updated:** January 27, 2026
**Current Status:** Phase 1 Complete - Basic Grid Interactions Working
**Technology:** @rowsncolumns/grid (Canvas-based MIT-licensed spreadsheet)

---

## Executive Summary

This document tracks the implementation of interactive spreadsheet functionality for Worktree. We pivoted from building a custom TanStack Table implementation to integrating **@rowsncolumns/grid** - a performant, canvas-based spreadsheet library with MIT licensing.

### Why @rowsncolumns/grid?

- ✅ **MIT Licensed** - No licensing concerns
- ✅ **Canvas Rendering** - High performance for large datasets
- ✅ **Low-level Control** - We can build our interaction layer on top
- ✅ **Active Development** - Modern library with good TypeScript support
- ✅ **Konva-based** - Proven canvas rendering framework

---

## Current Implementation Status

### ✅ Phase 1: Core Grid Interactions (COMPLETED)

**File:** `apps/frontend/features/sheets/components/canvas-grid/RnCGridWrapper.tsx`

#### Completed Features:

1. **Cell Rendering**
   - Grid displays with proper row/column structure
   - Cells show text content from Yjs document
   - Responsive canvas sizing (1200x800px)

2. **Cell Selection**
   - Single-click to select cell
   - Blue selection border appears
   - `activeCell` state tracks current selection

3. **Cell Editing**
   - Double-click enters edit mode
   - Absolute positioned input overlay
   - Edit value syncs to Yjs on commit

4. **Keyboard Navigation**
   - Arrow keys (Up/Down/Left/Right) move between cells
   - Enter/F2 to start editing
   - Enter while editing commits and moves down
   - Escape cancels edit
   - Delete/Backspace clears cell
   - Typing any character starts edit mode

5. **Real-time Sync**
   - Yjs CRDT integration via Hocuspocus
   - WebSocket connection (port 1234)
   - Changes sync across all connected clients
   - Cells stored in Yjs Map with key format: `{row}:{col}`

6. **Click Detection**
   - Canvas coordinate to cell index conversion
   - `stageProps.onClick` and `stageProps.onDblClick` handlers
   - Coordinate formula: `Math.floor(pos / cellSize)`

#### Technical Details:

**State Management:**
```typescript
const [activeCell, setActiveCell] = useState<CellInterface | null>(null);
const [isEditing, setIsEditing] = useState(false);
const [editValue, setEditValue] = useState('');
```

**Cell Data Structure:**
```typescript
cellsMap.set(key, {
  value: isFormula ? null : (value || null),
  formula: isFormula ? value.trim() : undefined,
  type: isFormula ? 'FORMULA' : 'TEXT',
});
```

**Constants:**
- `ROW_HEIGHT`: 32px
- `DEFAULT_COLUMN_WIDTH`: 120px
- Default Grid: 100 rows x 26 columns (A-Z)

---

## Bugs Fixed

### ✅ React Hooks Ordering Error
**Error:** "Rendered more hooks than during the previous render"

**Root Cause:** `getActiveCellBounds` useCallback hook was defined AFTER an early return statement, causing inconsistent hook counts between renders.

**Solution:** Moved all hooks before conditional early returns to ensure consistent hook ordering.

**Files Changed:**
- `apps/frontend/features/sheets/components/canvas-grid/RnCGridWrapper.tsx` - Reorganized hook definitions

### ✅ WebSocket Connection Issues
**Issue:** Grid showed "Connecting to sheet..." but never connected

**Root Cause:** WebSocket server wasn't running

**Solution:** Started Hocuspocus server on port 1234 with `npm run start:ws`

### ✅ Project Creation Failure
**Error:** Foreign key constraint violation on `Project_createdById_fkey`

**Root Cause:** Database schema out of sync, user not authenticated

**Solution:**
1. Ran pending database migrations
2. Seeded initial users
3. Logged in as admin user

---

## 🚧 Phase 2: Formula Engine (IN PROGRESS - PAUSED)

### Attempted Integration:

**Library:** `fast-formula-parser` (MIT licensed)
**Hook:** `useFormulaEngine` in `apps/frontend/features/sheets/components/canvas-grid/hooks/useFormulaEngine.ts`

### Issues Encountered:

1. **Module Import Error**
   - Initially tried importing from non-existent custom wrapper
   - Fixed by using direct import: `import FormulaParser from 'fast-formula-parser'`

2. **React Hooks Violation**
   - Attempted conditional hook call: `doc ? useFormulaEngine(...) : null`
   - Violates React's rules of hooks
   - **Status:** Removed for now, basic grid works without formulas

### Next Steps for Formula Support:

To properly integrate formulas:

1. **Always call the hook:**
   ```typescript
   const formulaEngine = useFormulaEngine({
     yjsDoc: doc || new Y.Doc(), // Provide empty doc if none
     maxRows: rows,
     maxCols: columns
   });
   ```

2. **Update cell rendering:**
   ```typescript
   itemRenderer={(props) => {
     const cellValue = formulaEngine?.getCellValue(props.rowIndex, props.columnIndex)
       ?? data[props.rowIndex]?.[props.columnIndex];
     return <Cell {...props} value={cellValue ?? ''} />;
   }}
   ```

3. **Handle formula editing:**
   - Show formula string in edit mode (e.g., `=SUM(A1:A10)`)
   - Display computed result in cell view
   - Update `handleCellDoubleClick` to get raw formula from Yjs

---

## 📋 Remaining Features (Planned)

### Phase 3: Advanced Interactions

1. **Copy/Paste**
   - Ctrl+C / Ctrl+V support
   - Handle ranges (e.g., A1:C10)
   - Preserve formulas vs. values

2. **Undo/Redo**
   - Yjs has built-in undo manager
   - Integrate with `Y.UndoManager`
   - Ctrl+Z / Ctrl+Y keyboard shortcuts

3. **Cell Formatting**
   - Bold, italic, underline
   - Font size and color
   - Background color
   - Number formatting (currency, percentages)

4. **Selection Ranges**
   - Click and drag to select multiple cells
   - Show selection overlay
   - Operations on ranges (delete, format, fill)

### Phase 4: Row/Column Operations

1. **Insert/Delete Rows**
   - Right-click context menu
   - Shift row indices in Yjs
   - Update formula references

2. **Insert/Delete Columns**
   - Similar to rows but for columns
   - Handle column width adjustments

3. **Resize Rows/Columns**
   - Drag handles on headers
   - Store custom sizes in Yjs metadata

### Phase 5: Advanced Features

1. **Merged Cells**
   - Support for cell spanning
   - Update rendering logic
   - Handle selection across merged cells

2. **Cell References in Formulas**
   - Visual highlighting when editing formulas
   - Show referenced cells on canvas
   - Syntax highlighting for formula strings

3. **Formula Autocomplete**
   - Dropdown with available functions
   - Show function signatures
   - Tab completion

4. **Import/Export**
   - Excel (.xlsx) import/export
   - CSV import/export
   - Preserve formatting where possible

### Phase 6: Collaboration Features

1. **User Presence**
   - Show active users' cursors
   - Colored borders around cells being edited
   - User avatars in header

2. **Cell Comments**
   - Add notes to cells
   - Thread discussions
   - @mention users

3. **Change History**
   - View edit history per cell
   - Restore previous values
   - Show who made changes

---

## Architecture Decisions

### Why Canvas Instead of DOM?

**Pros:**
- 10-100x faster rendering for large grids
- No DOM node limit issues
- Smooth scrolling with virtualization
- Consistent rendering across browsers

**Cons:**
- Accessibility requires extra work
- No native HTML form elements
- Copy/paste needs manual implementation
- Screen reader support is complex

### Why Yjs for State?

**Pros:**
- Industry-standard CRDT implementation
- Built-in conflict resolution
- Offline-first with automatic merge
- Undo/redo support built-in
- WebSocket or WebRTC transport

**Cons:**
- Binary protocol (harder to debug)
- Learning curve for CRDT concepts
- Server infrastructure needed (Hocuspocus)

---

## File Structure

```
apps/frontend/features/sheets/
├── components/
│   ├── canvas-grid/
│   │   ├── RnCGridWrapper.tsx          # Main grid component (✅ Working)
│   │   ├── types.ts                     # Type definitions & constants
│   │   └── hooks/
│   │       └── useFormulaEngine.ts      # Formula evaluation (🚧 Paused)
│   ├── grid/
│   │   └── SheetDetailView.tsx          # Wrapper component
│   ├── shell/
│   │   └── SheetShell.tsx               # Toolbar UI
│   └── panels/
│       └── RowDetailPanel.tsx           # Side panel (not implemented)
├── stores/
│   └── useYjsStore.ts                   # Yjs connection management (✅ Working)
└── providers/
    └── SheetProvider.tsx                # Context provider

apps/backend/
└── src/
    └── ws-server.ts                     # Hocuspocus WebSocket server (✅ Running)
```

---

## Testing Checklist

### ✅ Completed Tests

- [x] Grid renders without errors
- [x] Cells are clickable
- [x] Selection border appears on click
- [x] Double-click shows edit overlay
- [x] Typing updates cell value
- [x] Enter commits changes
- [x] Arrow keys navigate cells
- [x] Changes sync to Yjs
- [x] WebSocket connects successfully
- [x] No React hooks errors

### 🚧 Pending Tests

- [ ] Formula evaluation works (`=SUM(A1:A10)`)
- [ ] Copy/paste functionality
- [ ] Undo/redo operations
- [ ] Multi-cell selection
- [ ] Row/column insert/delete
- [ ] Cell formatting persists
- [ ] Excel import/export
- [ ] Multiple users see each other's changes
- [ ] Offline changes sync when reconnected
- [ ] Large datasets (1000+ rows) perform well

---

## Known Issues

### 1. No Formula Support (Yet)
**Impact:** Users can't use calculations like `=SUM(A1:A10)`
**Workaround:** None - formulas show as text
**Fix:** Complete Phase 2 integration

### 2. No Visual Feedback While Editing
**Impact:** Users don't see autocomplete or syntax highlighting
**Workaround:** None
**Fix:** Implement formula autocomplete in Phase 5

### 3. Limited Cell Types
**Impact:** All cells render as plain text
**Workaround:** None
**Fix:** Implement cell type system (number, date, select, etc.)

### 4. No Row/Column Headers
**Impact:** Can't see column letters (A, B, C) or row numbers
**Workaround:** Count manually
**Fix:** Add header row/column rendering

---

## Performance Targets

- **Initial Load:** < 1s for 100 rows x 26 columns
- **Cell Update:** < 16ms (60 FPS)
- **Keyboard Navigation:** < 16ms per keystroke
- **Yjs Sync:** < 100ms round-trip for changes
- **Large Grid:** Support 10,000 rows with virtualization

---

## Dependencies

```json
{
  "@rowsncolumns/grid": "^9.0.4",
  "fast-formula-parser": "^1.0.19",
  "konva": "^9.3.15",
  "react-konva": "^18.2.10",
  "yjs": "^13.6.20",
  "@hocuspocus/provider": "^2.13.9",
  "@hocuspocus/server": "^2.13.9"
}
```

---

## Next Development Session

### Immediate Priority:

1. **Fix Formula Engine Integration**
   - Remove conditional hook call
   - Always instantiate useFormulaEngine
   - Test with simple formula: `=1+1`

2. **Add Column/Row Headers**
   - Render header row with letters (A, B, C...)
   - Render header column with numbers (1, 2, 3...)
   - Make headers sticky during scroll

3. **Implement Cell Types**
   - Text (default)
   - Number (right-aligned)
   - Date (formatted display)
   - Boolean (checkbox)

### Medium Priority:

4. **Add Copy/Paste**
5. **Implement Undo/Redo**
6. **Row/Column Operations**

### Long-term:

7. **Complete Phase 5 & 6 features**
8. **Performance optimization for 10k+ rows**
9. **Accessibility improvements**

---

## Resources

- **@rowsncolumns/grid Docs:** https://github.com/rowsncolumns/grid
- **Yjs Documentation:** https://docs.yjs.dev/
- **Hocuspocus Guide:** https://tiptap.dev/hocuspocus
- **fast-formula-parser:** https://github.com/LesterLyu/fast-formula-parser
- **Konva Documentation:** https://konvajs.org/

---

## Lessons Learned

1. **React Hooks Rules Are Strict**
   - Never conditionally call hooks
   - Always call in the same order
   - Define all hooks before early returns

2. **Canvas Event Handling**
   - Use stage-level events (onClick, onDblClick)
   - Convert canvas coordinates to cell indices
   - Can't use HTML event delegation

3. **Yjs Integration**
   - Keep data structure simple (flat maps)
   - Use consistent key format (`row:col`)
   - Observe changes at map level, not per key

4. **Formula Libraries**
   - Check export format (default vs named)
   - fast-formula-parser uses default export
   - Test in isolation before integrating

---

## Success Criteria

### Phase 1 (✅ Complete)
- [x] Basic grid renders
- [x] Cells are editable
- [x] Changes sync in real-time
- [x] Keyboard navigation works

### Phase 2 (Next)
- [ ] Formulas evaluate correctly
- [ ] Formula bar shows current cell formula
- [ ] Circular reference detection

### Phase 3+ (Future)
- [ ] Copy/paste functionality
- [ ] Undo/redo works
- [ ] Multiple users can edit simultaneously
- [ ] Performance benchmark met (< 16ms updates)

---

**Document Status:** Current as of January 27, 2026
**Next Review:** After Phase 2 completion
