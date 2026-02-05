---
stepsCompleted: []
inputDocuments:
  - planning-artifacts/autodesk-build-analysis.md
workflowType: "research"
lastStep: 1
research_type: "technical"
research_topic: "Worktree Systems Implementation"
research_goals: "Technical feasibility, architecture decisions, and implementation approaches for RFI, Specification, and Schedule systems"
user_name: "White"
date: "2026-01-12"
web_research_enabled: true
source_verification: true
---

# Research Report: technical

**Date:** 2026-01-12
**Author:** White
**Research Type:** technical

---

## Research Overview

[Research overview and methodology will be appended here]

---

## Technical Research Scope Confirmation

**Research Topic:** Worktree Systems Implementation
**Research Goals:** Technical feasibility, architecture decisions, and implementation approaches for RFI, Specification, and Schedule systems

**Technical Research Scope:**

- Architecture Analysis - design patterns, frameworks, system architecture
- Implementation Approaches - development methodologies, coding patterns
- Technology Stack - languages, frameworks, tools, platforms
- Integration Patterns - APIs, protocols, interoperability
- Performance Considerations - scalability, optimization, patterns

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Special Focus:** Thoughtful UI integration of these complex systems.

**Scope Confirmed:** 2026-01-12

## Technology Stack Analysis

### Programming Languages

**TypeScript** is the definitive choice for this implementation, aligning with the existing React/Node.js stack.

- **Frontend**: TypeScript with React.
- **Backend**: TypeScript with Node.js/NestJS.
- **Reasoning**: Type safety is critical for complex data models like RFI "Ball-in-Court" logic and Gantt dependency chains.

### Development Frameworks and Library

#### Schedule System (Gantt)

- **SVAR React Gantt**: A strong open-source/commercial hybrid. Native React, high performance, and supports dependencies ("finish-to-start").
- **Bryntum Gantt**: The enterprise gold standard. Expensive but includes "MS Project" level features (critical path, resource leveling) out of the box.
- **Recommendation**: Start with **SVAR** for MVP; upgrade to **Bryntum** if advanced scheduling (e.g., resource histograms) is needed.

#### Specification System (OCR & Parsing)

- **Tesseract.js**: The go-to library for pure JS OCR. Can run in a Web Worker to parse scanned specs without blocking the UI.
- **pdfjs-dist**: Essential for rendering PDFs in the browser to allow "Pinning" context.
- **pdf-parse**: For server-side extraction of text-native PDFs (faster than OCR).

### Database and Storage Technologies

#### RFI System (Relational)

- **pattern**: Traditional Relational Model.
  - `RFIs` table (Stats, Due Date, Assignee).
  - `RFI_Activity_Log` (Audit trail).
  - `RFI_Associations` (Polymorphic links to Sheets, Schedule Tasks).

#### Offline Architecture (Field Data)

- **PowerSync**: A modern "sync engine" that keeps a local SQLite DB in sync with Postgres. ideal for "Offline First" RFI creation.
- **RxDB**: An alternative NoSQL browser database that syncs with various backends.
- **Recommendation**: **PowerSync** fits the "Postgres as Source of Truth" architecture best.

### Development Tools and Platforms

- **PDF Manipulation**: `react-pdf` for viewing; `pdf-lib` for manipulating (e.g., stamping "APPROVED" on an RFI attachment).
- **State Management**: `TanStack Query` (React Query) is essential for managing server state and optimistic updates (e.g., creating an RFI while offline).

### Cloud Infrastructure and Deployment

- **OCR Processing**: For heavy spec books (1000+ pages), client-side OCR might kill the browser.
- **Pattern**: Offload Spec parsing to a **Node.js Worker Queue** (BullMQ) or a Serverless Function to keep the main thread responsive.

## Integration Strategy (Party Mode Review)

### Session Participants

- **John (PM):** Focus on Value & "Muddy Thumb" Usability
- **Sally (UX):** Focus on Interaction Flows & Visuals
- **Winston (Architect):** Focus on System Structure & Templates

### 1. John (Product Manager) - "The Field Reality"

_Goal: Ensure these new heavyweight features don't destroy our lightweight 'Speed' value prop._

