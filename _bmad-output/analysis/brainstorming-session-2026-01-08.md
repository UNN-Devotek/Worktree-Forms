---
stepsCompleted: [1, 2, 3]
inputDocuments: []
session_topic: "Innovation & Novelty for Worktree"
session_goals: 'Refine "Project Templates" & "Setup Wizards" into innovative differentiators'
selected_approach: "ai-recommended"
techniques_used: ["SCAMPER Method", "What If Scenarios", "Role Playing"]
ideas_generated:
  - "Project Templates: Prebuilt Forms, Sheets, Documents in a bundle"
  - "Setup To-Do List: Automated tasks for setting up a project from a template"
  - "Dynamic DNA (Project Flavors): Auto-inject compliance logic based on project type"
  - "Gated Access Wizard: Mandate subcontractor uploads (insurance/safety) before dashboard access"
  - "Magic Forward (AI Setup): Email a PDF OR raw text body to auto-create project and select template"
  - "The Contextual Compass: Auto-launch project dashboard based on Geofence"
  - "The Claim System: Item-level permissions to prevent unauthorized visibility (Bid Shopping)"
  - "Smart Upsert Engine: Excel import with Key Column matching to update live sheets"
  - "Hybrid Permission Model: Standard RBAC + Toggleable 'Claim' logic for items"
  - "Universal Assignment: Assign any entity (row/file/form) to a user"
  - "Action Inbox: Centralized notification center with push support and granular subscriptions"
  - "Universal Assignment: Assign any entity (row/file/form) to a user"
  - "Action Inbox: Centralized notification center with push support and granular subscriptions"
  - "Bulk-Paste Grid: Copy/Paste 500 rows from Excel directly into the browser"
context_file: ""
session_continued: true
continuation_date: 2026-01-08
---

## Session Overview

**Topic:** Innovation & Novelty for Worktree
**Goals:** Identify breakthrough features based on market gaps (Procore/Fieldwire/Fulcrum)

### Context Guidance

**Research Findings (2025 Market Landscape):**

1.  **The "Form-Centric" Trap**: Competitors like Fulcrum and GoCanvas are great at data collection but lack "Project Context." They are just lists of forms.
2.  **The "Giant" Trap**: Procore is widely used but too expensive and complex for small/mid-sized specialized teams.
3.  **The "Plan-Centric" Moat**: Fieldwire dominates because it centers on the _Blueprint_.
4.  **The Opportunity**: A **"Project-First"** Field OS that combines the lightweight speed of Fulcrum with the Project/Plan context of Fieldwire.

### Session Setup

We are looking for "Something New and Useful" that leverages this positioning.

## Technique Execution: SCAMPER Method

We applied SCAMPER to the "Project Templates" concept to differentiate from standard competitors.

### 1. SUBSTITUTE: "Static Copy" → "Dynamic DNA"

- **Concept**: A template isn't just a copy of files. It's a "Logic Injection".
- **The Feature**: **"Project Flavors"**. You don't pick a "template", you pick "Ingredients".
  - _Click "OSHPD (California Hospital)" Flavor_ -> Auto-injects "Seismic Compliance" fields into _every_ daily log.
  - _Click "Union Job" Flavor_ -> Auto-appends "Union Rep Signature" to every timesheet.
- **Differentiation**: Procore makes you build separate forms for everything. WorkTree _modifies_ forms based on Project DNA.

### 2. COMBINE: "To-Do List" + "Onboarding"

- **Concept**: The "Setup To-Do List" shouldn't be for the Admin. It should be for the _User_.
- **The Feature**: **"Gated Access Wizard"**.
  - You invite a Subcontractor.
  - Before they see the dashboard, they hit a **"Project Visa"** wizard.
  - Step 1: Upload Insurance. Step 2: Sign Safety Plan. Step 3: Enter Emergency Contact.
  - _Result_: Automated compliance. They don't get in until they do the work.

### 3. ELIMINATE: "Manual Entry"

- **Concept**: Why type _anything_?
- **The Feature**: **"The Magic Forward"**.
  - Forward a PDF Contract/Bid OR just the raw email body to `new@worktree.com`.
  - AI extracts: Project Name, Address, Client Name, Scope from the text.
  - Auto-creates Project. Auto-picks "Plumbing Template" based on keywords.
  - Admin just gets a notification: _"Project '742 Evergreen' created. Review now?"_

## Round 2: Mobile UX & Permissions

We applied SCAMPER to "Mobile Navigation" and "Permission Models".

### 4. REVERSE (UX): "The Contextual Compass"

