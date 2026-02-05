---
stepsCompleted:
  [
    "step-01-init",
    "step-02-discovery",
    "step-03-success",
    "step-04-journeys",
    "step-06-innovation",
    "step-07-project-type",
    "step-08-scoping",
    "step-09-functional",
    "step-10-nonfunctional",
    "step-11-complete",
    "step-01b-continue",
  ]
inputDocuments:
  - c:\Users\White\Documents\Worktree\Worktree\project-scope.md
  - c:\Users\White\Documents\Worktree\Worktree\docs\minio-guide.md
  - c:\Users\White\Documents\Worktree\Worktree\CLAUDE.md
workflowType: "prd"
lastStep: 11
---

# Product Requirements Document - Worktree

> [!NOTE]
> Part of the **[Worktree Project Plan](./project-context.md)**.
> **Role:** Defines **WHAT** we are building.
> **Source:** `prd.md`

**Author:** White
**Last Updated:** 2026-01-13

## Executive Summary

WorkTree is a self-hosted, simplified enterprise operations platform designed to centralize project management, data collection, and field operations. It unifies form building, route planning, PDF plan review, collaboration, and AI assistance into a single, secure web application.

The system is "Project-Based," meaning a **Project** (e.g., a specific client job or site visit) is the central unit to which all forms, routes, files, chats, and plans are attached.

### What Makes This Special

Unlike standalone form builders (SurveyJS, Typeform) or isolated routing tools, WorkTree **contextualizes data into Projects**. It bridges the gap between the back-office (Admin/Planning) and the field (Technicians), allowing data to flow seamlessly from a Smart Spreadsheet to a Route Plan, and from a Form Submission back into the Project Record, all within a self-hosted, secure environment.

## Innovation & Novel Patterns

### 1. Project-Centric Architecture (The Paradigm Shift)

- **Concept**: Moving from "Form Lists" to "Project Containers."
- **Innovation**: Deep integration where a single "Project" object unifies Forms, Maps, Files, and Chat.
- **Validation**: Stress test with "The Mega-Project" (50 forms, 1000s of rows, 500MB blueprints).

### 2. Context-Aware RAG (BYO-Key AI)

- **Concept**: User provides API Keys (OpenAI/Anthropic) for intelligent querying.
- **Innovation**: "Multi-Modal RAG" that indexes Form Data (structured), Chat (unstructured), and Blueprints (visual/text).
- **Optimization**: No heavy local LLM required. System queues requests to external APIs with rate limiting.

### 3. Active Document Control (Blueprints as Interface)

- **Concept**: "Annotation-to-Form" triggers.
- **Innovation**: Turning static PDFs into dynamic workflow launchers.
- **Mobile Experience**: "One-Tap" interaction targets (minimum 44x44px touch targets) to pass the "Muddy Thumb Test."

### 4. Site-Aware Auto-Launch (Contextual Compass)

- **Concept**: Reverse navigation. Don't make users find the project; let the project find the user.
- **Innovation**: Geofence detection triggers automatic "Daily Log" dashboard for the specific jobsite upon arrival.
- **Technical Strategy**: Uses OS-level **Significant Location Change (SLC)** API via **Capacitor Background Runner**. This wakes the app only when the device moves by a significant distance (e.g., 500m), reducing battery impact to <5% daily (validated vs. GPS polling).

### 5. Dynamic DNA (Project Flavors)

- **Concept**: Templates are active, not static.
- **Innovation**: Selecting a project type (e.g., "OSHPD Hospital") auto-injects specific validation logic (e.g., Seismic Checks) into standard forms.

### 6. The Gated Access Wizard (Project Visa)

- **Concept**: Compliance as a barrier to entry.
- **Innovation**: Automated "Onboarding Visa" for subcontractors.
- **Workflow**: When an external user (Subcontractor) is invited, they cannot access the Dashboard until they complete the "Visa Wizard":
  1. Upload Certificate of Insurance.
  2. Electronically Sign the Site Safety Plan.
  3. Enter Emergency Contact Info.
- **State Machine**: Uses a strict `compliance_status` (PENDING | APPROVED | REJECTED) on the user-project relation to enforce access logic at the middleware level.

### 7. Value-Add Data Architecture

- **Smart Upsert Engine**: Excel imports that _update_ live sheets via Key Column matching (unlike standard "Append/Overwrite" imports).
- **Hybrid Claim Permissions**: A dual-layer security model combining standard RBAC (Roles) with item-level "Claim" toggles to prevent bid shopping/visibility conflicts.

### 8. The Magic Forward (Zero-Touch Setup)

