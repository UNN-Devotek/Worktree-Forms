# Project Scope: WorkTree

## 1. Primary Focus: The Ultimate Form Builder

The immediate goal is to deliver a best-in-class **Form Management System**. The platform revolves around a "Form Landing Page" for each form, serving as the command center for building, sharing, and analyzing data.

### 1.1 Form Landing Page (The Hub)

Every form has a dedicated dashboard with the following tabs:

#### A. Overview Tab

- **Analytics**: Visual charts for Views, Submissions, and Completion Rate over time.
- **Recent Activity**: Log of latest submissions and edits.
- **Quick Actions**: "Share Form", "Preview", "Export Data".
- **Status Indicators**: Active/Draft/Archived status toggle.

#### B. Edit Tab (The Builder)

- **Visual Interface**: Drag-and-drop canvas (sorting, nesting).
- **Field Types**:
  - **Basic**: Text, Textarea, Email, Number, Checkbox, Radio, Select.
  - **Advanced**: File Upload (MinIO), Signature (Canvas), Date/Time, Rich Text (HTML), Hidden Fields.
  - **Layout**: Section Breaks, Page Breaks (Multi-step forms), Columns.
- **Logic Engine**:
  - **Conditional Visibility**: Show/Hide fields based on other values.
  - **Calculations**: Compute scores or costs dynamically.
  - **Validation**: Required fields, Regex patterns, Min/Max values.
  - **Smart Table**: Matrix inputs with admin-configurable pre-fill. **UX Req**: Must auto-collapse to "Card List" view on mobile devices.

#### C. Submit Tab

- **Public View**: The actual shareable version of the form.
- **Modes**:
  - **Live**: Publicly accessible URL.
  - **Preview**: Admin-only view with "Test Mode" watermark.
  - **Embed**: Code snippets for iframe/JS embedding.

#### D. Review Tab (Submissions)

- **Visual Data Grid**: Sortable, filterable grid with **Custom Columns** (toggle field visibility).
- **Visual Previews**: Image/File fields render as clickable thumbnails with Lightbox preview.

- **Record Details**: Click a row to view the full submission in a modal/drawer.
- **Management**:
  - Delete/Archive submissions.
  - Export to CSV/Excel/JSON.
  - Bulk actions.
- **File Preview**: Inline preview of uploaded images/files.

#### E. Integrations Tab

- **Webhooks**: Send JSON payload to any URL on submission.
- **Slack/Discord**: Send notifications to channels.
- **Google Sheets**: Sync rows to a sheet (via API/Zapier).
- **Zapier/Make**: Official or generic webhook compatibility.
- **Email**: Send confirmation emails to respondents and alerts to admins.

#### F. Settings Tab

- **General**: Form Name, Description, Favicon.
- **Access Control**: Public vs. Private, Password Protection, Domain Restriction.
- **Scheduling**: Open/Close form at specific dates/times.
- **Notifications**: Custom email templates.
- **Redirects**: Custom "Thank You" page.
- **Limits**: Max submissions per form/user.

### 1.2 Admin & System Management

- **File Browser (Refined)**: Dense Table View (Name, Size, Type, Uploaded By, Date). Actions: Bulk Delete, Move, Rename.
- **Enhanced Admin Panel**:
  - **User Management**: Invite system, Role assignment (RBAC), Deactivate users.
  - **Site Settings**: Branding (Logo, Colors), SMTP, Storage Config.

---

## 2. Extended Vision: Project-Centric Operations

WorkTree extends beyond just forms into a complete **Operations Platform** where "Projects" (Jobs/Sites) are the central unit.

### 2.1 Project Core

- **Projects**: The central entity connecting Forms, Routes, Files, and Chat.
- **Templates**: Pre-defined workflows auto-create forms and assign roles.
- **Project Dashboard**: "Command Center" landing page with metrics (Completion %, Active Routes), Activity Feed, and Quick Links.
- **Public Sharing**: Generate secure, read-only public URLs. **Security**: Uploads quarantined for scanning; Links default to "Read-Only".
- **Human-Readable URLs**: All external links use slugs (e.g., `/projects/acme-reno`) instead of IDs.

### 2.2 Route Planning & Logistics

- **Route Builder**:
  - Upload CSV/Excel of stops.
  - **MapCN/GraphHopper Integration**: Optimize routes based on time/distance.
  - Drag-and-drop stop reordering.
- **Technician View**: Mobile-friendly link for drivers with "Navigate" buttons (Google/Apple Maps).

### 2.3 Live Data Tables (Deep Integration)

- **Grid Interface**: "Airtable-like" view for project data using lightweight DOM tables.
- **Deep Integration**:
  - **Project Data**: Rows tied to sites/assets.
  - **Form Sync**: Populate tables from submissions or pre-fill forms from rows.
  - **Route Action**: Select rows -> "Send to Route Builder".
- **Capabilities**: Custom columns (Formula, User, Select), Inline editing.

### 2.4 PDF Plan Review

- **Blueprints**: High-performance viewer for large engineering PDFs.
- **Collaboration**: Real-time multi-user markups (Shapes, Cloud, Text) and threaded comments.
- **Versioning**: Manage plan revisions.

### 2.5 Collaboration & AI

- **Project Chat**: Real-time rooms per project with deep linking to forms/plans.
- **AI Assistant (RAG)**: Self-hosted AI (Ollama/pgvector) to answer questions about project data ("What is the site contact for Project X?").

### 2.6 Integrated Document Control

- **Project Document Manager**: Central repository for site plans, manuals, and reports.
- **Versioning**: Automatic version control for uploaded files.
- **Deep Linking**: Link specific PDFs/Files to Spreadsheet rows or Form fields.
- **Annotation-to-Form**: Trigger specific forms directly from PDF markups (e.g., "Create Snag List" from a blueprint circle).

### 2.7 Smart Data Handling

- **Auto-Naming**: Automatically rename uploaded files based on Form Field Name + Metadata (e.g., `Broken_Valve_ProjectA_2024-01.jpg`).

---

## 3. Technology Stack & Security

### Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/ui.
- **Backend**: Node.js 20+, Express.js, Prisma ORM.
- **Database**: PostgreSQL (Structured data + JSONB).
- **Storage**: MinIO (S3 Compatible).
- **DevOps**: Docker, Dokploy.

### Security

- **Authentication**: JWT (Current), Microsoft OAuth 2.0 (Roadmap).
- **RBAC**: Granular roles (Admin, Editor, Viewer, Custom).
- **Domain Restriction**: Lock access to specific email domains.
- **Data Integrity**: **Schema Versioning** required to handle offline sync conflicts without data loss.

---

## 4. Implementation Roadmap

### Phase 1: The Form Builder (Current Focus)

- [ ] Form Landing Page (6 Tabs)
- [ ] Advanced Field Types (File, Sig, Logic)
- [ ] Admin Panel & File Browser Polish
- [ ] Webhook Integrations

### Phase 2: Project Operations

- [ ] Project Entity & Templates
- [ ] Live Data Tables
- [ ] Route Planning Integration

### Phase 3: Advanced Features

- [ ] PDF Plan Markup
- [ ] AI Assistant
- [ ] Microsoft SSO
