---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/research/technical-PRD-Feasibility-research-2026-01-08.md
  - docs/minio-guide.md
---

# UX Design Specification Worktree

> [!NOTE]
> Part of the **[Worktree Project Plan](./project-context.md)**.
> **Role:** Defines **LOOK & FEEL**.
> **Source:** `ux-design-specification.md`

**Author:** White
**Date:** 2026-01-08

---

## Executive Summary

### Project Vision

WorkTree unifies field operations and back-office management into a self-hosted, project-centric platform. It replaces disjointed tools (Excel, SurveyJS, Routing Apps) with a single, secure environment where "Projects" serve as the central container for forms, files, chat, and routes. The core philosophy is "Field Operations MVP"—prioritizing offline reliability and "muddy thumb" usability for technicians while providing powerful, Excel-like management tools for admins.

### Target Users

- **The Dispatcher (Sarah):** Needs a robust "Mission Control" for creating complex workflows and re-routing technicians in seconds. UX Priority: **Speed, Efficiency, & Density.**
- **The Field Tech (Mike):** Needs a "Zero-Friction" mobile experience. Works offline, in rain/glare. UX Priority: **Clarity, Large Touch Targets, & "Muddy Thumb" Usability.**
- **The Collaborator (James):** Focuses on documents and visuals (Blueprints). UX Priority: **Precision (Annotation) & Version Awareness.**

### Key Design Challenges

1.  **Hybrid Interfaces:** Designing a component system (Smart Table) that morphs from a high-density Spreadsheet on Desktop to a Card List on Mobile without losing functionality.
2.  **Mobile Performance:** Displaying 50MB Blueprints on tablets without lag (requiring a Tile Server/Image approach) and managing Geolocation without draining battery (SLC API).
3.  **Seamless Security (The Visa Gate):** Making the mandatory "Visa Wizard" (Insurance/Safety checks) feel like a helpful onboarding step rather than a bureaucratic blocker.

### Design Opportunities

1.  **Anticipatory UI (Contextual Compass):** Using Geofencing to surface the _right_ tool at the _right_ time (Arrival at site = Auto-launch Site Dashboard), eliminating menu digging.
2.  **Active Blueprints:** Turning static PDFs into navigable interfaces where "Spaces" are buttons that launch workflows.
3.  **"Magic" Inputs:** Leveraging AI/Automation (Email ingestion, Auto-renaming) to reduce manual data entry to near zero.

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Core User Experience

### Defining Experience

The core experience is defined by **"Contextual Execution."** The application actively assists the user by anticipating their needs based on Location (Geofence) and Role. For the Field Tech, it is a "Zero-Friction" tool that captures data without interrupting physical work. For the Admin, it is a high-speed "Command Center" that turns chaos into structured data in real-time.

### Platform Strategy

- **Field (Mobile/Tablet):** Progressive Web App (PWA). Priorities: **Outdoor Visibility (High Contrast Mode)**, **Offline Reliability**, and **One-Handed Use**.
- **Office (Desktop):** Power User Interface. Priorities: **Keyboard Shortcuts (Hotkeys)**, **Data Density**, and **Multi-Window workflows**.

### Effortless Interactions

1.  **Task-Aware Compass:** Auto-launching the _exact required form_ (e.g., "Overdue Safety Check") upon site arrival, skipping the navigation tree entirely.
2.  **Smart Attributes:** Auto-filling distinct metadata (Time, Location, User, Weather) so the user doesn't have to type it.
3.  **Visual Uploads:** Camera-first inputs that auto-compress and name files, removing file management from the user.

### Critical Success Moments

- **The Sunlight Test:** A technician using the app at noon in direct sun can clearly see the "Submit" button and "Sync Status".
- **The "Power User" Flow:** An Admin creating, saving, and deploying a form entirely via keyboard without touching the mouse.
- **The "Tunnel" Sync:** Seamless background syncing after offline work without data loss or conflicts.

### Experience Principles

1.  **Muddy Thumb First:** All field interactions must work with one hand, efficiently, in poor conditions (Sun/Rain/Gloves).
2.  **Keyboard Speed:** Admin interfaces must respect the speed of thought—no mouse hunting for common actions.
3.  **Active Assistance:** The system performs administrative tasks (Naming, Organizing, Routing) so the human can focus on skilled work.

## Desired Emotional Response