1.  **Stop the "List of Lists":** We cannot just add a "Schedule" tab and an "RFI" tab. The Field Home page must aggregate "critical path" items. If a Schedule task is "Due Today", it appears on the Home Feed, not buried in a Gantt chart.
2.  **RFI "Draft" Buffer:** Field techs in the rain don't write perfect RFIs. We need a "Quick Snap" feature: Photo + Voice Note -> Save as "Draft RFI". The Office Admin cleans it up later.
3.  **Contextual "Why":** When a tech opens a form to "Pour Concrete", the system should auto-show the relevant Spec Section (03 30 00) for "Concrete Cure Times" right there. Don't make them search for it.
4.  **No Gantt on Mobile:** Do not try to render a full Gantt chart on a phone. The mobile view of "Schedule" should just be a sorted list: "This Week's Tasks".
5.  **"Blocker" Button:** On any task (Map Pin or Schedule Bar), add a big красное button: "I am Blocked". This auto-starts an RFI draft linked to that task.
6.  **Spec Search is a Feature:** The search bar on the dashboard must search Specs, not just Project Names. If I type "rebar spacing", I want the spec paragraph immediately.
7.  **Template Strategy:** We sell specific workflows (e.g., "Plumbing Install"). Our Project Templates must come pre-loaded with the standard "Plumbing Specs" and "Standard Rough-in Schedule".
8.  **"Ball-in-Court" Clarity:** The UI must scream _WHO_ is holding up an RFI. Is it the Architect? The Owner? Green/Red traffic lights on the RFI list.
9.  **Offline Reality:** If I download a project, I need the Specs downloaded too. They are static text; they should be available 100% offline.
10. **Billing Connection:** Eventually, these Schedule % completes need to drive the Pay Application. Keep that data clean.

### 2. Sally (UX Designer) - "Visual Flow"

_Goal: thoughtful integration, not just bolting on modules._

1.  **New Page: "The Strategy Room" (Schedule):** A split-screen Desktop view. Top half = Gantt visual. Bottom half = "Resource Load" (who is overworked?).
2.  **New Page: "The Library" (Specs):** Don't look like a PDF viewer. Parse the specs into a "Book Reader" view. sidebar chapters, clean typography, yellow highlighting capability.
3.  **Integration: The "Pin" Action:** We need a universal "Pin" gesture.
    - Long-press on Map = Pin Issue.
    - Right-click on Gantt Bar = Pin RFI.
    - Highlight Text in Spec = Pin Clarification.
4.  **The "Slide-Over" Context:** When viewing a Gantt bar, clicking details shouldn't navigate away. Use a "Sheet" or "Slide-over" panel so the user keeps the timeline context while reading the details.
5.  **Color Semantics:**
    - **Blue:** Planned (Schedule)
    - **Green:** Active/Done
    - **Red:** Blocked (RFI/Issue)
    - **Yellow:** Pending Review (Submittal)
      Make this consistent across Map and Schedule.
6.  **Empty States:** When a new project starts, the "Schedule" shouldn't be blank. It should ask: "Import from P6" or "Use Wizard".
7.  **Mobile Navigation:** "Specs" and "RFIs" might be too deep for the bottom tab bar. Put them in the "Project Menu" (More) to keep the 4 main tabs focused on _Execution_.
8.  **Loading Skeletons:** Parsing a 500-page Spec book takes time. Show a "Scanning Document..." progress bar with meaningful steps ("Finding Concrete Section...") to keep trust.
9.  **"Mention" Interactions:** In an RFI chat, allow `@Spec:033000` to create a hyperlink to that specific spec section.
10. **Feedback Loops:** When an RFI is closed, trigger a confetti animation or "Problem Solved" visual to reward the tech.

### 3. Winston (Architect) - "Structured Backbone"

_Goal: Scalable data models and reusable templates._

1.  **Entities & Associations:** We need a polymorphic `EntityLink` table. An RFI must be able to link to `TaskID`, `LocationID`, or `SpecSectionID` without tight coupling.
2.  **Spec Parsing Pipeline:** Do _not_ parse Specs on the main server thread. Use a BullMQ worker. Store the parsed text in Postgres `tsvector` for full-text search.
3.  **Template System Upgrade:**
    - **Current:** `project.json` (Forms, Locations).
    - **New:** `project_template.zip` containing:
      - `specs/`: Default PDF spec books.
      - `schedule.json`: Standard task template with relative day offsets (Day 1, Day 5).
      - `forms/`: Existing form definitions.
4.  **"Shadow" Sync:** For offline specs, we should replicate the parsed spec text into the local SQLite DB. It's just text; it compresses well.
5.  **Audit Log Immutability:** Use a "Command Pattern" for RFIs. `CreateRFI`, `UpdateRFIStatus`. Do not just CRUD update the row. We need the history for legal disputes.
6.  **Gantt Data Model:** Do not blindly copy P6 complexity. Use a simplified "Activity on Node" model. `Task { id, duration, predecessors[] }`.
7.  **Permissions Layer:** RFIs need distinct permissions. `RFI_CREATOR` (Tech), `RFI_MANAGER` (PM), `RFI_REVIEWER` (Architect). This is granular RBAC.
8.  **API "Bridge":** We will need an endpoint `POST /api/import/schedule` that accepts `.xml` (MS Project) or `.xer` (Primavera) files and converts them to our JSON model.
9.  **Performance:** If a project has 5,000 tasks, the Gantt component needs "Windowing" (Virtual Scroll). Render only what is visible.
10. **Single Source of Truth:** The "Due Date" on a Form must be driven by the "Schedule Task" date. If the Schedule moves, the Form Due Date moves. Secure that link.