- **Concept**: Why type anything? Eliminate manual project creation.
- **Innovation**: Connects to a user-defined Email Inbox via **IMAP Poller**.
- **Workflow**:
  - System connects via **IMAP IDLE** (Push) using `ImapFlow`.
  - AI extracts: Project Name, Address, Client Name, Scope.
  - Auto-creates Project.
  - Auto-picks correct "Template" based on keywords (e.g., "Plumbing" -> "Plumbing Template").
- **Result**: Admin gets a notification: "Project '742 Evergreen' created. Review now?"

## Project Classification

**Technical Type:** saas_b2b
**Domain:** field_operations
**Complexity:** high

- **NFR9**: **Real-Time Concurrency**: "Smart Sheets" must support **50+ active concurrent users** with cursor latency under 200ms.
- **NFR10**: **PDF Generation**: Flattened PDF export of a 5MB document must complete in under **2 seconds**.
- **NFR11**: **AI Security**: The AI Assistant must **never** execute an action that fails an RBAC check (0% failure rate allowed for permission bypass).
  **Project Context:** Brownfield - extending existing system

## Success Criteria

1.  **Real-Time Stability**: Zero data loss during "offline-to-online" re-sync events (verified via Yjs sync tests).
2.  **PDF Fidelity**: Exported PDF visual layout matches the Editor overlay coordinates exactly (pixel-perfect).
3.  **AI Authorization**: The AI Assistant successfully declines requests for which the user lacks permission (verified via test suite).

### User Success

- **Efficiency**: Admins can build and publish a complex multi-step form in under 15 minutes.
- **Adoption**: Field technicians prefer using WorkTree over paper/legacy tools because it's mobile-friendly and "just works."
- **Data Integrity**: Project managers trust the data immediately because validation prevents bad input at the source.

### Business Success

- **Consolidation**: Organizations replace 3+ disjointed tools (SurveyJS, Routing App, Excel trackers) with WorkTree.
- **Operational Speed**: The time from "Submission" to "Action" (e.g., dispatching a fix) is reduced by 50%.
- **Self-Sufficiency**: Non-technical operations managers can create workflows without asking IT for help.

### Technical Success

- **Reliability**: Self-hosted deployment runs via Docker with zero dependency hell.
- **Scalability**: Handles 10,000+ submissions per form without UI lag in the Review tab.
- **Security**: RBAC and Domain Restrictions successfully prevent unauthorized access in 100% of audit tests.

## Product Scope

### MVP - Minimum Viable Product (Phase 1)

- **Core Form Builder**: Drag-and-drop, Logic, Validation.
- **Form Landing Page**: All 6 tabs functional (Overview, Edit, Submit, Review, Integrations, Settings).
- **Data Handling**: Submissions flow to database, files to MinIO.
- **Basic Admin**: User Management and Role assignment.
- **Help Center**: Admin Editor (Plate.js) + Mobile Reader.

### Growth Features (Phase 2 & 3)

- **Operations Suite**: Route Planning, Smart Spreadsheets, PDF Markup.
- **Advanced Ops**: AI Assistant, Microsoft SSO.

## User Journeys

### Journey 1: Sarah Centralizes Operations (The Admin Experience)

Sarah logs into WorkTree and clicks on the "Headquarters Renovation" project. She lands immediately on the **Project Dashboard**.

**The Dashboard View**:

- **Metrics**: She sees "85% Forms Completed," "3 Active Routes," and "5 New Photos Uploaded."
- **Quick Links**: Big cards for "Routes," "Forms," "Files," and "Chat."
- **Activity Feed**: A scrolling list of the latest actions.

From this single pane of glass, she has a pulse on the entire project.

**Form Configuration**:
She enters the **Form Builder** to create a "Parts Usage" log. She drags in the **'Smart Table'** field, configuring 3 columns: "Part Name," "Quantity," and "Condition." She **pre-fills** the "Part Name" column with 5 specific items and marks it **"Read-Only"** so technicians can't change the part names, only quantities.

**Data Review**:
Later, when she opens the **Review Tab**, she uses the "Columns" selector to show only "Technician Name," "Site Status," and "Defect Photos." The table instantly updates. She sees a thumbnail of a cracked pipe in the "Defect Photos" column. Clicking it opens a high-res lightbox preview without leaving the table.

### Journey 2: Mike's Frictionless Field Day (The Technician Experience)

Mike opens Worktree on his tablet. He sees his "Today's Route" sorted by distance. He clicks "Navigate" on the first stop (Stop 1), which opens Google Maps.

As he pulls into the driveway, the **Contextual Compass** (Geofence) detects his arrival. Worktree automatically launches the "Daily Log" dashboard for this specific site, bypassing the menu entirely. He sees the "Safety Checklist" waiting for him.

