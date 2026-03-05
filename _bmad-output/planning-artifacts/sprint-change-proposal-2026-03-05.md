# Sprint Change Proposal: Full AWS Infrastructure Migration

**Date:** 2026-03-05
**Proposed by:** John (PM Agent)
**Approved by:** White
**Classification:** MAJOR — Fundamental infrastructure replan

---

## Section 1: Issue Summary

### Problem Statement

Worktree's current architecture is built on a self-hosted stack (PostgreSQL + Prisma + MinIO + Redis on Docker/Dokploy). A strategic decision has been made to migrate the entire infrastructure to AWS managed services:

- **Database:** PostgreSQL + Prisma ORM → **AWS DynamoDB** + ElectroDB ODM
- **Object Storage:** MinIO → **AWS S3**
- **Cache / Pub-Sub / Queues:** Self-hosted Redis → **AWS ElastiCache for Redis**
- **Vector Search (RAG):** pgvector → **Amazon OpenSearch Service**
- **Deployment:** Docker Compose / Dokploy → **AWS ECS Fargate + ECR + ALB**
- **Auth Sessions:** Prisma NextAuth adapter → **DynamoDB NextAuth adapter**

### Discovery Context

Identified during a PM-led architecture review session on 2026-03-05. No blocking technical failure — this is a proactive strategic pivot to a fully managed cloud stack for operational scalability and reduced infrastructure maintenance burden.

### Key Constraint Change

The original architecture had a hard constraint: *"No Cloud-Native dependencies (AWS/Azure specific services)."* This constraint is **removed** by this proposal. Worktree is moving to a cloud-first AWS deployment model.

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Impact Level | Reason |
|---|---|---|
| Epic 0 (NEW) | Prerequisite | AWS infrastructure layer must be established before all other work |
| Epic 1: Core Foundation | HIGH | Story 1.3 (RLS/RBAC) invalidated; auth adapter swap; S3 refs in 1.1, 1.4 |
| Epic 2: Form Builder | MEDIUM | Story 2.6 references BullMQ + MinIO |
| Epic 3: Field Ops | LOW | Frontend/PWA — DB-agnostic, no changes |
| Epic 4: Sync Engine | MEDIUM | Story 4.2 image upload target changes (MinIO → S3) |
| Epic 5: Mission Control | MEDIUM | All DB query logic (Prisma → DynamoDB) |
| Epic 6: Smart Grid | LOW | Yjs/Hocuspocus is DB-agnostic; ElastiCache is drop-in for Redis |
| Epic 7: Document Control | HIGH | Spec vector search (pgvector → OpenSearch); file storage (MinIO → S3) |
| Epic 8: Legacy Integration | MEDIUM | PDF generation unchanged; storage layer references updated |
| Epic 9: Compliance | MEDIUM | ComplianceRecord, PublicToken DB calls (Prisma → DynamoDB) |
| Epic 10: AI Layer | CRITICAL | Story 10.1 pgvector is gone — full RAG rewrite for OpenSearch |
| Epic 11: Help Center | MEDIUM | HelpArticle DB calls (Prisma → DynamoDB) |

### Stories Pulled from `done` / `ready-for-dev`

| Story | Previous Status | New Status | Reason |
|---|---|---|---|
| 1-1 | done | in-progress | MinIO bucket path reference → S3 |
| 1-3 | done | backlog | Entire Postgres RLS system invalidated — DynamoDB tenant isolation rewrite |
| 1-4 | done | in-progress | Avatar upload MinIO → S3 |
| 2-6 | done | in-progress | BullMQ + MinIO → ElastiCache + S3 |
| 4-2 | done | in-progress | Image upload target MinIO → S3 |
| 5-1 | done | in-progress | Dashboard metrics via Prisma → DynamoDB queries |
| 5-3 | done | in-progress | ZIP generation job storage MinIO → S3 |
| 5-4 | done | in-progress | Storage quota tracking Prisma → DynamoDB |
| 7-2 | done | backlog | Spec vector search pgvector → OpenSearch (full rewrite) |
| 9-1 | done | in-progress | ComplianceRecord DB calls Prisma → DynamoDB |
| 9-2 | done | in-progress | PublicToken + AuditLog Prisma → DynamoDB |
| 10-1 | done | backlog | pgvector gone — full RAG layer rewrite for OpenSearch |
| 11-1 | done | in-progress | HelpArticle DB calls Prisma → DynamoDB |

### Artifact Conflicts

| Document | Conflict | Action |
|---|---|---|
| `project-context.md` | Constraint A.1 bans cloud-native services | Updated — constraint removed |
| `architecture.md` | Data architecture, infrastructure, vector sections reference old stack | Updated — full AWS stack described |
| `prd.md` | NFR references self-hosted VPS | Updated — deployment NFR reflects AWS |
| `epics.md` | Stories 1.3, 10.1 built on now-invalid technology | Updated — rewritten |
| `sprint-status.yaml` | ~13 `done` stories need reopening | Updated — statuses corrected |

### Technical Impact Summary

