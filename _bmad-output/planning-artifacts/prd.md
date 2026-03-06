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
  - c:\Users\White\Documents\Worktree\Worktree\docs\s3-usage-guide.md
  - c:\Users\White\Documents\Worktree\Worktree\CLAUDE.md
workflowType: "prd"
workflow: "edit"
classification:
  domain: "field_operations"
  projectType: "saas_b2b, web_app, mobile_app"
  complexity: "high"
lastEdited: "2026-03-05"
stepsCompleted: ['step-e-01-discovery', 'step-e-02-review', 'step-e-03-edit']
editHistory:
  - date: "2026-03-05"
    changes: "Systematic validation improvements (Traceability, Measurability, Leakage removal)"
---

# Product Requirements Document - Worktree

> [!NOTE]
> Part of the **[Worktree Project Plan](./project-context.md)**.
> **Role:** Defines **WHAT** we are building.
> **Source:** `prd.md`

**Author:** White
**Last Updated:** 2026-01-13

## Executive Summary

WorkTree is a cloud-hosted, simplified enterprise operations platform designed to centralize project management, data collection, and field operations. It unifies form building, route planning, PDF plan review, collaboration, and AI assistance into a single, secure web application powered by AWS managed services.

The system is "Project-Based," meaning a **Project** (e.g., a specific client job or site visit) is the central unit to which all forms, routes, files, chats, and plans are attached.

### What Makes This Special

Unlike standalone form builders (SurveyJS, Typeform) or isolated routing tools, WorkTree **contextualizes data into Projects**. It bridges the gap between the back-office (Admin/Planning) and the field (Technicians), allowing data to flow seamlessly from a Smart Spreadsheet to a Route Plan, and from a Form Submission back into the Project Record, all within a secure, AWS-managed environment.

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
- **State Machine**: Uses a strict `compliance_status` (PENDING | APPROVED | REJECTED) on the `ProjectMember` entity (ElectroDB) to enforce access logic at the middleware level.

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

1.  **Real-Time Stability**: Zero data loss during "offline-to-online" re-sync events (verified via sync protocol tests).
2.  **PDF Fidelity**: Exported PDF visual layout matches the Editor overlay coordinates exactly (pixel-perfect alignment).
3.  **AI Authorization**: The AI Assistant successfully declines requests for which the user lacks permission (verified via test suite enforcing a 0% failure rate).
4.  **Route Planning Efficiency**: Route optimization calculation completes in under 5 seconds for up to 50 stops, reducing overall travel time by at least 15% across standard daily routes.
5.  **Collaboration Responsiveness**: Live cursors and chat messages appear for all connected users in a workspace with under 250ms of latency at the 95th percentile.

### User Success

- **Efficiency**: Admins can build and publish a complex multi-step form in under 15 minutes.
- **Adoption**: Field technicians prefer using WorkTree over paper/legacy tools because it's mobile-friendly and "just works."
- **Data Integrity**: Project managers trust the data immediately because validation prevents bad input at the source.

### Business Success

- **Consolidation**: Organizations replace 3+ disjointed tools (SurveyJS, Routing App, Excel trackers) with WorkTree.
- **Operational Speed**: The time from "Submission" to "Action" (e.g., dispatching a fix) is reduced by 50%.
- **Self-Sufficiency**: Non-technical operations managers can create workflows without asking IT for help.

### Technical Success

- **Reliability**: AWS ECS Fargate deployment with managed database (DynamoDB), storage (S3), and cache (ElastiCache) — zero infrastructure ops overhead.
- **Scalability**: Handles 10,000+ submissions per form without UI lag in the Review tab. DynamoDB scales automatically.
- **Security**: Application-layer RBAC enforced on every API request; DynamoDB partition key design prevents cross-tenant data access.

## Product Scope

### MVP - Minimum Viable Product (Phase 1)

- **Core Form Builder**: Drag-and-drop, Logic, Validation.
- **Form Landing Page**: All 6 tabs functional (Overview, Edit, Submit, Review, Integrations, Settings).
- **Data Handling**: Submissions flow to DynamoDB, files to AWS S3.
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

### Journey 7: The Intelligent Assistant (Global AI & Authorization)