- **Concept**: Reverse the navigation flow. Instead of _Menu > Project > Form_, start with _Location_.
- **The Feature**: **"Site-Aware Auto-Launch"**.
  - Mike drives onto the jobsite. App detects Geofence.
  - _Auto-opens_ the "Daily Log" and "Safety Checklist" for _that_ specific project.
  - _Result_: Zero clicks to start work.

### 5. MODIFY (Permissions): "The Claim System"

- **Concept**: Stop assigning roles to _People_, assign them to _Items_. Address the "Bid Shopping" fear.
- **The Feature**: **"Item-Level Ownership"**.
  - **The Problem**: In most apps, "Project Members" see everything. Electrical subs hate this because Plumbers can see their RFI pricing.
  - **The Fix**: A granular "Claim" model.
    - **Default**: Inherit Project Permissions (Admins see all).
    - **Claim Action**: A user "Claims" a row/item (e.g., specific RFI).
    - **Effect**: Visibility restricts _instantly_ to `[Claimant] + [Admins]`. Other "Members" are blind to it.
  - **Config**: Owners define "Role Policies" (e.g., "Subcontractor Role = Can Claim, Cannot Delete").

## Round 3: Data Handling & Advanced Permissions

### 6. MODIFY (Data): "The Smart Upsert Engine"

- **Concept**: Excel imports in most apps are "All or Nothing" (Duplicate data or Wipe data). We need "Intelligence".
- **The Feature**: **"Key-Based Upsert"**.
  - **The Workflow**: Admin uploads an updated "Material List.xlsx".
  - **The Wizard**: System asks: _"Which column is the Unique Key?"_ (e.g., 'Part Number').
  - **The Logic**:
    - **Match Found**: Updates existing row (Syncs price/qty).
    - **No Match**: Creates new row.
    - **New Column**: Detects "Vendor Notes" column in Excel? Adds it to the Live Sheet.
  - **The Tech**: Real-time sync (CRDT-like experience) similar to Google Sheets.

### 7. COMBINE (Permissions): "The Hybrid Model"

- **Concept**: RBAC is too rigid (Admins/Members). "Claims" are too loose. Combine them.
- **The Feature**: **"RBAC + Claim Toggles"**.
  - **Layer 1 (The Foundation)**: **Standard RBAC**. Project Manager creates custom roles (e.g., "Field Engineer", "Client", "Subcontractor") with CRUD permissions.
  - **Layer 2 (The Interaction)**: **"Claimable" Toggles** on Items.
    - PM sets an item type (e.g., "Shift Openings") to **"Claimable: Multi"**.
    - Users with "Field Engineer" role can click "Claim".
    - Result: Their UserID is stamped on the row.
  * **Layer 3 (The Exclusivity)**: PM sets "Defect" to **"Claimable: Unique"**.
    - Once "Sub A" claims it, "Sub B" sees it as "Locked/Taken".

## Round 4: Assignments & Notifications

### 8. ADD (Collaboration): "Universal Assignment & Inbox"

- **Concept**: Stop relying on email. Everything in the system should be assignable.
- **The Feature**: **"Universal Action"**.
  - **Assignment**: Any entity (Sheet Row, Form, PDF, Photo) can be assigned to a User.
  - **The Inbox**: A dedicated "Inbox" page showing all assigned items with status.
  - **Notifications**:
    - **Push**: Web Push (PC) and Mobile Push.
    - **Subscriptions**: Users configure triggers: "Notify me on New Submission", "Notify me on Sheet Edit", etc.

## Session Conclusion

We have successfully refined the "Project Templates" idea into 3 specific, high-value competitive differentiators.

**Next Steps:**

1.  Update PRD Innovation Section with "Dynamic DNA" and "Gated Access".
2.  Add "Magic Forward" to Phase 3 (AI) Roadmap.
    - **Notifications**:
      - **Push**: Web Push (PC) and Mobile Push.
      - **Subscriptions**: Users configure triggers: "Notify me on New Submission", "Notify me on Sheet Edit", etc.

## Round 5: Admin & Power Tools

### 9. ROLE PLAY (Efficiency): "The Bulk-Paste Grid"

- **Persona**: Sarah (PM) hates "Import Wizards" (Mapping columns is slow).
- **The Feature**: **"Excel-Native Web Grid"**.
  - **Action**: Sarah highlights 500 rows in Excel. Ctrl+C.
  - **Destination**: Clicks the top-left cell in WorkTree Smart Sheet. Ctrl+V.
  - **Result**: Browser parses the clipboard, creates 500 rows instantly.
  - **Logic**: If Column A matches "Part ID", it updates. If not, it creates.

## Session Conclusion