He quickly checks the boxes and snaps a photo of the "Broken Valve" using the camera field. **WorkTree automatically renames the file from `IMG_1234.jpg` to `Broken_Valve_ProjectName_Date.jpg`**. He signs with his finger and hits "Submit." The app updates his status to "Job Complete," automatically queuing up the next stop.

### Journey 3: The Emergency Dispatch (Real-time Operations)

Halfway through the day, an emergency call comes in. Sarah receives a "Priority 1" ticket. She opens the **Smart Spreadsheet** view in WorkTree, filters for "Available Technicians," and sees Mike is nearby.

She edits Mike's current running project to add the new "Emergency Stop" form and re-optimizes his route. Mike receives a push notification: "New Priority Stop Added." He sees the new destination at the top of his list. He accepts the job, and the entire team stays in sync without a single phone call.

### Journey 4: The Engineering Change Order (Document Control)

James, the Lead Engineer, receives a revised set of blueprints for the site. He uploads the large PDF set to the **Project Document Manager**. WorkTree automatically versions the file (v2.0) and links it to the "Site Plans" row in the Smart Spreadsheet.

James opens the **PDF Annotator** to mark up a specific change in the HVAC room. He circles the area and attaches a "Change Order" Form directly to the annotation. He tags Sarah, who dispatches the specific form to Mike. When Mike opens the form, it pulls up the exact PDF page James marked up.

### Journey 5: The Client Update (External Sharing)

Sarah wants to keep her client, "Acme Corp," updated on the project. She goes to Project Settings and enables **"Public Link Sharing"**.

She configures the link to be "Read-Only," password-protected, and sets it to expire in 30 days. She emails the human-readable link (`worktree.com/p/acme-reno`) to the client. The client clicks the link and lands on a branded **WorkTree Public Dashboard**, viewing the live timeline and safety reports without creating an account.

### Journey 6: The Bulk Import (Power User Efficiency)

Sarah receives a massive "Material List" from a supplier in Excel format (500 rows). Instead of running a complex "Import CSV Wizard" and mapping columns one by one, she simply highlights the 500 rows in Excel and hits `Ctrl+C`.

She opens the **Smart Spreadsheet** in WorkTree, clicks the top-left cell, and hits `Ctrl+V`. The **Bulk-Paste Grid** instantly parses the clipboard data, creating 500 new rows in seconds. The system intelligently matches the "Part Number" column to update existing records and creates new ones for unknown parts, saving her 20 minutes of data entry work.

### Journey Requirements Summary

- **Role-Based Interfaces**: Desktop (Admin), Mobile (Technician), Public (Client).
- **Project Dashboard**: Metrics, Activity Feed, Navigation Hub.
- **Form Builder**:
  - **Smart Table**: Pre-filled, read-only cells, matrix config.
  - **Auto-Naming**: File fields rename uploads based on metadata.
- **Visual Data Grid**: Custom columns, thumbnail previews, lightbox.
- **Integrated Document Control**: Versioning, Deep Linking, Annotation-to-Form.
- **Public Project Links**: Secure, read-only external sharing.
- **Human-Readable URLs**: Slug routing for all entities.

## Scope Refinements (From Party Mode)

- **Mobile Matrix UX**: "Smart Tables" must auto-convert to "Card Lists" on mobile devices.
- **Strict Schema Versioning**: Backend must support concurrent Form Schema versions to prevent data loss during offline sync.
- **Public Security**: External uploads are quarantined until virus-scanned; Public Links default to "Read-Only" with aggressive expiration policies.

## SaaS B2B Specific Requirements

### Project-Type Overview

WorkTree operates on a **Self-Hosted / Isolated Instance** model. This prioritizes data sovereignty and security over rapid multi-tenant scaling. Each client runs their own "Project OS."

### Technical Architecture Considerations

- **Verified Tech Stack**:
  - **Frontend/Backend**: Next.js 14 (App Router) using **Modular Monolith** architecture (Features as Aggregates).
  - **Database**: PostgreSQL 16 with **Row-Level Security (RLS)** for multi-tenancy and **pgvector** for RAG.
  - **Real-Time**: **Socket.io** + Redis Adapter for bi-directional Chat & Notifications.
  - **Storage**: MinIO (S3 Compatible).
  - **Feature Flags**: **Flagsmith** (Self-Hosted) for safe feature rollouts.

- **Deployment Model**:
  - **Platform**: **Coolify** (Self-Hosted PaaS) recommended for single-server "Push-to-Deploy" simplicity.
  - **Containerization**: Application, DB, MinIO, and Redis in a single Docker network.
  - **Redis Role**:
    - **Job Queue**: **BullMQ** for high-throughput jobs (IMAP Ingestion, AI Rate Limiting).
    - **Caching**: Storing aggregated Project Dashboard metrics.
    - **Pub/Sub**: Driving Socket.io adapter.
  - **Update Strategy**: "Pull & Restart" via Coolify/Watchtower.