During an active project, Sarah needs to restructure a massive "Parts Usage" sheet and find an old compliance form. She clicks the **Global AI Assistant** icon that persists across the application. She types: "Assign all open structural issues to Mike and add a 'Severity' column to the current view."

The AI agent verifies her permissions transparently in the background, executing the multi-step request instantly. Later, when an invited Subcontractor attempts to ask the AI for project financials, the AI politely declines, strictly adhering to the RBAC and returning only responses authorized for their "Guest" role.

### Journey 8: Connecting Systems (Enterprise Integrations)

The IT Director, David, needs to integrate WorkTree with the company's existing ERP system. He logs into the Project Settings and navigates to the API Management tab. He generates a secure, hashed API Key with a scoped `read:forms` permission.

He then configures an Outgoing Webhook to listen for the `submission.created` event. Next, he navigates to the auto-generated Swagger OpenAPI documentation page, quickly copying the exact JSON payload structures needed to map the incoming WorkTree form data into the ERP.

### Journey 9: Deep Field Analysis (Tasks & Specs)

Mike is on-site attempting to install a specialized concrete anchor. He encounters an unexpected rebar conflict. Offline and deep in the basement, he opens the **Specification Library** and searches for "Concrete Anchor Depth." He instantly pulls up the deeply indexed "03 30 00 - Concrete" document section.

Finding no solution, he opens the **Schedule View** and marks his task as "Blocked". This instantly triggers the **Task Creation Workflow**. He snaps a photo, records an offline voice note describing the conflict, and attaches the Task to the specific spec section. Once back upstairs with a signal, the Task syncs and formally alerts Sarah for resolution, keeping the SLA timer strictly in check.

### Journey Requirements Summary

- **Role-Based Interfaces**: Desktop (Admin), Mobile (Technician), Public (Client).
- **Project Dashboard**: Metrics, Activity Feed, Navigation Hub.
- **Form Builder**:
  - **Smart Table**: Pre-filled, read-only cells, matrix config.
  - **Auto-Naming**: File fields rename uploads based on metadata.
- **Visual Data Grid**: Custom columns, thumbnail previews, lightbox.
- **Integrated Document Control**: Versioning, Deep Linking, Annotation-to-Form.
- **Public Project Links**: Secure, read-only external sharing.
- **Advanced Assist**: Cross-app contextual AI interactions with strict permission enforcement.
- **Developer Access**: Auto-documenting API structures and Webhooks with delivery persistence.
- **Field Depth**: Offline specification searches, Schedule Blockers, and contextual Task creation.
- **Human-Readable URLs**: Slug routing for all entities.

## Scope Refinements (From Party Mode)

- **Mobile Matrix UX**: "Smart Tables" must auto-convert to "Card Lists" on mobile devices.
- **Strict Schema Versioning**: Backend must support concurrent Form Schema versions to prevent data loss during offline sync.
- **Public Security**: External uploads are quarantined until virus-scanned; Public Links default to "Read-Only" with aggressive expiration policies.

## SaaS B2B Specific Requirements

### Project-Type Overview

WorkTree operates on a **Self-Hosted / Isolated Instance** model. This prioritizes data sovereignty and security over rapid multi-tenant scaling. Each client runs their own "Project OS."

### Technical Architecture Considerations

> [!NOTE]
> Technical stack decisions are fully documented in [`architecture.md`](./architecture.md).
> **Summary**: Next.js App Router + AWS DynamoDB (ElectroDB) + AWS S3 + AWS ElastiCache (Redis/BullMQ) + Pinecone (RAG) + ECS Fargate, with Hocuspocus for real-time collaboration and Auth.js for authentication. Local development mirrors production via Docker Compose with LocalStack (S3), DynamoDB Local, and Redis containers.

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
- **Deployment**: AWS ECS Fargate (Cloud-Native).
- **Field Tools**: **Tasks** (Draft Mode), **Specs** (Text Search), **Schedule** (List View).

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

- **Environment Config**: System must be configurable entirely via `.env` variables (e.g., `DYNAMODB_ENDPOINT`, `REDIS_URL`, `S3_ENDPOINT`). Local dev variables point to Docker Compose service names; production omits endpoint overrides to use real AWS services.
- **License Check**: (Future) Simple "Phone Home" or License Key check on startup to validate Enterprise status.