| Layer | Current | New | Code Effort |
|---|---|---|---|
| ORM / DB Client | Prisma + PostgreSQL | ElectroDB + DynamoDB | Very High |
| Object Storage SDK | MinIO SDK | AWS SDK v3 S3 | Low |
| Cache | Redis (self-hosted) | ElastiCache Redis | Zero (connection string) |
| Vector Search | pgvector extension | Amazon OpenSearch | Medium |
| Auth Adapter | @prisma/client NextAuth | @auth/dynamodb-adapter | Low |
| Deployment | Docker Compose / Dokploy | ECS Fargate + ECR + ALB | Medium (infra) |
| Job Queues | BullMQ (Redis) | BullMQ (ElastiCache Redis) | Zero (connection string) |

---

## Section 3: Recommended Approach

**Selected: Hybrid — New Prerequisite Epic + Targeted Story Reopens**

### Rationale

- Do NOT roll back completed UI/UX work — React components, pages, and business logic are unaffected
- Add **Epic 0: AWS Infrastructure Migration** as a hard prerequisite that all DB-touching work depends on
- Reopen only stories whose implementation is directly tied to the old stack
- Keep `done` status for stories that are purely frontend, PWA, or business logic
- Once Epic 0 is complete, `in-progress` reopened stories can be re-implemented quickly as the patterns are established

### Effort Estimate

| Phase | Effort |
|---|---|
| Epic 0: AWS Infrastructure setup + DynamoDB schema design | 2–3 weeks |
| Rewriting all route/service DB calls (Prisma → ElectroDB) | 3–4 weeks |
| S3 swap (MinIO → AWS SDK) | 2–3 days |
| OpenSearch RAG integration | 3–5 days |
| NextAuth DynamoDB adapter | 1 day |
| ECS/Fargate deployment config | 1 week |
| Data migration script (existing data if needed) | 1 week |
| Testing + stabilization | 2 weeks |
| **Total** | **~10–12 weeks** |

### Risk Assessment

| Risk | Level | Mitigation |
|---|---|---|
| DynamoDB single-table design complexity | High | Use ElectroDB — purpose-built for TypeScript single-table |
| Loss of migration history tooling | Medium | Establish DynamoDB version tracking convention in Epic 0 |
| Referential integrity loss | Medium | Enforce at application layer in all write paths |
| Data loss during migration | High | Run dual-write period before cutover |

---

## Section 4: Detailed Change Proposals

### New Epic 0: AWS Infrastructure Migration

**Goal:** Establish the complete AWS infrastructure foundation that all other epics depend on.
**Must complete before:** Any story that touches the database, object storage, or vector search.

**Stories:**
- 0.1: DynamoDB table design + ElectroDB entity definitions (all 20+ models)
- 0.2: AWS S3 bucket setup + storage service swap (MinIO → S3)
- 0.3: ElastiCache Redis provisioning + connection validation
- 0.4: Amazon OpenSearch cluster setup + embedding indexing service
- 0.5: NextAuth DynamoDB adapter integration
- 0.6: ECS Fargate task definitions + ECR pipeline + ALB routing
- 0.7: Environment variable migration (MINIO_* → AWS_S3_*, DATABASE_URL → AWS_REGION + table names)

### Story 1.3: Rewritten — DynamoDB Tenant Isolation (replaces RLS/RBAC)

**OLD acceptance criteria summary:** Used Postgres RLS with `current_setting('app.current_project_id')` to enforce row-level data isolation at the database level.

**NEW:**
Given a user is logged in,
When they query any project resource via the API,
Then all DynamoDB queries are scoped with `projectId` as the partition key prefix (`PROJECT#<id>`)
And the application middleware validates the user's `ProjectMember` record before executing any query
And unauthorized requests return 403 before any DynamoDB call is made
And tenant isolation is enforced at the service layer, not the database layer (FR5.3, FR5.4).

### Story 10.1: Rewritten — OpenSearch RAG Ingestion (replaces pgvector)

**OLD:** Stored embeddings in `VectorEmbedding` Postgres table using pgvector extension.

**NEW:**
Given a new form submission is saved,
Then a background job triggers,
And generates embeddings for the text content,
And applies a strict Token Usage Cap ($50/month hard limit) (PM #6),
And stores them in **Amazon OpenSearch** with `projectId` + `submissionId` as metadata filters,
And supports hybrid keyword + semantic search for the AI assistant (FR8.2).

---

## Section 5: Implementation Handoff

**Scope Classification:** MAJOR

**Handoff:**
- Architect Agent: Update architecture.md with full AWS stack specifications
- Dev Team: Implement Epic 0 as first priority — no DB-touching stories can proceed until Epic 0 Stories 0.1–0.5 are complete
- PM: Update PRD NFR deployment constraints

**Success Criteria:**
1. Epic 0 complete: DynamoDB tables live, S3 bucket live, ElastiCache connected, OpenSearch cluster live
2. All `in-progress` reopened stories re-implemented against new stack
3. Stories 1.3 and 10.1 (`backlog`) implemented against new design
4. Zero Prisma imports remaining in codebase
5. Zero MinIO SDK imports remaining in codebase
