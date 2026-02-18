# Alternative Views

This directory contains alternative view components for displaying sheet data in different formats beyond the standard grid view.

## Components

### GanttView

**File**: `GanttView.tsx`

A Gantt chart timeline view for project management and task scheduling.

**Features**:
- Auto-detects start and end date columns
- Displays tasks as timeline bars
- Supports hierarchical tasks with depth indentation
- Shows task duration in days
- Monthly timeline with day-level granularity

**Column Detection**:
- Start Date: Looks for columns with type `DATE` or labels containing "start", "begin"
- End Date: Looks for columns with type `DATE` or labels containing "end", "finish", "due"
- Label: Looks for columns with type `TEXT` or labels containing "name", "title", "task", "label"

**Fallback UI**: If required columns are not detected, shows a configuration panel for manual mapping.

---

### CalendarView

**File**: `CalendarView.tsx`

A monthly calendar view for date-based task visualization.

**Features**:
- Monthly calendar with date picker
- Shows dots on dates with tasks
- Lists tasks for selected date in sidebar
- Click tasks to open detail panel
- Uses `react-calendar` library for calendar UI

**Column Detection**:
- Date: Looks for columns with type `DATE` or labels containing "date", "due", "deadline", "scheduled"
- Label: Looks for columns with type `TEXT` or labels containing "name", "title", "task", "label", "description"

**Fallback UI**: If date column is not detected, shows a configuration panel for manual mapping.

---

### CardView

**File**: `CardView.tsx`

A Kanban-style card board view for workflow management.

**Features**:
- Displays rows as cards grouped by status/category
- Drag and drop cards between lanes (updates status automatically)
- Shows card count per lane
- Click cards to open detail panel
- Uses `@dnd-kit` for drag and drop functionality

**Column Detection**:
- Status/Category: Looks for columns with type `SELECT` or labels containing "status", "state", "stage", "category", "phase"
- Label: Looks for columns with type `TEXT` or labels containing "name", "title", "task", "label"

**Fallback UI**: If status column is not detected, shows a configuration panel for manual mapping.

---

## Usage

These views are integrated into the `SheetDetailView` component and can be switched between using the view selector in the sheet toolbar.

```tsx
import { GanttView, CalendarView, CardView } from '../views';

// In render logic
switch (activeView) {
  case 'GANTT':
    return <GanttView />;
  case 'CALENDAR':
    return <CalendarView />;
  case 'CARD':
    return <CardView />;
  default:
    return <GridView />;
}
```

## Dependencies

- `react-calendar`: Calendar UI component
- `@dnd-kit/core`: Drag and drop core functionality
- `@dnd-kit/sortable`: Sortable list utilities
- `date-fns`: Date manipulation and formatting

## Styling

- All views use Tailwind CSS classes for styling
- CalendarView has custom CSS in `globals.css` to match the app theme
- Components are responsive and adapt to different screen sizes

## Future Enhancements

- **Gantt**: Add gantt-task-react library for more advanced features
- **Calendar**: Add week and day views
- **Card**: Add swimlanes and custom column ordering
- **All**: Add export/print functionality
