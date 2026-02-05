---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - research/detailed-library-research.md
  - research/technical-PRD-Feasibility-research-2026-01-08.md
  - research/technical-open-source-frameworks-research-2026-01-08.md
  - prd.md
  - architecture.md
  - ux-design-specification.md
  - docs/minio-guide.md
date: 2026-01-09
author: White
---

# Product Brief: Worktree

> [!NOTE]
> Part of the **[Worktree Project Plan](./project-context.md)**.
> **Role:** Defines **WHY** we are building this.
> **Source:** `product-brief-Worktree-2026-01-09.md`

## Executive Summary

WorkTree is a self-hosted "Project Operating System" designed to bridge the critical gap between back-office planning and front-line execution. It unifies the flexibility of a smart spreadsheet with the usability of a native mobile app, allowing data to flow seamlessly between the office and the field. Built specifically for construction and field service teams, it prioritizes "Muddy Thumb" usability—ensuring that field technicians can capture high-quality data in rain, glare, or with gloves, without fighting the interface.

---

## Core Vision

### Problem Statement

Construction and field operations suffer from a fundamental "Data Disconnect." Project Managers live in flexible tools like Excel or Project Management software, while Field Technicians are forced to use rigid Form Builders or disconnected Paper processes. This separation creates a barrier where "Planning" does not translate to "Execution," and "Execution Data" requires manual re-entry to become useful for "Planning."

### Problem Impact

- **Technicians:** Are frustrated by desktop-first tools that are unusable on a rooftop in the rain, leading to shortcuts, poor data quality, or non-compliance.
- **Project Managers:** Waste hours manually collating PDF form submissions into spreadsheets to track project status.
- **Business:** Loses "Real-Time Truth" because field data is trapped in silos (Email, PDF, paper) rather than flowing instantly into the project tracking system.

### Why Existing Solutions Fall Short

- **Standard Form Builders (e.g., SurveyJS):** are good for data collection but lack the "Project Context"—they don't know that _this_ submission belongs to _that_ blueprint location.
- **Spreadsheets (Excel):** are the gold standard for management but impossible to use on a mobile phone in the field.
- **Field Service SaaS (e.g., ServiceTitan):** are expensive, bloated, and force rigid workflows that don't match unique project needs.

### Proposed Solution

Worktree provides a unified environment where a **Row in the Spreadsheet** _is_ a **Form on the Mobile App**. By creating a "Project-Centric" database, we allow the office to manage work in bulk (Spreadsheet View) while the field executes work with zero friction (Mobile Card View). The system is backed by a robust offline-sync engine that guarantees data integrity even in dead zones.

### Key Differentiators (Refined)

1.  **"Muddy Thumb" Usability:** A relentless focus on field reality. **Minimum 44px (ideally 60px) touch targets**, **High-Contract Day Mode** (no greyscale) for sunlight visibility, and **One-Thumb Reach** patterns (FABs) for all primary actions.
2.  **Project-Centric Architecture:** Data is partitioned by Project, simplifying permissions and enabling "God View" dispatching on a map.
3.  **Active Blueprints:** Blueprints are navigation interfaces. Tapping a location launches the workflow.
4.  **Route-Aware Execution:** Route planning is tightly coupled with forms/sheets.
5.  **Offline-First & Conflict Aware:** Uses "Delta Sync" (<5% battery drain) and "Long-Lived Tokens" (30 days) to ensure WorkTree works when the internet doesn't.

## Target Users

### Primary Users

#### Mike (The Field Technician)

- **Role:** Hands-on executor. often working in rain, sun, or poor connectivity.
- **Pain Point:** Hates "admin apps" that delete work. Wants to finish and go home.
- **Success Vision:** "I open the app, it knows where I am (Contextual Compass), I tap one big button, take a photo (Instant Shot), and my log is done."

#### Sarah (The Operations Dispatcher)

- **Role:** Conductor of the orchestra. Needs "God View" of the project.
- **Pain Point:** Drowning in disconnected spreadsheets.
- **Success Vision:** "I see every status in real-time. I can dispatch a new job with drag-and-drop. I can export reports that match our accounting/billing formats perfectly."

### Secondary Users

#### The "Foreman" (Hybrid User)

- **Role:** Half-Admin, Half-Tech. Uses iPad/Tablet.
- **Need:** Needs to approve Mike's work 'in the field' before it syncs to Sarah.

#### The Subcontractor (Guest User)

- **Role:** Temporary worker.
- **Constraint:** "Visa Gate" access control. Strictly limited visibility.

### User Journey (The "Muddy Thumb" Flow)