### Primary Emotional Goals

1.  **Pride (Field):** The feeling of professional competence. "I used this tool to document my work perfectly."
2.  **Mastery (Office):** The sense of total control. The admin feels omniscient and capable of manipulating complex operations without friction.

### Emotional Journey Mapping

- **Login/Start:** **Clarity.** "I know exactly what keeps me from going home today." (Route List / Task List).
- **Offline Work:** **Panic-Free Security.** "I am not afraid of losing data because I see it persisting even if I close the app."
- **Submission:** **Closure.** A definitive, satisfying "Done" state that mentally releases the user from the task.
- **Visa Wizard:** **Professionalism.** "This company takes safety seriously, and I am qualified to work here."

### Micro-Emotions

- **"Reviewer's High":** The satisfaction Sarah feels when bulk-approving 50 forms in 10 seconds.
- **"Muddy Thumb" Confidence:** The lack of hesitation when Mike taps a giant "Photo" button with dirty gloves.
- **"Credentialed" Status:** The feeling of belonging experienced by a subcontractor after passing the Visa check.

### Design Implications

- **Visual Persistence:** Input data must survive a "Hard Refresh" or App Crash instantly (Local Storage).
- **Positive Friction:** Make "Delete" or "Reject" actions slightly harder to prevent fear of accidental data loss.
- **Professional Aesthetics:** The Visa Wizard should look like a digital passport stamps/badges, not a tax form.

### Emotional Design Principles

1.  **Don't Make Me Think:** If the user has to guess what an icon means, we failed.
2.  **Celebrate Completion:** The "Submit" action should feel momentous and final.
3.  **Safeguard:** Implement "Soft Delete" logic for all keyboard-driven destructive actions (e.g., hitting `Del` key on a row).

## UX Pattern Analysis & Inspiration

### Inspiring Products

- **Linear (Admin):** For its keyboard-centric command palette and high-density lists. _Constraint: Use off-the-shelf `cmdk`._
- **Uber Driver (Field):** For its map-first "Trip Mode" and clear "Next Stop" cards.
- **Procreate (Field):** For its precise touch interactions.

### Anti-Patterns to Avoid

- **Hamburger Basement:** Hiding core actions in deep menus.
- **Save Facade:** The illusion of saving (Auto-Save is preferred, but "Destructive Auto-Save" must be avoided).
- **PDF Jail:** Trying to render HTML forms exactly as PDFs on screen (Better: Data entry view vs Output view).

## Core Feature UX Definition

### 2.1 The Form Editor (Model: GoFormz)

**Goal:** A dual-purpose editor that handles both PDF digitization (Legacy) and Mobile Optimization (Future).

**Layout: "The Trinity"**

1.  **Left Panel (Field Editor):** A drag-and-drop list of available inputs (Text, Photo, Signature, GPS).
2.  **Center Canvas (Split View):**
    - **Tab A: PDF Overlay (Page Editor):** A WYSIWYG canvas where fields are dropped onto the original PDF background.
    - **Tab B: Mobile Flow (List View):** A linear, logic-based view of the form as it appears on the App.
3.  **Right Panel (Properties):** Deep configuration for the selected field (Validation, Conditional Logic).

**Key Interactions:**

- **Auto-Build:** Dragging a field onto the PDF automatically adds it to the Mobile Flow (Auto-linked). Users can "Unlink" to re-order mobile fields independently.
- **Dynamic Naming:** Form Title configuration supporting Handlebars syntax: `{{Customer_Name}} - {{Date}}`.
- **Typewriter Export:** PDF generation renders _only_ the value text (transparent background), sitting perfectly over the original PDF form lines.

### 2.2 The Route Builder (Model: Mapsly)

**Goal:** A "Mission Control" map that combines geography with agenda.

**Layout: "The Dispatch Board"**

1.  **Map Canvas (Center/Right):** The primary workspace. Displays all Jobs/Technicians as interactive pins.
    - **Engine:** **MapCN** (Shadcn + MapLibre). Theme-aware (Day/Night modes).
    - **Lasso Tool:** Draw a circle/polygon to select multiple jobs -> "Create Route".
    - **Territory Polygons:** Overlay semi-transparent colored zones to show Technician areas.
2.  **Route Panel (Left):** A collapsible list of "Draft Routes" and "Active Routes".
    - **Drag & Drop:** Move jobs between Technician cards to re-balance workload.
