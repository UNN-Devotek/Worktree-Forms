---
stepsCompleted: [step-01-validate-prerequisites]
inputDocuments:
  - c:\Users\White\Documents\Worktree\Worktree\_bmad-output\planning-artifacts\prd.md
  - c:\Users\White\Documents\Worktree\Worktree\_bmad-output\planning-artifacts\architecture.md
  - c:\Users\White\Documents\Worktree\Worktree\_bmad-output\planning-artifacts\ux-design-specification.md
---

# Worktree - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Worktree, decomposed from the PRD, UX Design, and Architecture requirements.

## Requirements Inventory

(See previous version for full text of Requirements Inventory - omitted here for brevity as they are unchanged)
... [Requirements Inventory Hidden for Brevity - fully preserved in previous Tool Call] ...

## Epic List

### Epic 1: Core Project Foundation & Identity

**Goal:** Establish the multi-tenant "Project" container, user authentication, and role-based access control system that underpins the entire application.
**Value:** Sarah can create a secure workspace and invite her team.
**Key Database Entities:** `User`, `Project`, `ProjectRoleDefinitions`, `ProjectMember`.
**FRs covered:** FR3.1, FR3.3, FR5.1, FR5.2, FR5.3, FR5.4, FR5.9, FR10.1, FR10.2, FR10.3, NFR4, NFR8.

### Epic 2: Visual Form Builder & Schema Engine

**Goal:** Enable Admins to create complex, versioned data entry forms with validation, logic, and intelligent file naming.
**Value:** Sarah can digitize her paper forms in minutes without coding.
**Key Database Entities:** `Form`, `FormVersion`, `FormField` (JSONB), `VisibilityConfig`.
**FRs covered:** FR1.1, FR1.2, FR1.3, FR1.4, FR1.5, FR1.5.1, FR1.6, FR9.1, FR9.2 (Forms), NFR10.

### Epic 3: Field Operations Mobile App (Offline First)

**Goal:** Provide Technicians with a robust, offline-capable PWA for viewing routes, navigating to jobs, and managing their work queue.
**Value:** Mike can see his work and navigate to the site, even without cell service.
**Key Database Entities:** `Route`, `RouteStop`, `Project` (Geofence Config).
**FRs covered:** FR2.1, FR2.2, FR2.3, FR2.4, FR8.3, NFR2, NFR3.

### Epic 4: Submission Lifecycle & Sync Engine

**Goal:** Handle the end-to-end flow of data capture, local persistence, background synchronization, and image optimization from the field to the cloud.
**Value:** Mike can capture photos and sign forms in the rain, knowing the data will "just sync" when he's back online.
**Key Database Entities:** `Submission`, `replicache_client_view` (Sync Ledger), `QuarantinedSubmission`.
**FRs covered:** FR2.4, FR2.4.1, FR2.5, FR2.6, NFR1, NFR5.

### Epic 5: Smart Grid & Mission Control

**Goal:** Give Admins a high-density, customizable view of all project data to monitor progress and review submissions efficiently, while managing project-level settings and quotas.
**Value:** Sarah can spot a "Failed" inspection instantly across 500 submissions using the Dashboard, and ensure her project stays within storage limits.
**Key Database Entities:** `GridConfig` (User Prefs), `ProjectMetrics` (Aggregated), `ProjectSettings`.
**FRs covered:** FR3.2, FR4.1, FR4.2, FR4.3, FR4.5, FR17.1, FR17.2, FR18.1, FR18.2, NFR6.

### Epic 6: Live Smart Grid & Collaboration

**Goal:** Implement a custom, high-performance "Smart Grid" module that combines the usability of a spreadsheet with the structure of a database (Row-Centric).
**Value:** The office team can manage complex project schedules and trackers with hierarchy, rich data types, and real-time concurrency.
**Key Database Entities:** `Sheet`, `SheetColumn` (Definitions), `SheetRow` (Data + Metadata), `YjsDocument` (Binary State).
**FRs covered:** FR12.1, FR12.2, FR12.3, FR12.4, FR13.1, FR7.1, FR7.2, FR7.3, FR7.4, FR7.5.
**Value:** The entire office team can edit the "Master Schedule" together without locking each other out.
**Key Database Entities:** `Sheet`, `SheetRow`, `SheetCell`, `YjsUpdate` (Blob).
**FRs covered:** FR12.1, FR12.2, FR12.3, FR12.4, FR13.1, FR13.3, FR7.1, FR7.2, FR7.3, NFR9, NFR12.

### Epic 7: Document Control & Field Tools

**Goal:** Implement the PDF Engine for hosting specs/plans, rendering blueprints on mobile, and the suite of Field Tools (RFIs, Schedule, Specs) for execution.
**Value:** James can markup a blueprint change and immediately link it to an RFI, while Mike can check the Schedule dependencies offline.
**Key Database Entities:** `Document`, `DocumentVersion`, `RFI`, `SpecSection`, `EntityLink`, `ScheduleTask`, `ScheduleDependency`.
**FRs covered:** FR20.1, FR20.2, FR20.3, FR20.4, FR21.1, FR21.2, FR21.3, FR21.4, FR22.1, FR22.2, FR22.3, FR22.4, NFR7.

### Epic 8: Legacy Integration & Data Migration