## Functional Requirements

### FR1: Form Management (The Builder)

- **FR1.1**: Admin can create forms using a drag-and-drop interface.
- **FR1.2**: Admin can configure field validation (Required, Regex, Min/Max).
- **FR1.3**: Admin can enable "Conditional Visibility" logic.
- **FR1.4**: Admin can configure "Smart Table" fields with pre-filled read-only headers.
- **FR1.5**: Technician can upload files which the system automatically renames based on `[Field_Name]_[Date]` patterns.
- **FR1.5.1**: **Object Hierarchy**: System structurally organizes all file uploads hierarchically (Project -> Form -> Submission) within S3-compatible Object Storage for bulk export indexing.
- **FR1.6**: **Retroactive Renaming**: Admin can rename fields which automatically triggers the system to rename all associated existing files.
- **FR1.7**: **PDF Form Mapping**: Admin can upload an existing PDF (e.g., Government Form) and drag-and-drop "Input Fields" overlaying the PDF.
  - **Export**: Admin can export the PDF, which the system "flattens" (burns) with the user's data in the correct positions, indistinguishable from a filled original PDF.

### FR2: Field Operations (Mobile App)

- **FR2.1**: Technician can view their assigned route list sorted by distance.
- **FR2.2**: Technician can "Deep Link" to native maps (Google/Apple).
- **FR2.3**: **Offline Capability**: Technician can complete forms fully offline.
- **FR2.4**: **Append-Only Ledger**: Technician interacts with an immutable ledger of all operations on the mobile app. On re-connection, the sync engine replays operations.
- **FR2.4.1**: **Schema Migration**: Technician submits offline data which the system attempts to map to new fields if the server schema has changed. If mapping fails, submission is Quarantined for Admin resolution.
- **FR2.5**: **Image Optimization**: Technician can upload images which the mobile app auto-compresses (e.g., to 1080p) before upload to optimize bandwidth.
- **FR2.6**: Technician can capture photos and sign forms via touchscreen.

### FR3: Project Organization

- **FR3.1**: Admin can create "Projects" as containers for Forms, Routes, and Files.
- **FR3.2**: Admin can view the "Project Dashboard" showing completion metrics and activity feed.
- **FR3.3**: Admin can view human-readable URL slugs automatically generated for all Projects.

### FR4: Data Review & Reporting

- **FR4.1**: Admin can view submissions in a standard Data Grid.
- **FR4.2**: Admin can customization Data Grid columns (Toggle visibility).
- **FR4.3**: Admin can view image thumbnails in grid and open in Lightbox.
- **FR4.4**: **Export Suite**: Admin can export data to CSV, Excel, JSON, and PDF (including "Mapped PDF" exports).
- **FR4.5**: **Bulk Media**: Admin can download all media files for a selection as a ZIP archive.
- **FR4.9**: **Legacy Import**: Admin can use the standard "Upload CSV > Map Columns" wizard for bulk data ingestion.

### FR12: Real-Time Smart Grid (Smartsheet-Style)

- **FR12.1**: **Live Collaboration**: User can edit cells concurrently with other users in a "Live Table" with sub-second real-time sync.
  - User can view **User Presence** of others active in the sheet (Colored cursors/borders).
  - **Latency Handling**: User edits are handled optimistically for immediate feedback and reconciled securely via distributed data structures (CRDT).
- **FR12.2**: **Row-Centric Data Model**:
  - System treats rows as entities with stable unique identifiers.
  - **Hierarchy**: User can apply parent/child row indentation (WBS) to create task groupings.
  - **Drag & Drop**: User can reorder Rows and Columns via drag-and-drop.
  - **Row Detail**: User can click a row ID to open a "Side Panel" containing Row-specific Chat, File Attachments, and Audit History. **Attachments must link to the Row ID, not the visual index.**