- **Permission Model (RBAC)**:
  - **Standard Roles**: Owner, Admin, Member, Viewer.
  - **Enforcement**: **Postgres RLS Policies** (e.g., `using (project_id = app.current_project_id)`) ensure lowest-level data isolation.

- **API Strategy**:
  - **Internal First**: REST API with specialized "Aggregate Endpoints" to minimize round-trips for the Mobile App.
  - **Public Interfaces**: Webhooks only for MVP.

- **Data Isolation**:
  - **Logical Separation**: RLS enforcement allows multi-project hosting in a single DB while maintaining strict isolation.
  - **Backups**: Automated pg_dump to S3.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** **Field Operations MVP**
**Goal:** Replace paper/legacy tools for ONE team immediately.
**Philosophy:** "If a technician can't do it in the rain, it's out."
**Resource Requirements:** Lean Full-Stack Team (Focus on Offline Sync & Mobile UX).

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**

- Journey 1: Sarah (Admin) - Basic Form Building & assignment.
- Journey 2: Mike (Technician) - Offline usage, Photos, Submission.

**Must-Have Capabilities:**

- **Form Builder**: Drag-and-drop, Logic, Validation, Auto-Naming.
- **Mobile App**: **Offline Sync**, Camera integration, Signature capture.
- **Project Mgmt**: Dashboard (Metrics), Basic Route List.
- **Security**: Standard Roles (Owner/Admin/Member), Private Links.
- **Security**: Standard Roles (Owner/Admin/Member), Private Links.
- **Deployment**: Docker Compose (Self-Hosted).
- **Field Tools**: **RFIs** (Draft Mode), **Specs** (Text Search), **Schedule** (List View).

### Post-MVP Features

**Phase 2 (Growth):**

- **Smart Spreadsheet**: Full matrix editing and deep linking.
- **Public Portal**: External, read-only dashboard for clients.
- **Complex Matrix**: Dynamic rows/cols for "Smart Tables."
- **Mobile**: Background Sync, Push Notifications.
- **Gated Access**: "Visa Wizard" requiring uploads (Insurance/Safety) before Dashboard access.

**Phase 3 (Expansion):**

- **AI RAG**: Context-aware queries across project data.
- **Blueprints**: Active Annotation-to-Form triggers.
- **Enterprise**: SSO, Audit Logs, K8s Support.
- **Magic Forward**: AI-powered Project Creation from raw emails (body text) or PDF attachments.

### Risk Mitigation Strategy

**Technical Risks:**

- **Offline Sync**: Mitigation -> Implement strict **Schema Versioning** from Day 1 to prevent data corruption during sync.
- **Mobile Performance**: Mitigation -> Force "Card View" on mobile tables to ensure usability.

**Market Risks:**

- **Adoption**: Mitigation -> Focus 100% on the "Technician Experience" (Mike) in Phase 1. If Mike likes it, Sarah will buy it.

### Implementation Considerations

- **Environment Config**: System must be configurable entirely via `.env` variables (e.g., `MINIO_ENDPOINT`, `POSTGRES_URL`).
- **License Check**: (Future) Simple "Phone Home" or License Key check on startup to validate Enterprise status.

## Functional Requirements

### FR1: Form Management (The Builder)

- **FR1.1**: Admin can create forms using a drag-and-drop interface.
- **FR1.2**: Admin can configure field validation (Required, Regex, Min/Max).
- **FR1.3**: Admin can enable "Conditional Visibility" logic.
- **FR1.4**: Admin can configure "Smart Table" fields with pre-filled read-only headers.
- **FR1.5**: System must automatically rename file uploads based on `[Field_Name]_[Date]` patterns.
- **FR1.5.1**: **Object Hierarchy**: Files must be stored in MinIO with strict structure: `/{project_id}/{form_id}/{submission_id}/{filename}` to allow for organized bulk exports.
- **FR1.6**: **Retroactive Renaming**: If a field is renamed, system must trigger a background job to rename all associated existing files.
- **FR1.7**: **PDF Form Mapping**: Admin can upload an existing PDF (e.g., Government Form) and drag-and-drop "Input Fields" overlaying the PDF.
  - **Export**: When exported, the PDF should be "flattened" (burned) with the user's data in the correct positions, indistinguishable from a filled original PDF.

### FR2: Field Operations (Mobile App)