3.  **Timeline View (Bottom Toggle):** A "Gantt Chart" view showing routes against time, highlighting gaps or overlaps (Traffic-Aware).

### 2.3 The Help Center Studio (Model: GitBook/Notion)

**Goal:** Empower Admins to write "How-To" guides that solve problems before Mike calls Sarah.

**Layout: "The Writing Room"**

1.  **Sidebar (Structure):** Tree view of Categories (Folders) and Articles.
    - **Drafts:** Private, work-in-progress.
    - **Published:** Live on the mobile app.
2.  **Editor Canvas (Center):** **Plate.js** rich-text environment.
    - **Block-Based:** Typing `/` triggers the block menu (Header, List, Image, Callout).
    - **Image Drop:** Dragging an image instantly uploads to MinIO and inserts the Markdown.
3.  **Preview Toggle (Top Bar):** "View as Mobile" toggle to inspect how it renders on a phone (375px width).

**Key Interactions:**

- **Instant Save:** No "Save" button. Drafts save to local storage + backend on every keystroke.
- **Context Awareness:** Admins can tag an article with "Safety" to make it appear automatically in the "Visa Gate" flow.

## Visual Design Foundation

### Color System

- **Primary (Brand):** `Ameritech Blue` (#0055B8) - Used for Navigation, Primary Buttons, and Headers.
- **Accent (Action):** `Ameritech Red` (#B31B1B) - Used for Call-to-Actions (CTAs) and Highlights.
- **Neutral:** `Gray-900` (#1F2937) for Text, `Gray-100` (#F3F4F6) for Backgrounds.
- **Dark Mode:** `Deep Blue` (#002555) Backgrounds to maintain brand identity even in dark mode.

### Typography System

- **Font:** **Inter** (Variable).
- **Scale:** 14px Base (Admin) / 16px Base (Mobile).
- **Weights:** Regular (400) for data, Medium (500) for headers. Avoid Bold (700) except for KPI numbers.

### Spacing & Layout Foundation

- **Grid:** 12-column Grid for Dashboard, Single Column Stack for Mobile.
- **Spacing Unit:** 4px Base (`1rem = 16px`).
- **Layout Model:** "The Trinity" (Left/Center/Right panels) used for complex editors (Forms/Routes).

### Accessibility Considerations

- **Focus States:** All interactive elements must have a `ring-2 ring-blue-400` focus ring for keyboard navigation.
- **High Contrast Mode:** A dedicated toggle for field workers that removes all subtle grays and enforces Black/White/Blue only.

## User Journey Flows

### 1. Project Setup (The Smartsheet Model)

**Actor:** Admin (Sarah)
**Goal:** Create a new project and configure data sources without coding.

```mermaid
graph TD
    A[Start: "New Project"] --> B{Import Data?}
    B -- Yes --> C[Upload CSV/Excel]
    B -- No --> D[Create Blank "Grid"]
    C --> E[Grid View (Smartsheet Logic)]
    E --> F[Configure "Price Book" Sheet]
    F --> G[Cross-Sheet Link: VLOOKUP Prices]
    G --> H[Configure "Rows"]
    H --> I[Add Attachments (PDFs/Specs) to Rows]
    I --> J[Setup Grouping: "By Status"]
    J --> K[End: "Project Database Ready"]
```

**Key Interactions:**

- **Grid First:** The project _is_ the spreadsheet. No abstract "Database" creation.
- **Row Attachments:** Files live on the row, not in a separate folder. Context is king.
- **Formula Engine:** Use Excel-standard syntax for pricing/logic.

### 2. Dispatch & Routing (The Mapsly Model)

**Actor:** Dispatcher (Sarah)
**Goal:** Assign unassigned service orders to the right technician based on location.

```mermaid
graph TD
    A[Trigger: 50 Unassigned Orders in Grid] --> B[Switch View: "Map Mode"]
    B --> C[Visual: Pins on MapCN Canvas]
    C --> D[Action: Lasso Tool Selection]
    D --> E[Select 10 Pins in "North Zone"]
    E --> F[Sidebar: "Assign To..."]
    F --> G[Drag to "Mike (Tech)" Card]
    G --> H[System: Calc Drive Time]
    H --> I[Action: "Optimize Route"]
    I --> J[Action: "Publish to App"]
    J --> K[End: Mike Recieves Push Notif]
```

**Key Interactions:**

- **Spatial Selection:** "Lasso" is faster than filtering a list of addresses.
- **Visual Feedback:** Dragging pins changes their color (Unassigned Gray -> Mike Blue).

### 3. Field Execution (The GoFormz Model)

**Actor:** Technician (Mike)
**Goal:** Complete the work without data entry friction.

### 4. Help & Support (The Self-Service Model)

**Actor:** Technician (Mike)
**Goal:** Fix a problem (e.g., "How to bleed a boiler") without calling the office.

```mermaid
graph TD
    A[Trigger: Stuck on Task] --> B[Open App "Help" Tab]
    B --> C[Search: "Bleed Boiler"]
    C --> D[Result: "Boiler Maintenance Guide"]
    D --> E[Read Article (Offline Cached)]
    E --> F{Did it help?}
    F -- Yes --> G[Thumbs Up -> Close]
    F -- No --> H[Action: "Shake to Report"]
    H --> I[Form: "Report a Problem"]
    I --> J[Auto-Attach: Logs/Screen/GPS]
    J --> K[Submit to Admin]
```

**Key Interactions:**

- **Offline First:** The Help Center syncs _text_ content locally. Images lazy-load but are cached once viewed.
- **Pinch-to-Zoom:** All images in articles open in a full-screen lightbox with zoom (critical for reading schematic wiring diagrams).

## Component Strategy

### Design System Components (Foundation)

- **Source:** `shadcn/ui` + `Ameritech Brand Theme`.
- **Usage:** 90% of the UI (Dialogs, Inputs, Dropdowns, Sheets, Tables).
- **Standardization:** All inputs wrapped in `react-hook-form` controls for consistent validation.

### Custom Components (The "Gap")

#### 1. Hybrid Form Designer (The Builder)

- **Purpose:** Merges the existing "Mobile-First" builder with new "PDF Overlay" capabilities.
- **Architecture ("The Trinity"):**
  - **Left (Toolbox):** Draggable Field Types (Text, Photo, GPS).
  - **Center (Canvas):** Dual Tabs.
    - **Tab A (PDF Overlay):** GoFormz-style WYSIWYG editor.
    - **Tab B (Mobile/Classic):** Preserves the **Existing Non-PDF Builder** UI. This is the "Master Logic" view.
  - **Right (Config):** Field Properties.
- **Data Flow:** Adding a field to PDF (Tab A) _automatically_ adds it to the Classic Builder (Tab B). Removing from Classic removes from PDF.

#### 2. MapVisualizer (MapCN)

- **Purpose:** Dispatch and Route visualizer.
- **Tech:** `MapLibre` + `Shadcn` wrapper (`mapcn`).
- **Features:**
  - "Lasso" Selection for bulk actions.
  - "Day/Night" Theme Awareness.
  - "Pin Clusters" for high-density job sites.

#### 3. SmartGrid (The Database)

- **Purpose:** A Smartsheet-style interface for managing Project Data. Row-centric, not Cell-centric.
- **Tech:** `TanStack Table` (Headless) + `TanStack Virtual` + `Hyperformula`.
- **Layout:**
  - **Top Toolbar:**
    - **View Switcher:** Tabs for Grid | Gantt | Calendar | Card.
    - **Formatting:** Font, Bold/Italic, Color, Align.
    - **Actions:** Filter, Sort, Conditional Formatting, Automation (Workflows).
  - **Main Canvas:**
    - **Row Handles:** Left gutter for Drag-and-Drop reordering.
    - **Column Headers:** Right-click context menu (Edit Column Properties, Hide, Add Column Left/Right).
- **Features:**
  - **Row Identity:** Every row is an entity. It has an ID, created_at, and created_by.
  - **Hierarchy:** Indentation support (Parent/Child rows) for WBS (Work Breakdown Structure).
  - **Rich Columns:**
    - **Status:** Badge Select (Configurable colors).
    - **People:** Avatar assignments.
    - **Progress:** Visual bar.
    - **Symbols:** RAG Indicators.
  - **Side Panel:** Clicking a row opens the "Inspector" side panel for threaded chat, file attachments, and audit log specific to that row.
  - **Smart Import:** "Upload Excel" triggers a mapping wizard to upsert data based on a Key Column.
  - **Versioning:** "File > Version History" opens a timeline slider to restore previous snapshots.

#### 4. RichTextEditor (Plate.js)

- **Purpose:** Admin Help Center authoring.
- **Tech:** `@udecode/plate-headless` + Custom Toolbar.
- **Features:**
  - **Slash Command:** Notion-like `/` menu.
  - **Serialization:** Saves as JSON (Database) -> Renders as Markdown (Mobile).
  - **Image Handler:** Middleware to catch pasted images -> Upload to MinIO -> Insert URL.

### Implementation Roadmap

1.  **Phase 1 (Core):** `SmartGrid` (Data Foundation) & `MapVisualizer` (Dispatch).
2.  **Phase 2 (Hybrid):** Refactor existing Form Builder to support "PDF Mode" (split view).
3.  **Phase 3 (Polish):** Advanced animations and "Typewriter" PDF export logic.

## UX Consistency Patterns

### Button Hierarchy (Ameritech Theme)

- **Primary:** `Solid Blue (#0055B8)` - "Save", "Submit", "Create".
- **Destructive:** `Solid Red (#B31B1B)` - "Delete", "Stop Route".
  - _Dark Mode Exception:_ Use `Ameritech-Red-Light` (#ff6b6b) for text/borders to meet WCAG AAA.
- **Secondary:** `Outline Gray` - "Cancel", "Back".
- **Ghost:** `Transparent Blue` - Inline table actions (Edit, History).

### Feedback Patterns (Async Trust)

- **Global Sync Indicator:** A top-bar "Traffic Light" (Green/Yellow/Red) shows overall sync status.
  - _Green:_ Connected.
  - _Yellow:_ Syncing (Background).
  - _Red:_ Offline / Sync Failed.
- **Item State:** "Striped Background" only appears on specific Records if they _fail_ to sync after retries.
- **Optimistic UI:** Map Pins snap instantly. If backend fails, they revert with a "Retry?" toast.

### Form Patterns & Validation

- **Terminology:** Always refer to "Record" (The data), displayed as "Row/Pin/Form" (The View).
- **Client-Side Speed:** Use Zod Schemas in browser for instant feedback on Grid/Forms.
- **Soft Validation (The "Force Limit"):**
  - _Errors:_ Block submission (e.g., "Missing Required Field").
  - _Warnings:_ Allow "Force Submit" with a flag (e.g., "Unknown SKU"). Critical for offline unblocking.
  - **Override Log:** Force Submit triggers a "Reason Picker" dialog (e.g., "New Part", "Barcode Damaged").

### Navigation Patterns

- **Desktop (Admin):**
  - **Global Layer:** Top Bar (Logo, User Profile, Global AI).
  - **Project Layer:** **Horizontal Tabs** pinned to the top.
    - Order: **Dashboard | Sheets | Files | Forms | Maps | Chat | Help | Users | Settings**
  - **Context Layer:** Breadcrumbs above the tabs (`Projects > Site A`).
- **Mobile (Field):**
  - **Bottom Bar:** 4 Primary Tabs + "More" Menu.
    - **Tabs:** `Dashboard | Forms | Maps | Chat | Help`
    - **"More" Sheet:** Opens a drawer with `Sheets`, `Files`, `Users`, `Settings`.
  - **Headers:** 'X' for Cancel (Modals), '<' (Back) for Navigation Stacks.

### Intelligence & Security Patterns

- **Contextual AI:** 'Sparkle' Icon (✨) in Right-Click Menus and Input Fields (not a chatbot).
- **Granular Visibility Permissions:**
  - **Object-Level Visibility:** Every Folder, Form, Sheet, and Chat Channel has a "Visibility" setting.
  - **UI Pattern:** "Eye Icon" button in the header/row of the item.
  - **UI Patterns:**
    - **Badge:** "Eye Icon" (Green/Red) on all items.
    - **Move Action:** If moving Private Item -> Public Folder, show Warning Modal: "item will become visible to...".
    - **Export:** "Export Project" action automatically strips files the user doesn't have permission to see.
    - **Templates:** "Save as Template" preserves the Role-based visibility rules (e.g., "Foreman" role always sees "Safety" folder).

- **Visa Restricted Mode (Form-Based):**
  - **Definition:** The "Visa Gate" is simply a standard **Form** created in the Form Builder with the tag `system:visa_gate`.
  - **Workflow:** When a compliance check fails, the system renders this Form in a strictly focused modal.
  - **Flexibility:** Admins can Drag-and-Drop "File Upload", "Signature", or "Text" fields to customize their project's gate without custom code.

## Responsive Design & Accessibility

### Responsive Strategy

- **Desktop (Admin / Office):** Optimize for **Data Density**. Use "Split Panes", "Sidebars", and "Multi-Column Grids".
- **Mobile (Field Tech):** Optimize for **Focus**. Single-column layouts, large touch targets (44px+), and bottom-sheet drawers instead of modals.
- **Tablet (Field Manager):** "Hybrid View". Layouts behave like Desktop (Sidebar visible) but interactions behave like Mobile (Touch targets).

### Breakpoint Strategy (Tailwind Standard)

- `sm` (640px): Mobile Landscape.
- `md` (768px): Tablet Portrait (iPad Mini). **Usage:** Sidebar collapses to Icon Rail.
- `lg` (1024px): Tablet Landscape (iPad Pro) / Small Notebook. **Usage:** Full Sidebar visible.
- `xl` (1280px): Desktop.

### Accessibility Strategy (WCAG AA+)

- **Contrast:** Ameritech Blue (#0055B8) passes AA on white. Dark mode text will use `Gray-100` (#F3F4F6) for max legibility.
- **Keyboard Nav:** "Skip to Content" links on all pages. Admin Dashboard must be 100% usable via Keyboard (CMD+K for actions).
- **Screen Readers:** All Icons must have `aria-label`. Map Pins must have `aria-label="Job at 123 Main St, Status: Open"`.

### Testing Strategy

- **Automated:** `axe-core` checks in CI/CD pipeline.
- **Manual:** "Sunlight Test" (High Contrast Mode outdoors) + "Glove Test" (Touch targets).
- **Mobile A11y Audit:**
  - **Touch Targets:** All interactive elements must be at least **44x44px** (Apple HIG).
  - **Thumb Zone:** Primary actions (Save, Submit) must be in the bottom 30% of the screen.
  - **Input Zoom:** Inputs must have `font-size: 16px` to prevent iOS from auto-zooming.
  - **Haptics:** Success/Error states should trigger haptic feedback on supported devices.

## Project Navigation Architecture

### The "Project Shell" Layout

The application moves from a "Global Dashboard" (Project Selector) to a "Project Shell" once a project is selected.

**Global View (`/dashboard`)**:

- **Layout:** Grid of Project Cards.
- **Header:** "Worktree" Logo (Left), User Profile (Right).
- **Actions:** "New Project", "Filter list".

**Marketing Landing Page (`/`)**:

- **Audience:** Unauthenticated Visitors.
- **Sections:**
  - **Hero:** Value prop + "Login" / "Get Started" buttons.
  - **Features:** Grid overlap of Core Features (Field, Office, AI).
  - **Footer:** Links to Help Center, Policies.
- **Behavior:**
  - If `session` exists -> Rewrite to `/dashboard`.
  - If no `session` -> Render Marketing Page.

**Project View (`/project/[id]`)**:

- **Header:**
  - Top Row: Breadcrumb (`Projects / [Project Name]`) + Global Actions (Share, Notifications).
  - Bottom Row: **Horizontal Navigation Tabs**.

### Tab Definitions & Layouts

1.  **Dashboard**:
    - **Layout:** High-density Grid.
    - **Content:** Project Analytics (Completion %), Activity Feed, LCD (Lowest Common Denominator) status.

2.  **Sheets**:
    - **Layout:** **Sidebar Navigation** (Folders) + **Main Canvas**.
    - **Behavior:** Clicking a Sheet in the sidebar opens it in the Canvas.

3.  **Files**:
    - **Layout:** **Sidebar Navigation** (Folders) + **File Browser** (Grid/List).
    - **Features:** Organize folders, Drag-and-drop upload.

4.  **Forms**:
    - **Layout:** **Sidebar Navigation** (Folders) + **Landing Page**.
    - **Behavior:** Clicking a Form opens its "Landing Page" (Overview, Edit, Submissions).

5.  **Maps**:
    - **Layout:** **Sidebar Navigation** + **Map Canvas**.
    - **Menu Options:**
      - "Groups" (Territories).
      - "Routes" (Active/Draft).
      - "All Locations" (View All Pins).

6.  **Chat**:
    - **Layout:** Split View (Sidebar List | Chat Window).
    - **Sidebar Sections:**
      - **AI Assistant:** Dedicated 1:1 context-aware chat.
      - **Channels (Groups):** Custom user-created groups.
        - _Actions:_ "Create Group" -> Set Name & Visibility (Public/Private).
      - **Direct Messages:** 1:1 chat with Project Members.
    - **Features:**
      - **Real-Time:** Socket.io powered.
      - **Integrations:** File Uploads, File Referencing (`@filename`), AI Participation in Groups (`@Agent`).

7.  **Users**:
    - **Layout:** Data Grid (List View).
    - **Actions:** "Invite Guest", "Add Site Member".
    - **Controls:** Permission Management (Set as Project Manager, Site Admin, etc.).

8.  **Settings**:
    - **Layout:** Vertical Tabs (General, Integrations, Roles, Templates).
    - **Content:** Rename Project, Configure Integrations, Manage Roles, Save as Template.
    - **Integrations Panel:**
      - **API Keys:** List of Active Keys (Masked). Button: "Generate New Key".
      - **Webhooks:** List of endpoints + "Test" button.

### User Management & Role UX

**Role Management (Settings Tab):**

- **UI Pattern:** "Permission Matrix" Grid.
- **Rows:** Capabilities (e.g., "Edit Sheets", "Invite Users", "View Private Maps").
- **Columns:** Roles (Director, Manager, Foreman, Tech, Guest).
- **Interaction:** Checkboxes to toggle permissions.
- **Role Library:** "Save Role as Preset" / "Load Role from Library" to reuse custom roles (e.g., "Safety Officer") across projects.
- **Role Badges:** Colored badges (Director=Gold, Tech=Blue) used in Chat and Comments for instant hierarchy recognition.

**Critical Workflows:**

- **Role Deletion:** If a user deletes a role (e.g., "Foreman"), a **Migration Modal** appears: "You have 5 users with this role. Please reassign them to [Select New Role] before deleting."
- **Self-Lockout Prevention:** If a Director tries to remove their own Director status (and they are the only one), the system disables the action with a tooltip: "You must assign another Director first."

### Visa Gate (Form-Driven)

**Concept:** "Compliance as a Form"
Instead of hardcoding a verified "Upload Insurance" page, we utilize the **Form Builder**.

1.  **Configuration:**
    - Project Admin goes to `Settings > Visa Gate`.
    - They click "Edit Visa Form".
    - The Form Builder opens. They drag in:
      - "File Upload (Label: Insurance Cert)"
      - "Signature (Label: Safety Waiver)"
    - They save the form.

2.  **Enforcement:**
    - When User X (Subcontractor) invites User Y.
    - User Y clicks the invite link.
    - Middleware checks `compliance_status`.
    - If `false`, User Y is redirected to `/project/[id]/visa`.
    - The **Visa Form** renders.
    - User Y fills it out and hits "Submit".
    - Backend validates submission -> Sets `compliance_status = true` -> Redirects to Dashboard.

3.  **Benefits:**
    - Highly adaptable (Admin can add "Emergency Contact" field in seconds).
    - Uses existing "Submission" infrastructure (PDF export, Data Grid view).

### Public Interfaces (Client View)

**Concept:** "Read-Only Dashboard"

- **URL:** `/s/[project-slug]/[public-token]`
- **Authentication:** None (or Password if configured).
- **Layout:** Simplified layout (No Sidebar, No Settings).
- **Components:**
  - **Top Bar:** Project Logo + "Client View" Badge.
  - **Content:**
    - **Timeline:** Milestone progress.
    - **Photos:** Latest approved field photos (Grid).
    - **Files:** Whitelisted "Public" files (PDFs).

### Global AI Assistant

- **UI Location:**
  - **Desktop:** Floating Action Button (FAB) at Bottom-Right OR "Cmd+K" Command Palette integration.
  - **Mobile:** Accessible via the Bottom Bar "Assistant" tab or Long-Press on specific elements.
- **Context Awareness:**
  - The Assistant "reads" the current URL and Page Content.
  - Example: If on `/routes`, asking "Optimize this" triggers the Route Optimization tool.