- **FR12.3**: **Rich Column Types**:
  - **Standard**: User can create Text, Number, Date, Checkbox, Dropdown (Single/Multi) columns.
  - **Advanced**: User can create Contact List (Project Members), Symbols (RAG Status), Duration, and Auto-Number columns.
  - **System**: Admin can view Created By, Created Date, Modified By, Modified Date (Auto-managed) columns.
  - **Validation**: Admin can apply strict data validation rules to columns (e.g., "Must be email").
- **FR12.4**: **Advanced Logic**:
  - **Formulas**: User can write Excel-compatible formulas (`=SUM(CHILDREN())`, `=VLOOKUP`) that execute continuously in the background without blocking the UI.
  - **Conditional Formatting**: User can apply rules to change cell background/text color based on values.
  - **Status Automation**: User can configure rules to auto-update status (e.g., "If Progress=100%, set Status='Complete'").
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
  - User can command the Global AI Agent to perform sheet operations (`add_row`, `edit_cell`, `insert_column`) on their behalf, strictly scoped to their RBAC permissions.

### FR12.9: Connected Workflows (Integration)

- **Form-to-Sheet**:
  - **Real-Time**: Technician submits forms which instantly append rows to the Smart Sheet.
  - **Reliability**: Technician submissions are queued if the Sheet is offline and replay on reconnect.
- **Sheet-to-Route**:
  - **Bi-Directional**: Admin changes an address in the Sheet which instantly updates the Route Stop coordinates. Technician reorders Route Stops which instantly updates the 'Rank' column in the Sheet.

### FR5: Security & Administration (Self-Hosted)

- **FR5.1**: Owner can invite users via email with Standard Roles.
- **FR5.2**: **Invite Control**: Owner can revoke invites, and the system must automatically expire invites after 48 hours.
- **FR5.3**: User is authenticated and verified via role-based access control (RBAC) securely at the API level for every request.
- **FR5.4**: Owner can deploy the platform in isolated per-instance environments (No Multi-Tenant/Cloud logic).
- **FR5.5**: **Hybrid Roles**: Admin can create custom Roles (e.g., "Subcontractor") with specific CRUD permissions.
- **FR5.6**: **Claim Logic**: Admin can toggle specific items/rows as "Claimable".
  - **Exclusive Claim**: Only one user can claim (locks row to Claimant + Admin).
  - **Multi-Claim**: Multiple users can claim (adds their UserID to the row).
- **FR5.7**: **Visibility Scope**: Users with limited roles can only view items they have "Claimed" (solving the Bid Shopping problem).
- **FR5.8**: **Gated Access (Visa)**: Admin can configure "Mandatory Onboarding Steps" (Forms/Uploads) that invited users must complete before gaining access to the Project Dashboard. System must lock access until all steps are validated.
- **FR5.9**: **Global Audit Log**: Admin (Owner) can view a site-wide chronological log of every action taken by every user (e.g., "User X updated Setting Y", "User Z deleted Project A"). This must include IP address and User Agent.

### FR6: Public Interfaces

- **FR6.1**: Admin can generate a secure, read-only "Public Link" for a Project.
- **FR6.2**: Guest encounters password protection on Public Links if configured.
- **FR6.3**: **Marketing Landing Page & SEO Strategy (`seo_strategy`)**: Public User can view a high-quality product showcase page.
  - **Meta Data**: The system must serve semantic, dynamic Title `<title>` and Meta `<meta name="description">` tags for the root domain and any public blog posts.
  - **Sitemap**: An auto-generated `sitemap.xml` must dynamically include all public-facing marketing pages.
  - **Open Graph**: Public Project Links must include rich Open Graph (`og:image`, `og:title`) tags summarizing the project state for rich previews.

### FR7: Collaboration & Action

- **FR7.1**: **Universal Assignment**: User can assign specific entities (Forms, Files, Sheet Rows) to other users.
- **FR7.2**: **Action Inbox**: User can access a dedicated "Inbox" page listing all assigned items.
- **FR7.3**: **Notification Engine**: User receives notifications (In-App, Email, Push) when an item is assigned.
- **FR7.4**: **Subscription Preferences**: User can configure granular alerts (e.g., "Notify me on New Submission").
- **FR7.5**: **Smart Linking**: User clicks notifications to open a direct link to the specific item context (e.g., opening the specific Sheet Row in the side panel).