- **FR2.1**: Technician can view their assigned route list sorted by distance.
- **FR2.2**: Technician can "Deep Link" to native maps (Google/Apple).
- **FR2.3**: **Offline Capability**: Technician can complete forms fully offline.
- **FR2.4**: **Append-Only Ledger**: Mobile app maintains an immutable ledger of all operations. On re-connection, sync engine replays operations.
- **FR2.4.1**: **Schema Migration**: If server schema has changed, system attempts to map old fields to new ones. If mapping fails, submission is Quarantined for Admin resolution.
- **FR2.5**: **Image Optimization**: Mobile app must auto-compress images (e.g., to 1080p) before upload to optimize bandwidth.
- **FR2.6**: Technician can capture photos and sign forms via touchscreen.

### FR3: Project Organization

- **FR3.1**: Admin can create "Projects" as containers for Forms, Routes, and Files.
- **FR3.2**: Admin can view the "Project Dashboard" showing completion metrics and activity feed.
- **FR3.3**: System must generate human-readable URL slugs for all Projects.

### FR4: Data Review & Reporting

- **FR4.1**: Admin can view submissions in a standard Data Grid.
- **FR4.2**: Admin can customization Data Grid columns (Toggle visibility).
- **FR4.3**: Admin can view image thumbnails in grid and open in Lightbox.
- **FR4.4**: **Export Suite**: Admin can export data to CSV, Excel, JSON, and PDF (including "Mapped PDF" exports).
- **FR4.5**: **Bulk Media**: Admin can download all media files for a selection as a ZIP archive.
- **FR4.9**: **Legacy Import**: System must retain the standard "Upload CSV > Map Columns" wizard for bulk data ingestion.

### FR12: Real-Time Smart Grid (Smartsheet-Style)

- **FR12.1**: **Live Collaboration**: Implement a custom "Smart Grid" using a headless table architecture (TanStack Table + Yjs).
  - Must support sub-second real-time sync of cell data via **Hocuspocus** WebSocket server.
  - Must support **User Presence** (Colored cursors/borders).
  - **Latency Handling**: Use Optimistic Updates for local edits; reconcile via Yjs CRDTs.
- **FR12.2**: **Row-Centric Data Model**:
  - Rows must be treated as entities with stable UUIDs (CUID).
  - **Hierarchy**: Support parent/child row indentation (WBS) to create task groupings.
  - **Drag & Drop**: Users can reorder Rows and Columns via drag-and-drop.
  - **Row Detail**: Clicking a row ID opens a "Side Panel" containing Row-specific Chat, File Attachments, and Audit History. **Attachments must link to the Row ID, not the visual index.**
- **FR12.3**: **Rich Column Types**:
  - **Standard**: Text, Number, Date, Checkbox, Dropdown (Single/Multi).
  - **Advanced**: Contact List (Project Members), Symbols (RAG Status), Duration, Auto-Number.
  - **System**: Created By, Created Date, Modified By, Modified Date (Auto-managed).
  - **Validation**: Columns can have strict data validation rules (e.g., "Must be email").
- **FR12.4**: **Advanced Logic**:
  - **Formulas**: Headless calculation engine (`=SUM(CHILDREN())`, `=VLOOKUP`) compatible with Excel syntax. **Running in a Web Worker** to prevent UI blocking.
  - **Conditional Formatting**: Rules to change cell background/text color based on values.
  - **Status Automation**: Rules to auto-update status (e.g., "If Progress=100%, set Status='Complete'").
- **FR12.5**: **Smart Ingestion**:
  - **Import**: Wizard to ingest CSV/Excel files.
  - **Smart Upsert**: "Merge" mode allowing users to select a "Key Column" (e.g., SKU) to update existing rows instead of appending duplicates.
- **FR12.6**: **Multiple Views**:
  - **Grid**: Standard spreadsheet view. **Support Virtualization for 10k+ rows.**
  - **Gantt**: Visual timeline requiring "Start Date" and "End Date/Duration" column mapping. **Interactive bars** update underlying dates.
  - **Calendar**: Monthly/Weekly view requiring "Date" column mapping. Supports multi-day events.
  - **Card**: Kanban board view requiring "Dropdown/Status" column mapping. **Default view on Mobile.**
  - **View Persistence**: Filter/Sort state must be URL-encoded for sharing (`?view=gantt&filter=status:open`).
- **FR12.7**: **Governance & Security**:
  - **Versioning**: Users can save "Snapshots" and rollback the entire sheet to a previous state.
  - **Audit Log**: Full history of who changed what cell and when.
  - **Column Permissions**: Admin can lock specific columns (e.g., "Cost") to be Read-Only for Editors.
  - **Guest Access**: Subcontractors can be restricted to view/edit only Rows they have "Claimed" or are Assigned to.
