# Story 11.1: Help Article Editor

Status: done

## Story

As an Admin,
I want to write help articles using a rich text editor,
So that I can document procedures.

## Acceptance Criteria

1.  **Given** I am in the Admin Studio
    **Then** I can use a Notion-like editor (Plate.js) to write content
2.  **Given** I save the article
    **Then** automatic version history is kept for compliance (QA #10)
3.  **Given** I am ready
    **Then** I can publish it to the Help Center (FR19.1)

## Tasks / Subtasks

- [x] 1. Initialize Story 11.1
  - [x] 1.1 Create story file

- [x] 2. Backend Logic
  - [x] 2.1 Implement `HelpArticle` Model & Migration
  - [x] 2.2 Implement `HelpArticleService` (CRUD + Versions)
  - [x] 2.3 Add API Endpoints

- [x] 3. Frontend UI
  - [x] 3.1 Integrate Plate.js Editor
  - [x] 3.2 Create Article List & Edit View
  - [x] 3.3 Implement Version History Sidebar

## Dev Agent Record

### Agent Model Used

Antigravity (Retroactive Generation)

### File List

- `apps/backend/src/services/help-article.service.ts`
- `apps/frontend/components/help/HelpArticleEditor.tsx`