### FR8: Advanced Automation

- **FR8.1**: **Magic Forward**: Admin can forward emails to `new@worktree.com` which the system parses via AI to auto-create Project entities with correct Templates.
- **FR8.2**: **RAG Engine**: User can submit natural language queries against indexed Project data (Forms, Chat, PDFs).
- **FR8.3**: **Contextual Compass**: Technician receives auto-launched specific Project Dashboards triggered by mobile device geofencing.

### FR11: Global AI Assistant (Agentic)

- **FR11.1**: **Persistent Chat Interface**: User can click a "Global" AI button accessible on every page.
- **FR11.2**: **Autonomous Action**: User can command the Global AI Assistant to perform multi-step actions on their behalf.
  - **Supported Actions**:
    - Update Sheet Data (e.g., "Change status of row 5 to 'Done'").
    - Form Management (e.g., "Add a 'Reason' text field to the 'Inspection' form").
    - Assignment (e.g., "Assign all open issues to Mike").
    - Route Optimization (e.g., "Re-optimize my route starting from HQ").
- **FR11.3**: **Context Awareness**: User receives AI responses contextualized to the active page (e.g., if on a Sheet, "Update this row" refers to the selected row).
- **FR11.4**: **Permission Enforcement**: User encounters strict permission enforcement when using the AI Agent; the Agent verifies authorization before execution and strictly adheres to RBAC policies.
- **FR11.5**: **UI Implementation**: User interacts with a standardized, persistent chat interface overlay during AI interactions.

### FR13: Project Calendar

- **FR13.1**: **Sheet Visualization**: User can view every "Smart Sheet" (if containing a Date column) as a monthly or weekly Calendar.
- **FR13.2**: **UI Component**: User navigates calendar data via a standardized interactive calendar view.
- **FR13.3**: **Interactivity**: User can click a calendar event to open the Sheet Row detail view (Side Panel).

### 3.4 User Management & RBAC Strategy

**Core Principle:** strict separation between "The Kingdom" (Site / SaaS Layer) and "The Castle" (Project Layer).

#### Site-Wide & Project-Wide RBAC Matrix (`rbac_matrix`)

| Role                 | Scope  | Projects           | Forms/Sheets         | Users/Invites        | Billing/System |
| :------------------- | :----- | :----------------- | :------------------- | :------------------- | :------------- |
| **Owner**            | Global | Create/Delete All  | Full Access          | Manage Admins/All    | Full Access    |
| **Site Admin**       | Global | Create/View All    | Full Access          | Manage Members       | View Only      |
| **Project Director** | Local  | Delete Own Project | Full Access          | Manage Project Users | None           |
| **Project Manager**  | Local  | View Only          | Create/Edit/Publish  | Invite to Project    | None           |
| **Foreman**          | Local  | View Only          | Edit/Submit          | None                 | None           |
| **Technician**       | Local  | View Only          | Submit (Append-Only) | None                 | None           |
| **Guest**            | Local  | View Assigned      | View/Submit Claimed  | None                 | None           |

**Role Lifecycle Rules:**

- **Creation:** New Projects are seeded with default roles (Director, PM, Tech).
- **Deletion:** Deleting a Role triggers a "Migration Modal" requiring reassignment of all affected users.
- **Revocation:** Permission changes take effect **immediately** — the server invalidates the affected session and dispatches an `auth:force_refresh` event via Redis pub-sub; the client re-validates without requiring logout.
- **Precedence:** Object Visibility (`Private`) > Role Permission (`Edit Sheet`).

### 3.5 Intelligence & Automation

> [!IMPORTANT]
> Template-defined roles are strictly _Project Scoped_. Templates cannot define or modify Global System Roles to prevent privilege escalation.

### 3.6 Platform & Device Targets (`platform_reqs`)

WorkTree is a hybrid platform serving desk-bound administrators and field technicians.

#### Browser Matrix (`browser_matrix`)

- **Tier 1 (Fully Supported & Tested):** Chrome (latest 2 versions), Safari (latest 2 versions), Edge.
- **Tier 2 (Functional, lightly tested):** Firefox.
- **Mobile Browsers:** Safari (iOS), Chrome (Android) for public links and basic viewing.

