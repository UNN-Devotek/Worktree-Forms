---
analysis_target: Autodesk Build
research_date: 2026-01-12
focus_areas:
  - Feature Set
  - UI/UX Patterns
  - Mobile/Field Experience
  - Comparison to Worktree Vision
  - Deep Dive: RFIs, Specs, Schedule
---

# Autodesk Build: Comprehensive Analysis

## Executive Summary

Autodesk Build is a heavyweight, enterprise-grade construction management platform that unifies field execution with project management. It sits within the "Autodesk Construction Cloud" (ACC) ecosystem. Its primary design philosophy is **"Single Source of Truth,"** prioritizing centralization of massive datasets (BIM models, thousands of sheets, millions of dollars in contracts) over speed or simplicity.

**Relevance to Worktree:**
While Worktree targets the "Muddy Thumb" simplicity for field techs, Autodesk Build targets the trusted execution of complex, multi-stakeholder workflows. It is the "Golfer vs. Tennis Player" comparison—Autodesk is the country club; Worktree is the public putting green.

---

## 1. User Interface (UI) & Navigation

The UI is dense, data-rich, and desktop-first, with a companion mobile app that simplifies specific workflows.

### A. Web Interface (The "Command Center")

- **Layout Structure:**
  - **Left-Hand Navigation (The "Taskbar"):** A persistent, dark-themed sidebar containing all module links. It is collapsible to maximize screen real estate for drawings/models.
    - _Top Section:_ Project Home, Sheets, Files, Issues, Forms, Photos.
    - _Middle Section:_ RFIs, Submittals, Meetings, Schedule, Assets.
    - _Bottom Section:_ Cost Management, Insight (Analytics), Admin.
  - **Project Picker:** Located at the top-left, allowing rapid switching between projects.
  - **Main Workspace:** The large central area displays grids (Excel-like), Viewers (PDF/BIM), or Dashboards.

- **Dashboard ("Project Home"):**
  - **Card-Based Design:** The landing page is a grid of customizable "Cards."
  - **Key Cards:**
    - **"Project Work":** A summary of overdue/upcoming items assigned to the user.
    - **"Site Weather":** Current conditions.
    - **"Recent Sheets":** Quick links to recently viewed drawings.
    - **"Quick Links":** Direct shortcuts to specific sheets or forms.
  - **Insight Dashboard:** A separate analytics view with PowerBI-style visualizations (bar charts, pie charts) for cross-project metrics.

### B. Mobile Interface (The Field View)

The mobile app (Autodesk Construction Cloud app) is distinct from the web view, focusing on **consumption and capture**.

- **Home Screen:**
  - Simplified "Cards" showing **"Assigned to Me"** items to reduce noise.
  - Big buttons for high-frequency actions: "Sync Status," "Download Project."
- **Navigation:**
  - Bottom Tab Bar: Home, Sheets, Files, More (Menu).
- **Sheet Viewer:**
  - The core field experience. Users click pins on a PDF drawing to open Issues or Photos.
  - **Interaction:** Pinch-to-zoom, tap-to-pin.

---

## 2. Core Feature Analysis

### A. Project Management & Field Execution

| Feature    | Functionality                                                        | UI Pattern                                                                          |
| :--------- | :------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| **Sheets** | Hosting & viewing of 2D blueprints. OCRs title blocks automatically. | Split view: Sheet list on left, viewer on right. Version control slider at top.     |
| **Issues** | Centralized tracking of defects/tasks.                               | Push-pins dropped on sheets. Pop-over modal for details (Status, Assignee, Photo).  |
| **Forms**  | Digital checklists (Safety, QA/QC).                                  | List view of templates. "Fillable PDF" style interface. Signatures via touchscreen. |
| **RFIs**   | Formal Q&A process tracking.                                         | Kanban board or List view. Defined workflow (Creator -> Manager -> Reviewer).       |
| **Photos** | Jobsite gallery with GPS tagging.                                    | Gallery grid. Map view showing photo locations.                                     |
| **Assets** | Equipment lifecycle tracking (Install -> Start-up).                  | QR Code scanner in mobile app opens asset detail card.                              |

### B. Cost & Control (Office Heavy)

- **Budget Management:** Excel-like grid monitoring codified budget lines.
- **Change Orders:** Workflow-driven process to approve cost changes. Visual "toggles" for upstream/downstream impact.
- **Pay Applications:** Digitized billing workflow.

### C. "Connected Data" (Differentiation)