- **FR12.8**: **AI Integration**:
  - The Global AI Agent can perform sheet operations (`add_row`, `edit_cell`, `insert_column`) on behalf of the user, strictly scoped to their RBAC permissions.

### FR12.9: Connected Workflows (Integration)

- **Form-to-Sheet**:
  - **Real-Time**: Submissions append rows to the Yjs document immediately via WebSocket (or Webhook acting as client).
  - **Reliability**: Queue submissions if Sheet is offline; replay on reconnect.
- **Sheet-to-Route**:
  - **Bi-Directional**: Changing an address in the Sheet updates the Route Stop coordinates. Reordering Route Stops updates the 'Rank' column in the Sheet.

### FR5: Security & Administration (Self-Hosted)

- **FR5.1**: Owner can invite users via email with Standard Roles.
- **FR5.2**: **Invite Control**: Invites must expire after 48 hours and be revocable by Owner.
- **FR5.3**: System must enforce role-based access control (RBAC) at the API level.
- **FR5.4**: System must isolate data per instance (No Multi-Tenant/Cloud logic).
- **FR5.5**: **Hybrid Roles**: Admin can create custom Roles (e.g., "Subcontractor") with specific CRUD permissions.
- **FR5.6**: **Claim Logic**: Admin can toggle specific items/rows as "Claimable".
  - **Exclusive Claim**: Only one user can claim (locks row to Claimant + Admin).
  - **Multi-Claim**: Multiple users can claim (adds their UserID to the row).
- **FR5.7**: **Visibility Scope**: Users with limited roles can only view items they have "Claimed" (solving the Bid Shopping problem).
- **FR5.8**: **Gated Access (Visa)**: Admin can configure "Mandatory Onboarding Steps" (Forms/Uploads) that invited users must complete before gaining access to the Project Dashboard. System must lock access until all steps are validated.
- **FR5.9**: **Global Audit Log**: Admin (Owner) can view a site-wide chronological log of every action taken by every user (e.g., "User X updated Setting Y", "User Z deleted Project A"). This must include IP address and User Agent.

### FR6: Public Interfaces

- **FR6.1**: Admin can generate a secure, read-only "Public Link" for a Project.
- **FR6.2**: System must enforce password protection on Public Links if configured.
- **FR6.3**: **Marketing Landing Page**: The root URL (`/`) must display a high-quality product showcase page detailing features (Offine Sync, Smart Tables, etc.) with a "Loom Video" embed and "Contact Sales" CTA. No pricing page required.

### FR7: Collaboration & Action

- **FR7.1**: **Universal Assignment**: Users can assign specific entities (Forms, Files, Sheet Rows) to other users.
- **FR7.2**: **Action Inbox**: System provides a dedicated "Inbox" page listing all items assigned to the current user.
- **FR7.3**: **Notification Engine**: System sends notifications (In-App, Email, PC/Mobile Push) when an item is assigned.
- **FR7.4**: **Subscription Preferences**: Users can configure granular alerts (e.g., "Notify me on New Submission", "Notify me on Sheet Edit", "Notify me on Document Upload").
- **FR7.5**: **Smart Linking**: Notifications must include a direct link to the specific item context (e.g., opening the specific Sheet Row in the side panel).

### FR8: Advanced Automation

- **FR8.1**: **Magic Forward**: System must accept email forwards to `new@worktree.com`, parse body/attachments via AI, and auto-create Project entities with correct Templates.
- **FR8.2**: **RAG Engine**: System must index Project data (Forms, Chat, PDFs) for natural language querying.
- **FR8.3**: **Contextual Compass**: Mobile app must monitor Geofence triggers to auto-launch specific Project Dashboards.

### FR11: Global AI Assistant (Agentic)

- **FR11.1**: **Persistent Chat Interface**: A "Global" AI button (bottom-right) accessible on every page.
- **FR11.2**: **Autonomous Action**: The AI Agent must be capable of executing actions on behalf of the user via function calling.
  - **Supported Actions**:
    - Update Sheet Data (e.g., "Change status of row 5 to 'Done'").
    - Form Management (e.g., "Add a 'Reason' text field to the 'Inspection' form").
    - Assignment (e.g., "Assign all open issues to Mike").
    - Route Optimization (e.g., "Re-optimize my route starting from HQ").
- **FR11.3**: **Context Awareness**: Agent must be aware of the "Current Page" context (e.g., if on a Sheet, "Update this row" refers to the selected row).
- **FR11.4**: **Permission Enforcement**: The AI Agent operates strictly within the authenticated user's permission scope. It must verify (via Tool call or System Prompt) that the user is authorized to perform an action before execution. It cannot bypass RBAC or RLS policies.
- **FR11.5**: **UI Implementation**: The Chat Interface should utilize the **Launch UI Proxx Chat Patterns** where applicable during UX design.