**Goal:** Build the bridges for the "old world" including PDF Overlay Mapping (Government Forms) and Bulk Excel/CSV Imports.
**Value:** Sarah can keep using her mandatory State Compliance PDF forms but fill them digitally.
**Key Database Entities:** `FormPDFOverlay` (Mapping Config).
**FRs covered:** FR1.7, FR1.7.1, FR4.4, FR4.9, FR22.1, FR17.3.

### Epic 9: Compliance, Access & Public Gates

**Goal:** Implement the "Visa Wizard" for external users and secure Public Links for client visibility.
**Value:** Subcontractors are automatically vetted (Insurance Check) before they can see sensitive project data.
**Key Database Entities:** `ComplianceRequirement`, `ComplianceRecord`, `ExternalAccessRequest`.
**FRs covered:** FR5.5, FR5.6, FR5.7, FR5.8, FR6.1, FR6.2, FR15.1, FR15.2, FR15.3.

### Epic 10: AI Automation & Intelligence Layer

**Goal:** Deploy the Agentic Assistant, RAG Engine, and "Magic Forward" email ingestion to automate repetitive tasks.
**Value:** Sarah can just forward an email to create a project, and ask the AI to "reschedule Mike" without clicking 10 buttons.
**Key Database Entities:** `AiConversation`, `VectorEmbeddings` (pgvector).
**FRs covered:** FR8.1, FR8.2, FR11.1, FR11.2, FR11.3, FR11.4, FR16.1, FR18.1, NFR11.

### Epic 11: Help Center & Support System

**Goal:** Provide a self-service knowledge base for users and a feedback loop for bugs.
**Value:** Users can solve their own problems offline; Admins can easily maintain documentation.
**Key Database Entities:** `HelpArticle`, `HelpCategory`, `SupportTicket`.
**FRs covered:** FR19.1, FR19.2, FR19.3, FR19.4.

## FR Coverage Map

FR1.1: Epic 2 - Drag-and-drop form creation
FR1.2: Epic 2 - Validation logic
FR1.3: Epic 2 - Conditional visibility
FR1.4: Epic 2 - Smart Table config
FR1.5: Epic 2 - Auto-naming files
FR1.6: Epic 2 - Retroactive renaming
FR1.7: Epic 8 - PDF Overlay mapping
FR2.1: Epic 3 - Route list view
FR2.2: Epic 3 - Deep linking maps
FR2.3: Epic 3 - Offline capability
FR2.4: Epic 4 - Append-only ledger
FR2.5: Epic 4 - Image optimization
FR2.6: Epic 4 - Touchscreen capture
FR3.1: Epic 1 - Project container
FR3.2: Epic 5 - Project Dashboard
FR3.3: Epic 1 - URL Slugs
FR4.1: Epic 5 - Data Grid
FR4.2: Epic 5 - Custom Columns
FR4.3: Epic 5 - Lightbox view
FR4.4: Epic 8 - Export Suite (PDF)
FR4.5: Epic 5 - Bulk Media Zip
FR5.1: Epic 1 - Invites
FR5.2: Epic 1 - Invite Control
FR5.3: Epic 1 - RBAC API
FR5.4: Epic 1 - Data Isolation
FR5.5: Epic 9 - Hybrid Roles
FR5.6: Epic 9 - Claim Logic
FR5.7: Epic 9 - Visibility Scope
FR5.8: Epic 9 - Visa Gate
FR5.9: Epic 1 - Audit Log
FR6.1: Epic 9 - Public Links
FR6.2: Epic 9 - Password Protection
FR7.1: Epic 6 - Assignment
FR7.2: Epic 6 - Action Inbox
FR7.3: Epic 6 - Notifications
FR8.1: Epic 10 - Magic Forward
FR8.2: Epic 10 - RAG Engine
FR8.3: Epic 3 - Contextual Compass
FR9.1: Epic 2 - Form History
FR10.1: Epic 1 - Profile Display Name
FR11.1: Epic 10 - Persistent Chat
FR11.2: Epic 10 - Autonomous Action
FR12.1: Epic 6 - Live Collab
FR15.1: Epic 9 - Compliance Gates
FR16.1: Epic 10 - Webhooks
FR17.1: Epic 5 - Data Retention
FR17.2: Epic 5 - Storage Quotas
FR18.1: Epic 5 - Resource Limits
FR18.2: Epic 5 - Budget Alerts
FR19.1: Epic 11 - Admin Studio
FR19.2: Epic 11 - Article Workflow
FR19.3: Epic 11 - Offline Reader
FR19.4: Epic 11 - Feedback Shake
FR20.1: Epic 7 - RFI Creation
FR21.1: Epic 7 - Spec Ingestion
FR22.1: Epic 7 - Schedule Import
FR22.2: Epic 7 - Strategy Room
FR22.3: Epic 7 - Mobile Task List
FR22.4: Epic 7 - Blocker Logic

## Global Acceptance Criteria (Definition of Done)

Applies to **ALL** Epics and User Stories generated from this document:

1.  **Accessibility (NFR12)**: All UI components must use semantic HTML and include ARIA labels where necessary. The "Live Table" components must use standard HTML `<table>` elements with proper ARIA roles for screen reader compatibility.
2.  **Localization (NFR13)**: All user-facing text must be wrapped in translation keys (e.g., `t('key')`). Hardcoded strings are strictly prohibited.
3.  **Mobile Responsiveness**: All views must be verified on mobile breakpoints. Complex tables must degrade to "Card Views" on small screens.
4.  **Error Handling**: All Server Actions must return standardized error objects. UI must display toast notifications for errors.
5.  **Offline Safety**: All mutations must check for connection status. If offline, mutations must be queued in the Sync Engine (RepliCache).

6.  **Offline Safety**: All mutations must check for connection status. If offline, mutations must be queued in the Sync Engine (RepliCache).
7.  **Visual Feedback**: All Action Buttons must show a visible Loading Spinner/State during `isPending` to prevent "Rage Clicks" (UX #1).

## Epic 1: Core Project Foundation & Identity

**Goal:** Establish the multi-tenant "Project" container, user authentication, and role-based access control system that underpins the entire application.

### Story 1.0: Global Dashboard & Project List

As a Site Owner,
I want to view a list of all projects on the server,
So that I can navigate to the correct workspace.

**Acceptance Criteria:**
**Given** I log in to the root URL `/`
**Then** I see the **Global Dashboard**
**And** it displays a card grid of all Projects I have access to
**And** I can search projects by name or client (UI Map 2.1).

### Story 1.1: Create Project & Generate Slug

As a Project Creator,
I want to create a new Project with a name and generated URL slug,
So that I can establish a secure workspace for my team.

**Acceptance Criteria:**
**Given** I am on the global dashboard
**When** I click "Create Project" and enter "Headquarters Reno"
**Then** a new Project entity is created with slug `headquarters-reno`
**And** I am redirected to `/project/headquarters-reno`
**And** I am redirected to `/project/headquarters-reno`
**And** a dedicated MinIO bucket path `/project-uuid/` is reserved (using UUID not Slug to allow renaming) (Arch #9)
**And** I am assigned the "Owner" role for this project
**And** long project names are truncated with an ellipsis and show full text on hover (QA #4).

### Story 1.2: User Management & Invites

As a Project Owner,
I want to view a list of all members and invite new ones via email,
So that I can manage my team's access.

**Acceptance Criteria:**
**Given** I am in Project Settings > Users
**When** I enter `mike@example.com` and select "Technician"
**Then** an invitation email is sent with a magic link
**And** the link requires a "Click to Confirm" step to prevent Outlook Safelinks from consuming the token (Lead Dev #9)
**And** the user appears in the `<UserListTable />` with "Invited" status (FR5.1, 5.2)
**And** I can revoke or **Resend** expired invites (PM #2)
**And** I can revoke invites or remove users (UI Map 17.0).

### Story 1.3: Enforce RLS & RBAC

As a Developer,
I want to ensure data isolation at the database level,
So that users cannot access data from other projects or exceed their privileges.

**Acceptance Criteria:**
**Given** a user is logged in
**When** they attempt to query `SELECT * FROM forms` via the API
**Given** a user is logged in
**When** they attempt to query `SELECT * FROM forms` via the API
**Then** the query only returns rows where `project_id` matches their current project context
**And** `current_setting` is set safely within a transaction to handle connection pooling (Arch #3)
**And** if they try to `DELETE` a project without `OWNER` role, the DB throws a Policy Violation error (FR5.3, FR5.4).

### Story 1.4: User Profile & Theme Preferences

As a User,
I want to upload an avatar and set my theme (Dark/Light),
So that I can personalize my experience.

**Acceptance Criteria:**
**Given** I am on the Profile page
**When** I upload a photo
**Then** it is resized to 256x256 and saved to MinIO
**And** if the image fails to load, it gracefully falls back to User Initials (QA #3)
**And** when I toggle "Dark Mode", the preference persists to the DB and applies on my next login (FR10.3).

### Story 1.5: System Audit Log

As an Admin,
I want to see a log of major events,
So that I can audit security and usage.

**Acceptance Criteria:**
**Given** I am a Project Owner
**When** I view the Audit Log page
**Then** I see a chronological list of actions (Invites, Role Changes, Deletions)
**And** each entry shows User, IP, Timestamp, and Action details (FR5.9).

### Story 1.6: Global Shell & Providers

As a Developer,
I want to implement the root layout with all necessary context providers,
So that the app handles themes, sessions, and offline state correctly.

**Acceptance Criteria:**
**Given** I load the application
**Then** the `RootLayout` wraps children with `SessionProvider`, `ThemeProvider`, `QueryClientProvider`, `Toaster`, and `OfflineSyncProvider`
**And** `OfflineSyncProvider` initializes _after_ `QueryClient` to prevent premature retries (Lead Dev #2)
**And** the `OfflineIndicator` banner appears when network is disconnected (UI Map 1.1)
**And** `ThemeProvider` suppresses hydration mismatch to prevent FOUC (Lead Dev #5)
**And** navigation between main views uses subtle Fade/Slide transitions (UX #5).

### Story 1.7: Authentication UI Flows

As a User,
I want to see branded Login and Signup pages,
So that I can access the system.

**Acceptance Criteria:**
**Given** I visit `/login` or `/signup`
**Then** I see the branded `AuthShell` layout
**And** the forms render correctly with validation (Zod)
**And** successful login redirects to `/dashboard` (UI Map 2.1, 2.2)
**And** backend supports IdP-Initiated SSO hooks for future Enterprise expansion (Arch #6)
**And** password fields include a "Show/Hide" toggle eye icon (UX #4).

### Story 1.8: Project Workspace Layout

As a User,
I want a consistent sidebar and header navigation within a project,
So that I can switch between tools easily.

**Acceptance Criteria:**
**Given** I am inside a project (`/project/[id]`)
**Then** the `ProjectLayout` renders the Sidebar and Header
**And** the Header contains Breadcrumbs that dynamically resolve Deep Links (e.g. `Projects > Forms > Safety Check`) (PM #2)
**And** the UserNav dropdown renders correctly
**And** the Sidebar highlights the active tab (UI Map 4.0)
**And** Sidebar collapsed state is persisted in LocalStorage to prevent Layout Shift (Arch #1).

### Story 1.9: Global UI Components

As a Power User,
I want to use the Command Palette and Global Modals,
So that I can navigate and perform actions quickly.

**Acceptance Criteria:**
**Given** I press `Cmd+K`
**Then** the `GlobalCommandPalette` opens
**And** I can navigate to different pages
**And** the `ModalProvider` uses dynamic imports (`next/dynamic`) to avoid bloating the initial bundle (Arch #2)
**And** the `ModalProvider` is implemented to handle global dialogs (UI Map 1.1, 10.0)
**And** handles "Stacked Modals" (Z-index management) correctly (Arch #5)
**And** Icon imports are tree-shakable (e.g. `lucide-react/dist/esm/icons/...`) (Arch #4).

## Epic 2: Visual Form Builder & Schema Engine

**Goal:** Enable Admins to create complex, versioned data entry forms with validation, logic, and intelligent file naming.

### Story 2.1: Drag-and-Drop Form Builder

As an Admin,
I want to drag fields onto a canvas to design a form,
So that I don't need to write code.

**Acceptance Criteria:**
**Given** I am in the Form Builder
**When** I drag a "Text Field" from the toolbox to the canvas
**Then** it appears in the form preview
**And** I can click it to edit its label, placeholder, and description (FR1.1)
**And** field descriptions appear as "Tooltips" or helper text on hover (PM #3)
**And** field labels are sanitized to prevent XSS injection (QA #3).

### Story 2.2: Field Validation & Logic

As an Admin,
I want to set required fields and visibility rules,
So that I collect high-quality data.

**Acceptance Criteria:**
**Given** I have a "Reason" field
**When** I set "Conditional Visibility" to show only if "Status" == "Failed"
**Then** the field is hidden by default in the runner
**And** appears only when the condition is met (using `json-logic` standard library) (Arch #8)
**And** when hidden, the field value is explicitly cleared to prevent "Zombie Data" (Lead Dev #3)
**And** validation errors trigger a smooth scroll to the error location (UX #3)
**And** I can mark fields as "Required" which prevents submission if empty (FR1.2).

### Story 2.3: Smart Table Field

As an Admin,
I want to configure a table functionality field,
So that technicians can enter multiple rows of data (e.g., parts used).

**Acceptance Criteria:**
**Given** I am configuring a "Table" field
**When** I define columns "Item Name", "Quantity", "Notes"
**Then** the form runner displays a dynamic table
**And** I can configure "Item Name" to be Read-Only with pre-filled rows (FR1.4)
**And** I can control if pre-filled rows are deletable or fixed (UX #8).

### Story 2.4: Form Schema Versioning

As an Admin,
I want to publish a new version of a form without breaking old submissions,
So that I can iterate on the collection process safely.

**Acceptance Criteria:**
**Given** a form has existing submissions
**When** I change a field and click "Publish"
**Then** the system saves `v2` of the schema
**And** existing `v1` submissions remain accessible and render using the `v1` schema
**And** new submissions use `v2` (FR9.1).

### Story 2.5: Restore & Blame (Form History)

As an Admin,
I want to view the edit history of a form and restore previous versions,
So that I can recover from accidental changes.

**Acceptance Criteria:**
**Given** a form has been edited multiple times
**When** I view "Version History"
**Then** I see a list of edits with User ID, Timestamp, and a "Diff" summary (FR9.4)
**And** I can click "Restore" on a previous version to make it active (FR9.3).

### Story 2.6: Retroactive Renaming (Background Job)

As an Admin,
I want the system to automatically rename files if I change a field name,
So that my folder structure stays consistent.

**Acceptance Criteria:**
**Given** I rename a field from "Photo" to "Site Evidence"
**Then** the system triggers a background job (BullMQ)
**And** renames all existing files in MinIO to match the new pattern (FR1.6)
**And** updates the database references without breaking links
**And** sends me an email when the migration is complete.

## Epic 3: Field Operations Mobile App (Offline First)

**Goal:** Provide Technicians with a robust, offline-capable PWA for viewing routes, navigating to jobs, and managing their work queue.

### Story 3.1: Route List & Schedule View

As a Technician,
I want to see my assigned stops for the day,
So that I know where to go.

**Acceptance Criteria:**
**Given** I open the app
**Then** I see a list of "Stops" sorted by distance from my current location (FR2.1)
**And** each stop shows the Address, Status, and Priority
**And** if no stops exist, a "Rich Empty State" allows me to "Pull to Refresh" or "Call Dispatch" (UX #2).

### Story 3.2: Offline Mode (Local First)

As a Technician,
I want the app to work without internet,
So that I can perform inspections in basements or remote sites.

**Acceptance Criteria:**
**Given** I have no signal (Offline)
**When** I load the Route List or Open a Form
**Then** it loads instantly from local cache (NFR2)
**And** data persists even if I clear browser cache/reload (using IndexedDB Persistence) (QA #9)
**And** I can save data locally without error.

### Story 3.3: Contextual Compass (Geofences)

As a Technician,
I want the app to detect when I arrive at a job site,
So that I see the relevant tasks immediately without searching.

**Acceptance Criteria:**
**Given** I enter the geofence of a Project Site
**Then** the app triggers a specific notification/banner
**And** enables "One-Tap" access to the Site Dashboard (FR8.3).

### Story 3.4: Deep Linking Navigation

As a Technician,
I want to click one button to start navigation,
So that I can safely drive to the site.

**Acceptance Criteria:**
**Given** I am on a Route Stop card
**When** I click "Navigate"
**Then** it opens the native maps app (Google/Apple) with the destination coordinates pre-filled (FR2.2)
**And** falls back to a web URL if native app is not installed (QA #7).

### Story 3.5: Mobile Form Entry Experience

As a Technician,
I want a "Muddy Thumb" friendly form interface,
So that I can enter data without frustration in the field.

**Acceptance Criteria:**
**Given** I am filling a form on mobile
**Then** input fields have a minimum height of 48px
**And** "Smart Tables" automatically convert to a "Card List" view (UX 2.1)
**And** changes are auto-saved to `IndexedDB` (Async) on every keystroke to prevent UI freezing (Lead Dev #4) (NFR2)
**And** Form State uses proper isolation (Atoms/Signals) to prevent whole-form re-renders (Lead Dev #1)
**And** Date Pickers use native inputs on mobile and Shadcn Calendar on Desktop (Lead Dev #3)
**And** Focus logic triggers `scrollIntoView` to prevent Virtual Keyboard occlusion (QA #1).

## Epic 4: Submission Lifecycle & Sync Engine

**Goal:** Handle the end-to-end flow of data capture, local persistence, background synchronization, and image optimization from the field to the cloud.

### Story 4.1: Background Sync & Queue

As a Technician,
I want my offline data to automatically upload when I am back online,
So that I don't have to manually "Send" everything.

**Acceptance Criteria:**
**Given** I have saved 5 forms while offline
**When** I regain internet connection
**Then** the background sync engine (RepliCache) automatically uploads the data
**And** I see a visible "Syncing..." spinner followed by "All Changes Saved" (UX #2)
**And** Toast notifications are grouped/deduped (e.g. "Synced 50 items") to prevent spam (Arch #2)
**And** Uploads continue in a "Global Context" even if I navigate away from the page (Lead Dev #4)
**And** sync verification trusts the Server Timestamp to handle client clock drift (QA #5)
**And** resolves any simple conflicts (Append-Only) (FR2.4).

### Story 4.2: Image Optimization & Auto-Naming

As a Technician,
I want my photos to upload quickly and be named correctly,
So that the admin can find them easily.

**Acceptance Criteria:**
**Given** I attach a photo `IMG_999.jpg` to the "Kitchen Sink" field
**When** the form is saved
**Then** the client validates file size < 50MB and type is image/\* before upload attempt (QA #2)
**And** the image is resized to max 1920x1080 (FR2.5)
**And** renamed to `Kitchen_Sink_ProjectName_Date.jpg` before upload (FR1.5).

### Story 4.3: Signature Capture

As a Technician,
I want to sign forms on the touchscreen,
So that I can get customer validation.

**Acceptance Criteria:**
**Given** I am on a Signture Field
**When** I sign with my finger
**Then** the signature creates a vector/image path
**And** is saved as an image attachment to the submission (FR2.6)
**And** is testable via a "mouse drag simulation" helper in Playwright (Lead Dev #10).

## Epic 5: Smart Grid & Mission Control

**Goal:** Give Admins a high-density, customizable view of all project data to monitor progress and review submissions efficiently.

### Story 5.1: Project Dashboard Configuration

As an Admin,
I want to see a high-level overview of project health,
So that I can spot issues immediately.

**Acceptance Criteria:**
**Given** I land on the Project Dashboard
**Then** I see aggregated metrics (Completion % by Form Type) (PM #4)
**And** metrics are interactive filters (clicking "80% Complete" filters the grid) (PM #1)
**And** an Activity Feed of recent submissions
**And** on Print (Cmd+P), the Sidebar and Nav are hidden (QA #5).

### Story 5.2: Data Grid & Custom Columns

As an Admin,
I want to view submissions in a customizable grid,
So that I can analyze specific data points.

**Acceptance Criteria:**
**Given** I am viewing the "Daily Logs" form data
**When** I toggle "Show only Failed Items"
**Then** the grid updates instantly (using `<DataTable />` wrapper around TanStack Table) (Arch #3)
**And** I can save this view configuration for later (stored in `UserPreferences` DB table) (Lead Dev #7) (FR4.1, FR4.2)
**And** I can toggle "Compact Mode" to see more rows (PM #5)
**And** first columns are sticky and show a shadow cue when scrolling horizontally (QA #2).

### Story 5.3: Lightbox & Media Zip

As an Admin,
I want to view photos without leaving the grid and download them in bulk,
So that I can generate reports or archives.

**Acceptance Criteria:**
**Given** I see a photo thumbnail in the grid
**When** I click it
**Then** it opens a full-resolution Lightbox (FR4.3)
**And** I can select multiple rows and click "Download Photos"
**And** the system triggers a background job to generate the ZIP and emails me when ready (Architect #5) (FR4.5).

### Story 5.4: FinOps: Quotas & Alerts

As an Owner,
I want to be alerted if a project exceeds its storage or AI budget,
So that I can control costs.

**Given** a project approaches its 5GB limit
**Then** the Owner receives an email alert
**And** the UI shows a "Storage Warning" banner
**And** technicians allow a 10% "Grace Period" overflow to prevent data loss during upload (PM #3) (FR17.2, FR18.2).

### Story 5.5: Map Dispatcher Interface

As a Dispatcher,
I want to view all technicians and stops on a map,
So that I can assign work efficiently.

**Acceptance Criteria:**
**Given** I am on the Maps page
**Then** I see the `<MapVisualizer />` with pins for all active stops
**And** I can toggle a "Selection Mode" button to distinguish between Panning and Lassoing on touch screens (UX #6)
**And** I can drag a lasso around a group of pins (using `mapbox-gl-draw`) (Lead Dev #1)
**And** click "Assign" to bulk-dispatch them to a technician (UI Map 9.0)
**And** the Map WebGL context is explicitly disposed on unmount to prevent leaks (Lead Dev #2).

## Epic 6: Live Smart Grid & Collaboration

**Goal:** Implement a custom, high-performance "Live Table" module that combines the usability of a spreadsheet with the structure of a database (Row-Centric).
**Value:** The office team can manage complex project schedules and trackers with hierarchy, rich data types, and real-time concurrency.
**Key Database Entities:** `Sheet`, `SheetColumn` (Definitions), `SheetRow` (Data + Metadata), `YjsDocument` (Binary State).
**FRs covered:** FR12.1, FR12.2, FR12.3, FR12.4, FR13.1, FR7.1, FR7.2, FR7.3, FR7.4, FR7.5.

#### Story 6.1: High-Performance Data Viewing

As a User,
I want to view sheets with 10,000+ rows without lag,
So that I can manage large projects efficiently.

**Acceptance Criteria:**
**Given** a dataset of 10k rows
**When** I scroll rapidly
**Then** the UI maintains 60fps (using virtualized rendering)
**And** DOM nodes are recycled to manage memory (using @tanstack/react-virtual)
**And** accessibility is maintained via standard HTML table structure (NFR12).

#### Story 6.2: Real-Time Sync (Yjs Integration)

As a User,
I want to see my colleague's changes instantly,
So that we don't work on stale data.

**Acceptance Criteria:**
**Given** two users on the same sheet
**When** User A edits a cell
**Then** User B sees the update in < 200ms
**And** User B sees a colored border (Presence) showing where User A is working
**And** the state is managed via `Y.Map` (Rows) and `Y.Array` (Order) to ensure eventual consistency.

#### Story 6.3: Rich Column Types

As a Planner,
I want to set columns to specific types like "Status" or "Person",
So that data entry is standardized.

**Acceptance Criteria:**
**Given** I add a "Status" column
**When** I edit a cell in that column
**Then** I see a Dropdown with colored badges (e.g., "In Progress" = Blue)
**And** selecting an option updates the cell value
**And** "User" columns render Avatars and support searching Project Members.

#### Story 6.4: Row Hierarchy & Grouping

As a Project Manager,
I want to indent rows to create sub-tasks,
So that I can organize the schedule visually.

**Acceptance Criteria:**
**Given** I have a list of tasks
**When** I select a row and click "Indent" (Tab)
**Then** it becomes a child of the row above it
**And** I can collapse/expand the parent row to hide/show children
**And** `SUM(CHILDREN())` formulas respect this hierarchy.

#### Story 6.5: Formula Engine Integration

As a Power User,
I want to use formulas to calculate costs,
So that I don't need a calculator.

**Acceptance Criteria:**
**Given** I enter `=A1*B1`
**Then** the system (Hyperformula) calculates the result
**And** updates immediately if A1 or B1 changes
**And** handles circular dependency errors gracefully (Red triangle in cell).

#### Story 6.6: Row Detail Panel

As a User,
I want to attach a file to a specific row,
So that the invoice is linked to the line item.

**Acceptance Criteria:**
**Given** I click the "Open" icon on a row
**Then** a Side Panel slides out
**And** I can upload files, post a chat comment, or view the Audit History for _that specific row_.

#### Story 6.7: Project Team Chat

As a Team Member,
I want to discuss project issues in a dedicated channel,
So that communication is centralized.

**Acceptance Criteria:**
**Given** I am on the Chat page
**When** I send a message in the #general channel
**Then** it appears instantly for all other project members
**And** I can mention `@Mike` (stored as Immutable ID, rendered as Display Name) (Lead Dev #5)
**And** notifications respect "Office Hours" settings (PM #7) (UI Map 15.0).

#### Story 6.8: Notification & Subscription Preferences

As a User,
I want to configure which events trigger email or push notifications,
So that I am not overwhelmed by spam.

**Acceptance Criteria:**
**Given** I am in User Settings
**When** I toggle "Email me when mentioned" to OFF
**Then** I no longer receive emails for mentions (FR7.4)
**And** standard "Smart Links" in notifications deep-link directly to the item (FR7.5).

#### Story 6.9: Form-to-Sheet Integration

As a Manager,
I want form submissions to automatically populate a specific sheet,
So that I have a live tracker of field data.

**Acceptance Criteria:**
**Given** I am configuring a Form
**When** I select "Output to Sheet: Daily Log"
**Then** the system automatically creates columns for each Form Field
**And** when a new submission arrives, a new Row is appended to the Sheet
**And** Photos/Attachments are rendered as "Thumbnail" cells.

#### Story 6.10: Sheet-to-Route Integration

As a Dispatcher,
I want to build a route by selecting rows from a master sheet,
So that I don't have to re-enter addresses.

**Acceptance Criteria:**
**Given** I am in the Route Builder
**When** I select "Source: Master Job List"
**Then** I can select specific rows to add to the route
**And** changes to the Stop Order in the Route Builder update the `Rank` in the Sheet
**And** modifying the address in the Sheet updates the Route Stop coordinates.

#### Story 6.11: View Persistence & Privacy

As a User,
I want to save my filters and share them via URL,
So that I can show my team exactly what I'm looking at.

**Acceptance Criteria:**
**Given** I filter by "Status=Open"
**Then** the URL updates to `?filter=Status:Open` (FR12.6)
**And** I can save this as a "Private View" that only I can see
**And** I can share the URL with a colleague to replicate the view.

#### Story 6.12: Governance & Permissions

As an Admin,
I want to lock the "Budget" column,
So that Editors cannot change approved costs.

**Acceptance Criteria:**
**Given** I am an Admin
**When** I edit Column Properties
**Then** I can toggle "Lock Column"
**And** Editors see the column as Read-Only
**And** the API rejects edits to that column from non-Admins (FR12.7).

#### Story 6.13: Offline Resilience

As a Technician,
I want to edit the sheet while offline,
So that I can work in the basement.

**Acceptance Criteria:**
**Given** I am offline
**When** I edit a cell
**Then** the change is saved to `IndexedDB`
**And** when I reconnect, the change syncs to the server
**And** if a conflict occurs (Row Deleted), the system notifies me or quarantines the edit.

## Epic 7: Document Control & Field Tools

**Goal:** Implement the PDF Engine for hosting specs/plans, rendering blueprints on mobile, and the suite of Field Tools (RFIs, Schedule, Specs) for execution.

### Story 7.1: RFI Management

As a Technician,
I want to create an RFI with a photo from the field,
So that I can get clarification on an issue.

**Acceptance Criteria:**
**Given** I am in the RFI module
**When** I click "New RFI" and attach a photo
**Then** the RFI is created in "Draft" state (Private to me)
**And** I can explicitly "Publish" it to assign to the Project Manager (PM #8) (FR20.1).

### Story 7.2: Spec Library & Search

As a Technician,
I want to search the project specifications for "Concrete",
So that I know the correct mix to use.

**Acceptance Criteria:**
**Given** the Admin has uploaded the Spec Book
**When** I search for "Concrete"
**Then** the system returns the specific section (e.g., "03 30 00") (FR21.2)
**And** I can read it offline.

### Story 7.3: PDF Blueprint Viewer

As a Lead,
I want to view large blueprint PDFs on my tablet with smooth zooming,
So that I can see the details.

**Acceptance Criteria:**
**Given** I open a 50MB Blueprint PDF
**Then** it renders in < 3 seconds (NFR7)
**And** displays a Skeleton Screen loader during fetching (UX #4)
**And** I can zoom and pan without lag.

### Story 7.4: Schedule Visualization

As a Manager,
I want to view the project schedule as a filtered task list on mobile,
So that I can see upcoming milestones.

**Acceptance Criteria:**
**Given** I am on the Schedule tab on mobile
**Then** I see a vertical list of tasks sorted by Start Date
**And** "Gantt View" is disabled or simplified for small screens (FR22.3).

## Epic 8: Legacy Integration & Data Migration

**Goal:** Build the bridges for the "old world" including PDF Overlay Mapping and Bulk Imports.

### Story 8.1: PDF Overlay Mapping

As an Admin,
I want to drag input fields onto an uploaded Government PDF,
So that the final output looks exactly like the official form.

**Acceptance Criteria:**
**Given** I have uploaded a PDF background
**When** I drag a "Text Field" and place it over the "Name" box on the PDF
**Then** the system saves the X/Y coordinates
**And** normalizes them to a standard PDF viewport (e.g., 72 DPI) to prevent scaling issues (Lead Dev #8)
**And** uses them for generation (FR1.7).

### Story 8.2: Flattened PDF Export

As a User,
I want to export my submission as a flat PDF,
So that I can email it to the city inspector.

**Acceptance Criteria:**
**Given** a completed submission with overlay mapping
**When** I click "Export PDF"
**Then** the system generates a PDF with the text "burned in" to the original background
**And** it is not editable (FR1.7.1).

### Story 8.3: Bulk Import Wizard

As an Admin,
I want to paste 500 rows from Excel into a Smart Sheet,
So that I can bulk create records.

**Acceptance Criteria:**
**Given** I have data in the clipboard
**When** I paste into the grid
**Then** the system parses the columns
**And** enables a "Column Mapping Wizard" to align Excel headers with DB fields (PM #5)
**And** creates 500 new rows securely (FR4.9).

## Epic 9: Compliance, Access & Public Gates

**Goal:** Implement the "Visa Wizard" for external users and secure Public Links.

### Story 9.1: Visa Wizard (Onboarding Gate)

As an Admin,
I want to require subcontractors to upload insurance before accessing the dashboard,
So that we stay compliant.

**Acceptance Criteria:**
**Given** an invited user logs in for the first time
**When** they check "Pending Compliance" status
**Then** they are redirected to the "Visa Wizard"
**And** must enable MFA if they have "Admin" privileges (Arch #7)
**And** cannot see any project data until they complete the required uploads (FR15.2).

### Story 9.2: Public Link Sharing

As a Manager,
I want to share a read-only timeline with my client via a link,
So that they don't need to create an account.

**Acceptance Criteria:**
**Given** I am in Project Settings
**When** I generate a Public Link with "Password Protection"
**Then** the system provides a URL `worktree.pro/s/xyz`
**And** visitors must enter the password to view the Board (FR6.1, 6.2)
**And** all access incidents (IP, User Agent) are logged to a SOC2-compliant audit table (QA #6).

### Story 9.3: Marketing Landing Page

As a Visitor,
I want to see a product showcase at the root URL if I am not logged in,
So that I understand what Worktree is.

**Acceptance Criteria:**
**Given** I am unauthenticated
**When** I visit the root URL `/`
**Then** I see the Marketing Landing Page (Hero, Features, Pricing) (FR6.3)
**And** I can click "Login" to access the App Dashboard (`/dashboard`)
**And** authenticated users are auto-redirected to `/dashboard` (skipping the landing page).

## Epic 10: AI Automation & Intelligence Layer

**Goal:** Deploy the Agentic Assistant, RAG Engine, and "Magic Forward" email ingestion.

### Story 10.1: Native RAG Ingestion

As a System,
I want to automatically index new submissions into a vector database,
So that the AI can answer questions about them.

**Acceptance Criteria:**
**Given** a new form submission is saved
**Then** a background job triggers
**And** generates embeddings for the text content
**And** applies a strict Token Usage Cap ($50/month hard limit) (PM #6)
**And** stores them in `pgvector` with metadata filtering (FR8.2).

### Story 10.2: Magic Forward (Email Ingestion)

As a User,
I want to forward an email to `new@worktree.com`,
So that a Project is created automatically.

**Acceptance Criteria:**
**Given** I forward a bid email with a PDF
**Then** the system parses the subject and body
**And** creates a new Project with the correct Client info
**And** notifies me when ready (FR8.1).

### Story 10.3: AI Assistant Interface

As a User,
I want to chat with an AI assistant in the sidebar,
So that I can find information quickly.

**Acceptance Criteria:**
**Given** I click the AI FAB
**Then** a chat window opens
**And** I can ask "What is the status of the HVAC inspection?" (FR11.1)
**And** the AI provides a "Confidence Score" and citations with its answer (UX #9)
**And** the FAB hides on scroll or is draggable to prevent blocking UI elements on mobile (UX #4).

### Story 10.4: API Key Management

As an Admin,
I want to generate and revoke API keys for external integrations,
So that I can connect third-party tools securely.

**Acceptance Criteria:**
**Given** I am in Project Settings > Integrations
**When** I create a new API Key
**Then** the key is displayed ONCE and then hashed (FR16.2)
**And** I can see the "Last Used" timestamp
**And** I can revoke the key immediately.

### Story 10.5: Webhooks & Event Subscriptions

As a Developer,
I want to subscribe to project events like `submission.created`,
So that I can trigger external workflows in Zapier or n8n.

**Acceptance Criteria:**
**Given** I am in Project Settings > Integrations
**When** I add a Webhook URL for `submission.created`
**Then** the system sends a JSON payload to that URL when a submission occurs (FR16.1)
**And** includes a discrete `X-Signature` header for security verification
**And** retries with exponential backoff if the external server returns 500 (Reliability)
**And** logs the delivery attempt in the Audit Log.

## Epic 11: Help Center & Support System

**Goal:** Provide a self-service knowledge base for users and a feedback loop.

### Story 11.1: Help Article Editor

As an Admin,
I want to write help articles using a rich text editor,
So that I can document procedures.

**Acceptance Criteria:**
**Given** I am in the Admin Studio
**Then** I can use a Notion-like editor (Plate.js) to write content
**And** automatic version history is kept for compliance (QA #10)
**And** publish it to the Help Center (FR19.1).

### Story 11.2: Mobile Offline Reader

As a Technician,
I want to read help articles while offline,
So that I can troubleshoot equipment without signal.

**Acceptance Criteria:**
**Given** I am offline
**When** I open the Help Center
**Then** I can browse and read previously synced articles
**And** zoom into images (FR19.3)
**And** video content includes auto-generated transcripts for accessibility/search (NFR12).

### Story 11.3: Support & Feedback Shake

As a User,
I want to report a bug by shaking my phone,
So that I can quickly capture the context.

**Acceptance Criteria:**
**Given** I am on the mobile app
**When** I shake the device
**Then** a Feedback Form pops up
**And** automatically attaches a screenshot and device logs (FR19.4).