#### Mobile OS & Hardware Requirements

- **iOS:** iOS 16+ (iPhone 11 or newer recommended for complex Smart Sheets).
- **Android:** Android 11+ (4GB+ RAM recommended).
- **Offline Storage:** Minimum 500MB free required for offline sync and local media caching.

#### Native App Store Compliance (`store_compliance`)

- **Apple App Store:** Must implement Sign-in with Apple if 3rd party auth (Google/Microsoft) is active. Must not link to external payment gateways for primary SaaS subscription.
- **Google Play Store:** Must adhere to scoped storage access policies for Android 11+.

### FR15: External Compliance & Access Gates

- **FR15.1**: **Compliance Requirements**: Admin can define "Gates" for external users (e.g., "Must upload Insurance Cert", "Must sign Safety Waiver") on a per-project basis.
- **FR15.2**: **Access Control**: Guest is automatically redirected to the Compliance Wizard when attempting to view a shared item if criteria are unmet.
- **FR15.3**: **Identity Claiming**: Guest can "claim" an item if they pass the compliance gate.
  - **Verification**: Guest claiming requires Email Magic Link or Verified Account matching the invited email/contact; simple URL possession is insufficient.

### FR10: User Personalization

- **FR10.1**: **Profile Management**: User can update their "Display Name" (separate from login email).
- **FR10.2**: **Avatar Upload**: User can upload a profile photo which the platform auto-crops/resizes to optimized dimensions.
- **FR10.3**: **Theme Preference**: User can toggle between Light, Dark, or System Sync viewing modes, persisting across sessions.

### FR9: Universal Versioning (Time Travel)

- **FR9.1**: **Entity History**: User can access a full edit history for Forms, Sheets, and Routes.
- **FR9.2**: **Granularity**:
  - **Forms**: User creates a version on "Publish" (Schema Versioning).
  - **Sheets**: System version-controls operations on "Cell Edit" (Audit Log) or "Snapshot" (Time Travel).
  - **Routes**: System version-controls states on "Re-Optimization" or "Manual Reorder".
- **FR9.3**: **Restore Capability**: Admin can view previous versions and "Rollback" to a specific historical state.
- **FR9.4**: **Blame**: User can view the attributing User ID and Timestamp for every versioned edit.

### FR16: Enterprise Integrations

- **FR16.1**: **Outgoing Webhooks**: Admin can configure Outgoing Webhooks for Event Subscriptions (e.g., `submission.created`) sending JSON payloads to external URLs with retry logic.
- **FR16.2**: **API Management**:
  - **Incoming Keys**: Admin can generate hashed API Keys with precise scopes for external scripts.
  - **Outgoing Secrets**: Admin can securely save encrypted external API keys in the database.
- **FR16.3**: **Auto-Documentation**: Developer can access an automatically generated standard API specification to ensure programmatic accuracy.

### FR17: Data Lifecycle & Hygiene

- **FR17.1**: **Retention Policies**: Admin can configure TTL (Time To Live) for specific data types.
- **FR17.2**: **Storage Quotas**: User encounters hard storage caps (e.g., 5GB) where uploads exceeding the quota are rejected.
- **FR17.3**: **Project Portability**: Admin can export a Project structure to a data payload and import it into another instance.

### FR18: FinOps & Monitoring

- **FR18.1**: **Resource Budgeting**: Owner can set "Soft Caps" outlining budgets for AI Token usage and Storage.
- **FR18.2**: **Alerts**: Owner receives an email notification if a Project exceeds its monthly defined budget limit.

### FR19: Help Center & Support

- **FR19.1**: **Admin Studio**: Admin can write support articles using a collaborative Rich Text Editor.
- **FR19.2**: **Workflow**: Admin can toggle articles between DRAFT and PUBLISHED states.
- **FR19.3**: **Mobile Reader**:
  - Technician accesses cached articles for offline reading.
  - Technician can pinch-to-zoom on embedded article images.
