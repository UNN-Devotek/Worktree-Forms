# Project Context: Worktree

> [!IMPORTANT]
> **This is the Source of Truth.**
> All other documents are specialized views of the data indexed here.
> _Last Updated: 2026-01-13_

## 1. Executive Summary & Vision

**Worktree** is a self-hosted "Project Operating System" for field operations. It bridges the gap between back-office planning (Spreadsheets) and front-line execution (Mobile Forms).

- **Core Philosophy:** "Muddy Thumb" Usability.
  - If a technician cannot use it with one hand, in the rain, wearing gloves, **it is out**.
  - If an admin cannot execute a workflow in under 3 clicks, **it is too slow**.
- **The "One-Database" Promise:**
  - A Row in the spreadsheet = A Form on the phone = A Pin on the map.
  - Zero silos. Real-time sync.

## 2. Master Documentation Index

| ID     | Document Name                                                | Purpose                                                         | Audience           |
| :----- | :----------------------------------------------------------- | :-------------------------------------------------------------- | :----------------- |
| **00** | **[Project Context](./project-context.md)**                  | **You Are Here.** Global rules, index, and constraints.         | **ALL**            |
| **01** | **[Product Vision](./product-brief-Worktree-2026-01-09.md)** | High-level "Why", Market Fit, and Success Metrics.              | PM, Owner          |
| **02** | **[Product Requirements (PRD)](./prd.md)**                   | **WHAT** we are building. User Journeys, Functional Specs.      | Dev, PM, QA        |
| **03** | **[System Architecture](./architecture.md)**                 | **HOW** we build it. Tech Stack, Schema, API, Security.         | Dev, DevOps        |
| **04** | **[UX Design Spec](./ux-design-specification.md)**           | **LOOK & FEEL**. Component library, Visual Flows, Interactions. | Designer, Frontend |
| **05** | **[Research: Autodesk](./autodesk-build-analysis.md)**       | Competitive Analysis & Inspiration.                             | PM, Design         |

## 3. Global Project Constraints

### A. Technical Constraints

1.  **Self-Hosted Specificity:** Must run on a single VPS (Docker Compose). No Cloud-Native dependencies (AWS/Azure specific services) unless abstracted.
2.  **Resource Efficiency:** Max 4GB RAM footprint for the entire stack.
3.  **Offline-First:** The Mobile App MUST function 100% offline. Sync is an enhancement, not a requirement for usage.

### B. Design Constraints

1.  **Touch Targets:** Minimum **44px** (ideally 60px) for all field interactions.
2.  **Contrast:** "Day Mode" must be visible in direct sunlight (High Contrast).
3.  **Keyboard First:** Admin dashboard must be navigable via Keyboard Shortcuts.

### C. Implementation Rules (The "Law")

1.  **The Feature Rule:** All logic lives in `src/features/{domain}`. No loose files in `src/components` unless generic UI.
2.  **Verify Before Build:** Do not write code until the **Architecture** for that feature is approved in `architecture.md`.
3.  **Strict Types:** `noImplicitAny` is ON. Zod schemas required for ALL API inputs.

## 4. Current Phase: Implementation Readiness

We have consolidated the Product Plan and defined the Architecture.
**Next Step:** Execute against the **[Task Manifest](./tasks.md)** derived from the Epics.
