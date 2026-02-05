# UI Implementation Map: Worktree

> [!NOTE]
> Part of the **[Worktree Project Plan](./project-context.md)**.
> **Role:** Defines **WHERE** code lives for every screen.
> **Source:** `5-ui-implementation-map.md`

## 1. Global Shell & Layouts

### 1.1 Root Layout & Shell

- **File:** `apps/frontend/app/layout.tsx` (Providers)
- **File:** `apps/frontend/app/(dashboard)/layout.tsx` (Shell)
- **Shell Component:** `<DashboardLayout />` (`features/projects/components/dashboard-layout.tsx`)
- **Global Components:**
  - `<Sidebar />` (`features/projects/components/sidebar.tsx`) - Desktop navigation (Home, Teams, Tasks).
  - `<MobileNav />` (`features/projects/components/mobile-nav.tsx`) - Hamburger menu for mobile.
  - `<AiAssistant />` (`components/ai/AiAssistant.tsx`) - Persistent FAB/Sidebar agent.
  - `<OfflineIndicator />` (`components/global/offline-indicator.tsx`) - Top-bar sync status.

### 1.2 Authentication Layout

- **File:** `apps/frontend/app/(auth)/layout.tsx`
- **Description:** Center-aligned branded card layout.
- **Component:** `<AuthShell />`

## 2. Project Workspace Navigation

### 2.1 Tab-Based Navigation

- **File:** `apps/frontend/app/(dashboard)/project/[slug]/layout.tsx`
- **Component:** `<ProjectTabs />` (`features/projects/components/project-tabs.tsx`)
- **Tab Structure (Shadcn Tabs):**
  - **Overview** -> `/project/[slug]`
  - **Spreadsheets** -> `/project/[slug]/sheets`
  - **My Route** -> `/project/[slug]/route`
  - **RFIs** -> `/project/[slug]/rfis`
  - **Specs** -> `/project/[slug]/specs`
  - **Blueprints** -> `/project/[slug]/blueprints`
  - **Schedule** -> `/project/[slug]/schedule`
  - **Team Chat** -> `/project/[slug]/chat`
  - **Settings** -> `/project/[slug]/settings` (ml-auto)

## 3. Feature: Smart Grid (Smartsheet-Style)

- **Route (List):** `/project/[slug]/sheets` -> `features/sheets/pages/sheet-list-page.tsx`
- **Route (Editor):** `/project/[slug]/sheets/[sheetId]` -> `features/sheets/pages/sheet-detail-page.tsx`
- **Container:** `<SheetShell />` (Wraps Toolbar and View area).

### 3.1 Grid Core Components
- **Main View:** `<SmartGrid />` (`features/sheets/components/grid/SmartGrid.tsx`)
  - Tech: `TanStack Table v8` + `TanStack Virtual`.
  - Sync: `useYjsStore` (Hocuspocus Provider).
- **Toolbar:** `<SheetToolbar />` (`features/sheets/components/controls/SheetToolbar.tsx`)
  - View Switcher (Tabs: Grid, Gantt, Calendar, Card).
  - Formatting (Font, Color, Bold).
  - Actions (Filter, Sort, Share, Import/Export).
- **Column Header:** `<ColumnHeader />` (Right-click menu: Rename, Delete, Hide, Lock).

### 3.2 View Alternates
- **Gantt:** `<GanttView />` (`features/sheets/components/views/GanttView.tsx`) - Timeline visualization.
- **Calendar:** `<CalendarView />` (`features/sheets/components/views/CalendarView.tsx`) - Month/Week view.
- **Board:** `<CardView />` (`features/sheets/components/views/CardView.tsx`) - Kanban style (Status-mapped).

### 3.3 Side Panels & Dialogs
- **Detail Panel:** `<RowDetailPanel />` (`features/sheets/components/panels/RowDetailPanel.tsx`)
  - Tabs: Fields | Chat (Threaded) | Files (MinIO) | History.
- **Column Manager:** `<ColumnManagerDialog />` (Add/Edit column types and validation).
- **Import Wizard:** `<SmartImportModal />` (Mapping wizard for Excel/CSV upsert).

## 4. Feature: Form Builder & Submissions

- **Route:** `/project/[slug]/forms` -> Overview/List.
- **Route (Builder):** `/project/[slug]/forms/builder/[id]` -> `features/forms/pages/builder-page.tsx`
- **Route (Review):** `/project/[slug]/forms/review/[id]` -> Data Grid of submissions.
- **Components:**
  - `<FormCanvas />` (DndKit drop zone).
  - `<SmartTableField />` (Form field that renders a matrix input).
  - `<PDFOverlayEditor />` (WYSIWYG mapping of fields onto PDF).

## 5. Feature: Route Builder & Field Ops

- **Route:** `/project/[slug]/route`
- **Components:**
  - `<MapVisualizer />` (`features/maps/components/MapVisualizer.tsx`) - MapLibre.
  - `<StopList />` (List of stops derived from Sheet Rows).
  - `<MobileRouteRunner />` (Offline-first execution view).
- **Integration:** 
  - `Sheet-to-Route` sync handled via shared Yjs document or API trigger.

## 6. Feature: Team Collaboration

- **Route:** `/project/[slug]/chat`
- **Components:**
  - `<ChatWindow />` (Socket.io powered).
  - `<SystemNotifications />` (Activity feed in Sidebar).
  - `<ActionInbox />` (Assigned items across all features).

## 7. Global Dialog Registry

- **File:** `apps/frontend/components/providers/modal-provider.tsx`
- **Modals:**
  - `visa-gate-modal`
  - `media-viewer-modal` (Lightbox)
  - `api-key-manager`
  - `feedback-shake-modal`

## 8. Theme & UX Infrastructure

- **Tailwind Config:** `tailwind.config.ts` (Ameritech Brand colors).
- **Icons:** `lucide-react`.
- **Loading:** `Skeleton` loaders for Grid and Dashboard metrics.
- **Error:** `error.tsx` boundaries at Global and Project levels.

---

> **Developer Note:** This map reflects the pivot to **Row-Centric Smart Grids** and the **Tab-based Project Navigation** implemented in Jan 2026.