### FR13: Project Calendar

- **FR13.1**: **Sheet Visualization**: Every "Smart Sheet" (if containing a Date column) must be viewable as a Calendar.
- **FR13.2**: **UI Component**: Should leverage the **Launch UI Proxx Calendar Patterns** during UX design.
- **FR13.3**: **Interactivity**: Clicking a calendar event opens the Sheet Row detail view (Side Panel).

### 3.4 User Management & RBAC Strategy

**Core Principle:** strict separation between "The Kingdom" (Site / SaaS Layer) and "The Castle" (Project Layer).

1.  **Site-Wide Context (The Kingdom):**
    - **Owner:** Full system control, billing, subscription.
    - **Site Admin:** User management, integrations, system logs.
    - **Project Creator:** Specific permission to spawn new Projects.
    - **Member:** Can be invited into projects.

2.  **Project-Wide Context (The Castle):**
    - _Roles are Template-Defined (Snapshot Strategy). Updates to a Template do NOT affect existing projects._
    - **Project Director:** Full Destructive Access (Delete Project). _Constraint: Cannot demote self if Last Director._
    - **Project Manager:** Operational control (Invites, Forms, Sheets).
    - **Foreman:** Field Leadership (Edit Sheets, Assign Routes).
    - **Technician:** Execution Only (Append-Only Forms).
    - **Guest:** Read-Only or Limited Scope (e.g., Subcontractor Visa).

3.  **Role Lifecycle Rules:**
    - **Creation:** New Projects are seeded with default roles (Director, PM, Tech).
    - **Deletion:** Deleting a Role triggers a "Migration Modal" requiring reassignment of all affected users.
    - **Caching:** Permission changes take effect on **Next Login** (Session Refreshed).
    - **Precedence:** Object Visibility (`Private`) > Role Permission (`Edit Sheet`).

### 3.5 Intelligence & Automationt\*\*: Template-defined roles are strictly _Project Scoped_. Templates cannot define or modify Global System Roles to prevent privilege escalation.

### FR15: External Compliance & Access Gates

- **FR15.1**: **Compliance Requirements**: Projects can define "Gates" for external users (e.g., "Must upload Insurance Cert", "Must sign Safety Waiver").
- **FR15.2**: **Access Control**: Attempting to view a shared Item (Form/Sheet Row) redirects the user to the Compliance Wizard if criteria are unmet.
- **FR15.3**: **Identity Claiming**: External users can "claim" an item if they pass the compliance gate.
  - **Verification**: Claiming requires **Email Magic Link** or **Verified Account** matching the invited email/contact. Simple URL possession is insufficient.

### FR10: User Personalization

- **FR10.1**: **Profile Management**: Users can update their "Display Name" (separate from login email).
- **FR10.2**: **Avatar Upload**: Users can upload a profile photo. System must auto-crop/resize to optimized dimensions (e.g., 256x256).
- **FR10.3**: **Theme Preference**: Users can toggle between Light, Dark, or System Sync modes. This preference must persist across sessions and devices via the database.

### FR9: Universal Versioning (Time Travel)

- **FR9.1**: **Entity History**: System must maintain a full edit history for **Forms**, **Sheets**, and **Routes**.
- **FR9.2**: **Granularity**:
  - **Forms**: Versioned on "Publish" (Schema Versioning).
  - **Sheets**: Versioned on "Cell Edit" (Audit Log) or "Snapshot" (Time Travel).
  - **Routes**: Versioned on "Re-Optimization" or "Manual Reorder".
- **FR9.3**: **Restore Capability**: Admin can view previous versions and "Rollback" to a specific state.
- **FR9.4**: **Blame**: Every version/edit must be attributed to a specific User ID and Timestamp.

### FR16: Enterprise Integrations

- **FR16.1**: **Outgoing Webhooks**: System must support "Event Subscriptions" (e.g., `submission.created`) sending JSON payloads to external URLs. Must include Retry Logic (Exponential Backoff).
- **FR16.2**: **API Management**:
  - **Incoming Keys**: Admin can generate "Hashed" API Keys with scopes (`read:forms`) for external scripts.
  - **Outgoing Secrets**: Admin can securely save encrypted keys (OpenAI, Stripe) in the database.
- **FR16.3**: **Auto-Documentation**: API must expose an **OpenAPI / Swagger** spec that is auto-generated from code to ensure accuracy.

### FR17: Data Lifecycle & Hygiene