- **Model-Based Work:** Users can view a 3D BIM model on an iPad, tap a wall, and see its installation status color-coded.
- **Bridge:** A unique feature allowing data to be "piped" between different companies' Autodesk accounts (e.g., General Contractor sharing specific folders with a Subcontractor).

---

## 3. Critical Critique vs. Worktree Vision

### Strengths (What they do well)

- **Visual Context:** Dropping a pin on a blueprint (Sheet) is the ultimate context. You know _exactly_ where the issue is.
- **Audit Trail:** Every action is immutable. The "Activity Log" is exhaustive.
- **Ecosystem:** The integration with Revit/AutoCAD is seamless for design updates.

### Weaknesses (The "Worktree Opportunity")

- **Complexity:** It requires a VDC Manager just to set it up. It is "Click Heavy."
- **Offline Friction:** syncing gigabytes of models/sheets takes time. If the sync fails, the tech is dead in the water.
- **Rigidity:** Workflows (like RFIs) are hard-coded to industry standards (AIA). You cannot just "invent" a new workflow easily like in a spreadsheet.
- **"The List of Lists":** The UI often devolves into managing endless lists of IDs (Issue #405, RFI #021) rather than a holistic view of the work.

### UI Opportunities for Worktree

- **"Map First" vs "Sheet First":** Autodesk is heavily tied to _Sheets_ (PDFs). Worktree's "Contextual Compass" and Map focus is better for civil/site work where "A101" isn't the only reality.
- **Speed:** Autodesk has loading spinners. Worktree's precise "Instant Shot" and local-first DB should feel instantaneous by comparison.
- **Flexibility:** Autodesk = "Here is the RFI tool." Worktree = "Build the tool you need (Rows/Forms)."

---

## 4. Key Takeaways for Brainstorming

1.  **The "Pin" Paradigm:** We should steal the _concept_ of pinning data to context (Location/Map), but make it faster.
2.  **Dashboard Cards:** The concept of "My Work" cards is effective for focusing technicians. We should adapt this.
3.  **Color Coding:** Autodesk uses color heavily in models to show status. We can apply this to our "Smart Grid" rows (Green = Done, Red = Blocked).

---

## 5. Feature Deep Dive: RFIs, Specs, Schedule

### A. RFIs (Request for Information)

- **Workflow:** Implements a rigid "Ball-in-Court" model (Creator → Manager → Reviewer → Distribution). This ensures accountability but adds friction.
- **UI Structure:**
  - **List View:** Split view (list on left, details on right) or standard grid. Columns for "Status", "Ball in Court", "Due Date", and "Cost/Schedule Impact".
  - **Detail Context:** The right-hand detail pane is critical. It allows users to see the RFI question while simultaneously scrolling through linked **Sheets**, **Photos**, and **PCOs** (Potential Change Orders) without leaving the page.
  - **Mobile Entry:** "Draft Mode" allows field techs to capture a question on-site (with photos) and save it. It doesn't become an "Official RFI" until a Manager reviews and submits it, preventing low-quality spam.
- **AI Integration:** "Construction IQ" attempts to auto-tag RFIs and predict high-risk items.

### B. Specifications Tool

- **Problem Solved:** Converting a static, 1000-page PDF spec book into a searchable, actionable database.
- **UI Features:**
  - **Smart Parsing:** Users upload a raw PDF. The system (AutoSpecs) uses OCR/AI to auto-detect section headers (e.g., "03 30 00 Cast-in-Place Concrete") and splits the document into hundreds of individual, searchable sections.
  - **Searchability:** Field users can type "cure time" and instantly jump to the specific paragraph in section 03 30 00, rather than scrolling through a massive file.
  - **Submittal Registry:** It auto-extracts required submittals (e.g., "Submit concrete mix design") from the text and populates the Submittals log.

### C. Schedule Tool

- **Visualization:** Offers a standard Gantt Chart view but enhances it with a "List View" for non-schedulers.
- **Dependency Tracking:**
  - Visual lines connect tasks in Gantt view.
  - **Conflict Detection:** The system flags "Dependency Violations" (e.g., Task B starts before Task A finishes) with red alerts.
- **Contextual Links:**
  - This is the "Killer Feature." You can attach an **RFI**, **Issue**, or **Photo** directly to a Schedule bar. e.g., "Why is 'Pour Concrete' delayed? Click the bar -> See linked RFI #15 regarding rain delay."
- **Mobile Work Plan:**
  - Field Foreman view. It strips away the Gantt complexity and just shows a list: "Here is what you need to do this week."