- **FR19.4**: **Device Integration & Native Permissions (`device_permissions`)**:
  - **Feedback Loop**: User can trigger a real-time bug report form natively attached to device logs via a device "Shake" gesture.
  - **Camera & Storage**: App explicitly prompts for "Camera" and "Photos/Media" permissions to capture and attach images to Submissions/Tasks.
  - **Location (Always/In-Use)**: App explicitly prompts for "Always Allow" location permissions exclusively to trigger the "Contextual Compass" background geofencing feature (FR8.3). System degrades gracefully if denied.
  - **Push Notifications**: App explicitly prompts for Push Notifications to deliver async alerts.

### FR20: Task Management (The Query Engine)

- **FR20.1**: **Creation Workflow**: Technician can create "Draft" Tasks universally offline consisting of a localized photo and voice note.
- **FR20.2**: **Polymorphic Context**: Technician can link Tasks directly to a Sheet Region, Schedule Task, or Spec Section.
- **FR20.3**: **Ball-in-Court Logic**: User can view the "Current Assignee" attached to visual SLA indicators (Green/Yellow/Red).
- **FR20.4**: **Official Numbering**: Project Manager "Opens" a Task to generate a sequential official ID (TASK-001) distinct from field drafts.

### FR21: Specification Library (The Knowledge Base)

- **FR21.1**: **Ingestion**: Admin can upload a PDF Spec Book which the system splits into structural sections.
- **FR21.2**: **Search**: User can execute full-text search across all spec divisions.
- **FR21.3**: **Contextual Push**: User receives relevant Spec Section suggestions based on the active form context organically.
- **FR21.4**: **Offline Availability**: Technician can access parsed specification text locally while offline; images load lazily when connected.

### FR22: Schedule Management (The Metronome)

- **FR22.1**: **Import**: Admin can import standard specialized schedule files (.xml or .xer).
- **FR22.2**: **Desktop View**: Project Manager accesses a "Strategy Room" split-view containing the Gantt timeline and resource loads.
- **FR22.3**: **Mobile View**: Technician views a simplified "Task List" sorted chronologically by date on mobile.
- **FR22.4**: **Blocker Logic**: Technician interacting with an active task can initiate the "Blocker" flow which immediately generates a Task workflow.

## Non-Functional Requirements

### Mobile Performance & Reliability

- **NFR1 (Sync Resilience)**: System must support long-running background uploads (up to 30+ minutes) on intermittent connections without data corruption, measured by network disruption simulation scripts achieving 100% data recovery.
- **NFR2 (Offline Startup)**: Mobile app must load to the "Route List" in under 2 seconds while completely offline, measured via automated mobile performance testing tool.
- **NFR3 (Battery Drain)**: Background sync must not consume more than 5% battery per hour, measured by mobile OS battery profiling during a 1-hour active session test.

### Security (Self-Hosted)

- **NFR4 (Data Encryption)**: All data at rest must be encrypted using AES-256 standard, measured via compliance audit and configuration review.
- **NFR5 (Quarantine Safety)**: Quarantined submissions (sync conflicts) must be stored in a separate, encrypted local store on the device until resolved, measured via physical device inspection during sync conflict tests.
- **NFR8 (Secrets Management)**: User-provided API Keys and integrations must be encrypted at rest in the database and restricted from plain-text frontend delivery, measured by database inspection and API payload audits.

### Scalability (Project-Centric)

- **NFR6 (Large Projects)**: System must support projects with up to 10,000 form submissions without degradation of Dashboard load time beyond 2 seconds, measured by a load testing suite with 10k mock submissions.
- **NFR7 (Blueprint Rendering)**: PDF Blueprint viewer must render a 50MB vector PDF in under 3 seconds on a standard tablet interface, measured via tablet-based UI performance profiling.
- **NFR9 (Real-Time Latency)**: "Smart Sheet" cursor updates and changes must propagate to other connected users in under 200ms, measured via distributed websocket performance testing framework.

### Inclusivity & Localization

- **NFR12 (Accessibility)**: All UI components must use semantic HTML and include ARIA labels natively, measured via automated accessibility scanners (e.g., axe-core) achieving a 100% initial pass rate.
- **NFR13 (Localization)**: The platform must cleanly support dynamic language display (English, Spanish default out of box), measured via language switching UI automation tests covering all prominent interfaces.