- **FR17.1**: **Retention Policies**: Admin can configure TTL (Time To Live) for specific data types (e.g., "Delete Compliance Uploads after 90 days").
- **FR17.2**: **Storage Quotas**: Projects must have hard storage caps (e.g., 5GB). System rejects uploads exceeding the quota.
- **FR17.3**: **Project Portability**: Admin can **Export** a Project structure (Forms, Roles, Logic) to JSON and **Import** it into another instance (Migration).

### FR18: FinOps & Monitoring

- **FR18.1**: **Resource Budgeting**: System allows setting "Soft Caps" for AI Token usage and Storage.
- **FR18.2**: **Alerts**: Admin receives an email notification if a Project exceeds its monthly budget (e.g., >$50 in Gemini tokens).

### FR19: Help Center & Support

- **FR19.1**: **Admin Studio**: Rich Text Editor (Plate.js) for creating support articles.
- **FR19.2**: **Workflow**: Articles must support `DRAFT` (Admin Only) and `PUBLISHED` (Visible to All) states.
- **FR19.3**: **Mobile Reader**:
  - Articles must be cached for offline reading.
  - Images must support **Pinch-to-Zoom**.
- **FR19.4**: **Feedback Loop**: "Shake to Report" triggers a bug report form that auto-attaches device logs and screenshot.

### FR20: RFI Management (The Query Engine)

- **FR20.1**: **Creation Workflow**: Techs can create "Draft" RFIs offline (Photo + Voice Note).
- **FR20.2**: **Polymorphic Context**: RFIs can be linked to a **Sheet Region**, **Schedule Task**, or **Spec Section**.
- **FR20.3**: **Ball-in-Court Logic**: System tracks "Current Assignee" with visual SLA indicators (Green/Yellow/Red).
- **FR20.4**: **Official Numbering**: RFIs get a sequential ID (RFI-001) only when "Opened" by the PM, distinguishing them from "Field Drafts".

### FR21: Specification Library (The Knowledge Base)

- **FR21.1**: **Ingestion**: Admin uploads PDF Spec Book. System splits it into Sections (e.g., "03 30 00 - Concrete").
- **FR21.2**: **Search**: Full-text search across all specs.
- **FR21.3**: **Contextual Push**: System suggests relevant Spec Sections based on the Form being filled (e.g., "Concrete Pour" form -> show "03 30 00").
- **FR21.4**: **Offline Availability**: Parsed text must be available offline. PDF images lazy-loaded.

### FR22: Schedule Management (The Metronome)

- **FR22.1**: **Import**: Support importing `.xml` (MS Project) or `.xer` (Primavera/P6) files.
- **FR22.2**: **Desktop View**: "Strategy Room" split-view (Gantt Top / Resource Load Bottom).
- **FR22.3**: **Mobile View**: "Task List" sorted by date. No complex Gantt rendering on phones.
- **FR22.4**: **Blocker Logic**: "I am Blocked" button on any task triggers an RFI creation flow.

## Non-Functional Requirements

### Mobile Performance & Reliability

- **NFR1 (Sync Resilience)**: System must support **long-running background uploads** (up to 30+ minutes) on intermittent connections without timing out or corrupting data. Resumable uploads are required.
- **NFR2 (Offline Startup)**: Mobile app must load to the "Route List" in < 2 seconds while completely offline.
- **NFR3 (Battery Drain)**: Background sync must not consume more than 5% battery per hour of active field usage.

### Security (Self-Hosted)

- **NFR4 (Data Encryption)**: All data at rest (DB + MinIO) must be encrypted using AES-256.
- **NFR5 (Quarantine Safety)**: Quarantined submissions (sync conflicts) must be stored in a separate, encrypted local store on the device until resolved.
- **NFR8 (Secrets Management)**: User-provided API Keys (OpenAI, etc.) must be encrypted at rest (Field-Level Encryption) in the database and never returned in plain text to the frontend.

### Scalability (Project-Centric)

- **NFR6 (Large Projects)**: System must support projects with up to 10,000 form submissions without degradation of Dashboard load time (> 2s).
- **NFR7 (Blueprint Rendering)**: PDF Blueprint viewer must render a 50MB vector PDF in < 3 seconds on a standard tablet (iPad Air equivalent).
- **NFR9 (Real-Time Latency)**: "Smart Sheet" cursor updates must propagate to other users in < 200ms.

### Inclusivity & Localization

- **NFR12 (Accessibility)**: The "Smart Sheet" Canvas component must include a **Semantic Shadow DOM** (Hidden HTML Table) to support Screen Readers (JAWS, NVDA).
- **NFR13 (Localization)**: The platform must support **English (en-US)** and **Spanish (es-ES)** out of the box. Error messages and UI text must respect the user's `Accept-Language` header.