1.  **Arrival:** Mike pulls up. **Contextual Compass** detects location.
2.  **Auto-Launch:** App presents "Site Daily Log" dashboard. No searching.
3.  **Execution:** Tap "Safety Check." Mark "Pass." Snap photo (**Instant Shot** - no review loop). Sign.
4.  **Sync:** "Submit." App saves locally (**Non-Blocking** success msg). Syncs automatically when 5G returns.

## Success Metrics

### User Success Outcomes

1.  **Data Integrity (Trust):** Zero data loss during offline-to-online sync. 100% success in "Tunnel Tests."
2.  **Speed of Operations:** "Time to Publish" a new form type < 15 minutes.
3.  **Adoption Rate:** >80% DAU/MAU ratio. Field Techs use it voluntarily for notes (Viral Loop).

### Business Objectives

1.  **Tool Consolidation:** Replace 3 disjointed tools (Forms, Routing, Cloud Storage).
2.  **Operational Velocity:** Reduce "Time to Invoice" by 50% via instant data availability and correct export formats.
3.  **Support Efficiency:** Reduce "Where is the form?" calls by 90% via Help Center/Self-Service.

### Key Performance Indicators (KPIs)

- **Sync Reliability:** 99.9% success. **Conflict Resolution:** "Field Wins" or manual merge UI.
- **Battery Efficiency:** <5% drain/hr.
- **Performance:** Dashboard loads 10,000 records in < 2 seconds. **Global Search** < 200ms.
- **Feedback Vol:** >5 "Shake to Report" bugs/suggestions per week (Active Feedback Loop).

## MVP Scope

### Core Features (Day 1 Release)

1.  **Smart Spreadsheets (Real-Time):** "Google Sheets" style interface with Row locking and Presence indicators.
2.  **Field-First Mobile App:** PWA/Native shell with **Offline Sync**, **High-Contrast Mode**, and **Large Touch Targets**.
3.  **Visual Form Builder:** Drag-and-drop editor rooted in JSON Schema.
4.  **Project Maps & Routing:** Visual dispatch map with **Cluster Pins** (to handle 10k+ records).
5.  **Project Maps & Routing:** Visual dispatch map with **Cluster Pins** (to handle 10k+ records).
6.  **Help Center Studio (Knowledge Base):**
    - **Admin Editor:** **Plate.js** integration for Rich Text editing (Bold, Lists, Images).
    - **Workflow:** **Draft vs. Published** states. Admins draft; Techs only see Published.
    - **Mobile Reader:** Optimized **Read-Only** view with offline caching and **Pinch-to-Zoom** images.
    - **Category Management:** Organize articles by tags/folders (e.g., 'Safety', 'Timesheets').
    - **Feedback Loop:** "Shake to Report" with device logs.
7.  **Self-Hosted Infrastructure:** Docker Compose (Prod ready), **Max 2GB RAM** footprint, **MinIO** storage with Quotas/Auto-compression.
8.  **Self-Hosted Infrastructure:** Docker Compose (Prod ready), **Max 2GB RAM** footprint, **MinIO** storage with Quotas/Auto-compression.

### Implementation Constraints (Party Mode "Hardening")

- **Sync:** Delta Sync protocol only.
- **Images:** Client-side resize (Max 2MP) before upload to save bandwidth/storage.
- **Auth:** Long-lived tokens (30 days) for offline persistence.
- **Search:** Postgres FTS (tsvector) for Global Search (No AI vector yet).
- **Backups:** Automated `pg_dump` cron job included in MVP image.
- **Empty States:** Robust "First Run" experience with Seed Data/Demo Project.
- **Rate Limiting:** `upstash/ratelimit` or Redis-backed limiting on API routes.
- **Error Handling:** Non-blocking UI for offline errors ("Will retry later").

### Out of Scope for MVP

- **Public Client Portal:** Read-only links (Phase 2).
- **Advanced AI Agents:** Autonomous action-takers (Phase 2).
- **Complex Invoicing:** No Stripe/Payment processing.
- **Live Chat Support:** No Intercom integration (Use Async Form).
- **Video Uploads:** Photos only for MVP (Storage/Bandwidth risk).

### MVP Success Criteria

- **Users:** Admin + 4 Techs run full ops for 1 week.
- **Tech:** Sync propagates < 1s. App launches correct project via Geofence 100%.
- **Support:** Field Techs can solve 80% of "How do I?" questions via the Help Center without calling Admin.

### Future Vision

- **Project OS:** Complete ERP replacement.
- **AI Foremen:** Autonomous scheduling.
- **Blueprints First:** Map/Plan becomes the only UI needed.