## Implementation Specifications (Team Deep Dive)

### 1. Database Association Pattern (Amelia - Dev)

_Problem: How do we link an RFI to a Schedule Task OR a Sheet Region OR a Spec Section?_

**Proposed Pattern: Polymorphic via Association Table**
Prisma does not support native polymorphism. We will use an intermediate `EntityLink` table.

```prisma
// schema.prisma

model RFI {
  id          String       @id @default(cuid())
  entityLinks EntityLink[] // One RFI can have multiple context links
}

model ScheduleTask {
  id          String       @id @default(cuid())
  entityLinks EntityLink[]
}

model SpecSection {
  id          String       @id @default(cuid())
  entityLinks EntityLink[]
}

// The Polymorphic Joint Table
model EntityLink {
  id        String   @id @default(cuid())

  // The "Parent" (What is being linked?)
  rfiId     String?
  rfi       RFI?     @relation(fields: [rfiId], references: [id])

  // The "Target" (What is it linked TO?)
  scheduleTaskId String?
  scheduleTask   ScheduleTask? @relation(fields: [scheduleTaskId], references: [id])

  specSectionId  String?
  specSection    SpecSection?  @relation(fields: [specSectionId], references: [id])

  // Metadata
  createdAt DateTime @default(now())

  // Check constraint (db level) ensures only ONE target is set per row
}
```

### 2. Specification Parsing Pipeline (Winston - Architect)

_Problem: Parsing a 500-page PDF kills the main thread. It must be backgrounded._

**Architecture Pattern: BullMQ + Worker**

1.  **Producer (API):**
    - User uploads PDF (`/api/specs/upload`).
    - Server saves to MinIO/S3.
    - Server adds job to Redis: `specQueue.add('parse-pdf', { fileKey: 'abc.pdf', projectId: '123' })`.
2.  **Consumer (Worker):**
    - Downloads PDF.
    - Uses `pdf-parse` (fast text) or `tesseract.js` (OCR if scanned).
    - Splits text by Regex (e.g., `^SECTION [0-9]{2} [0-9]{2}`).
    - Bulk inserts `SpecSection` rows into Postgres.
3.  **Frontend Notification:**
    - Uses Server-Sent Events (SSE) or Polling: "Processing Specs... 45%".

### 3. Offline Data Architecture (PowerSync)

_Problem: Techs need `SpecSection` data while in a basement with no signal._

**Stack: PowerSync + SQLite**

1.  **Backend Connector:** A Node.js endpoint streams changes from Postgres `SpecSection` table to the PowerSync service.
2.  **Client (React Native):**
    - PowerSync SDK maintains a local `sqlite` replica.
    - Specs are just text. 1000 pages of text = ~2MB. Trivial to sync.
3.  **Usage:**
    `const specs = usePowerSync.watch('SELECT * FROM spec_sections WHERE section_code LIKE ?', ['03 30%'])`
    - _Result:_ Instant, zero-latency search results in the field.

## Performance Strategy (Non-Functional Requirements)

### 1. Large Dataset Handling (Gantt)

- **Issue:** Rendering 5,000+ schedule tasks causes DOM lagging.
- **Solution:** **Windowing (Virtualization)**. Use `react-window` or the built-in virtualization of SVAR/Bryntum. Only render the 30 rows visible in the viewport.
- **Data Transport:** Use `protobuf` or compressed JSON for the Schedule API payload to reduce wire size by ~60%.

### 2. Optimistic UI (Offline Actions)

- **Issue:** creating an RFI while offline feels "broken" if the UI doesn't react.
- **Solution:**
  - **Immediate Feedback:** "RFI #DRAFT-1 created". Add to local Redux/Query state immediately with a "Pending Sync" icon.
  - **Background Sync:** PowerSync handles the push when online.
  - **Conflict:** If ID #123 is taken by the server, PowerSync handles ID remapping or we use UUIDs (CUIDs) client-side to avoid collisions.

### 3. Binary Asset Optimization

- **Issue:** User downloads "All Project Specs" (500MB).
- **Solution:**
  - **Text First:** Sync the parsed _text_ (Postgres) first (~2MB) so they can search/read immediately.
  - **Lazy Binary:** Only download the PDF pages _on demand_ or if "Make Available Offline" is explicitly tapped.

<!-- Content will be appended sequentially through research workflow steps -->
