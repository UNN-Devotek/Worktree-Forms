---
stepsCompleted: [system-level]
mode: system-level
audience: qa
generatedBy: TEA Agent (Murat)
date: 2026-03-07
project: Worktree
user_name: White
status: draft
---

# Worktree — System-Level Test Design (QA Execution Plan)

**Date:** 2026-03-07
**Author:** White (via TEA Agent — Murat)
**Mode:** System-Level (Phase 3/4 bridge — architecture complete, implementation in progress)
**Status:** Draft

---

## Executive Summary

**Scope:** Full-system test coverage strategy for Worktree — a multi-tenant, real-time field operations platform on AWS ECS + DynamoDB + Hocuspocus + Pinecone.

**Risk Summary:**

- Total risks identified: 13
- High-priority risks (score ≥6): 8
- Critical categories: SEC (3), DATA (3), TECH (2)

**Coverage Summary:**

| Priority | Scenarios | Est. Hours |
|----------|-----------|------------|
| P0       | 18        | 36 hrs     |
| P1       | 20        | 20 hrs     |
| P2       | 14        | 7 hrs      |
| P3       | 8         | 2 hrs      |
| **Total**| **60**    | **65 hrs** |

---

## Not in Scope

| Item | Reasoning | Mitigation |
|------|-----------|------------|
| AWS infrastructure provisioning (CDK) | Platform team owned; outside app testing boundary | AWS CDK diff checks in CI |
| Pinecone SLA & uptime | Third-party vendor SLA — not testable in CI | Pinecone status monitoring + fallback error handling tests |
| Email delivery (AWS SES / SendGrid) | External provider | Stub/mock email transport in test environment |
| Mobile Capacitor native bridge | Requires physical devices or device farm | Manual QA pass per release; not automated in CI pipeline |
| Legacy Prisma/PostgreSQL code paths | Fully removed in AWS migration (2026-03-05) | Confirmed deleted — no regression needed |

---

## Risk Assessment

### High-Priority Risks (Score ≥ 6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | SEC | Application-layer multi-tenancy bypass — developer omits `requireProjectAccess()` in a new route, leaking cross-tenant data (no DB-level RLS) | 2 | 3 | **6** | Integration tests asserting 403 on cross-tenant queries; code review checklist | Dev Lead | Per sprint |
| R-002 | SEC | projectId injection via URL params — attacker supplies a different `projectId` than their session, bypassing RBAC scope enforcement | 2 | 3 | **6** | Integration tests with mismatched session/projectId; fuzz boundary tests | QA | Sprint 1 |
| R-003 | SEC | AI tool calls bypass server action auth — a tool directly queries DynamoDB without calling a Server Action, skipping `await auth()` | 2 | 3 | **6** | Integration tests calling tool endpoints unauthenticated; architecture review | Dev Lead | Sprint 2 |
| R-004 | DATA | Yjs document exceeds 350 KB DynamoDB guard — large sheet state causes snapshot write failure, resulting in data loss for collaborating users | 2 | 3 | **6** | Integration test that fills a Yjs doc to 340 KB and asserts guard fires; E2E test asserts client notification | QA | Sprint 3 |
| R-005 | DATA | Offline sync ledger replay corrupts server state — conflicting append-only operations applied out-of-order on reconnect | 2 | 3 | **6** | Playwright co-browser test: disconnect user A, make conflicting edits from A and B, reconnect A, assert final state integrity | QA | Sprint 4 |
| R-006 | DATA | AWS SDK used in Edge runtime — route accidentally exports `runtime = 'edge'`, causing DynamoDB/S3/Pinecone calls to crash at runtime | 2 | 3 | **6** | Static lint rule (ESLint `no-restricted-syntax`) preventing `export const runtime = 'edge'` in files that import AWS SDK; CI enforced | Dev Lead | Immediate |
| R-007 | TECH | Integration tests missing GSI1 definition — `CreateTableCommand` omits `GSI1`, causing all secondary-access-pattern queries to fail with `ValidationException` at test time only, masking bugs | 3 | 2 | **6** | Shared `dynamodb.ts` setup file template enforced via test scaffold; CI breaks if GSI1 missing | QA | Sprint 0 |
| R-008 | TECH | Yjs CRDT divergence under concurrent edits — two clients edit the same cell simultaneously; CRDT fails to converge to identical state | 2 | 3 | **6** | Playwright multi-context convergence test (Story 0-11); two browser contexts, concurrent edits, assert identical final state in both | QA | Sprint 3 |

### Medium-Priority Risks (Score 3–5)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-009 | OPS | BullMQ queue entries lost on Redis restart if `maxmemory-policy` is not `noeviction` | 2 | 2 | 4 | Docker Compose config test; integration test that simulates Redis restart + asserts job re-queued | Dev Lead |
| R-010 | SEC | NextAuth session not invalidated after role demotion — stale session grants elevated permissions after `auth:force_refresh` pub-sub event | 2 | 2 | 4 | Integration test: demote user role → assert `auth:force_refresh` published to Redis → assert session re-validated within 5s | QA |
| R-011 | PERF | API latency exceeds 100 ms SLA under concurrent load — DynamoDB provisioned throughput or GSI query fan-out causes latency spike | 2 | 2 | 4 | k6 load test against staging: 50 concurrent users, assert p95 < 100 ms on core endpoints | QA |
| R-012 | DATA | Pinecone vector embedding contamination — embeddings upserted without `projectId` metadata filter, allowing RAG queries to surface results from other projects | 1 | 3 | 3 | Integration test: upsert embeddings for project A and B; query as project A; assert no project B results returned | QA |
| R-013 | OPS | S3 presigned URL returns internal Docker hostname in production responses — `localstack:4510` leaked instead of real S3 URL | 1 | 2 | 2 | Integration test asserting presigned URLs in non-local environments contain `s3.amazonaws.com` not `localstack` | QA |

### Low-Priority Risks (Score 1–2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-014 | OPS | Hocuspocus pub-sub fails to reconnect after Redis transient disconnect | 1 | 2 | 2 | Monitor — ALB health check guard drains unhealthy WS instances |
| R-015 | BUS | i18n `Accept-Language` header not respected — all errors returned in English regardless of locale | 1 | 1 | 1 | P3 — manual QA; implement when i18n Epic (1-10) is in-progress |

---

## Entry Criteria

- [x] Architecture document finalized (`architecture.md`)
- [x] DynamoDB single-table design and ElectroDB entities defined (Story 0-1)
- [x] Local dev environment functional (`docker compose up --watch` + `seed-dev.sh`)
- [x] CI pipeline operational (GitHub Actions → ECR → ECS)
- [ ] `vitest-dynalite` integration test infrastructure set up (Story 0-9 — done; verify GSI1 in all setups)
- [ ] Playwright base config established (`playwright.config.ts` with local base URL)
- [ ] Story 0-11 (Playwright collaboration infrastructure) unblocked and started

## Exit Criteria

- [ ] All P0 tests passing in CI (100% pass rate)
- [ ] All P1 tests passing with ≥95% pass rate
- [ ] Zero open SEC-category risks (R-001, R-002, R-003) unmitigated
- [ ] R-004 (Yjs size guard) verified by integration test
- [ ] R-007 (GSI1 in all test setups) lint/scaffold rule in place
- [ ] CRDT convergence test (R-008 / Story 0-11) written and green
- [ ] Performance baseline established (p95 < 100 ms on /api/projects, /api/forms)

---

## Test Coverage Plan

### P0 (Critical) — Run on every commit

**Criteria:** Blocks core journey OR high risk (≥6) OR no workaround if broken

| Requirement | Test Level | Risk Link | Test Count | File Location | Notes |
|-------------|------------|-----------|------------|---------------|-------|
| RBAC: `requireProjectAccess()` called before any DynamoDB write | Integration | R-001 | 3 | `apps/backend/src/middleware/rbac.integration.test.ts` | Assert 403 when middleware absent |
| RBAC: cross-tenant projectId injection rejected | Integration | R-002 | 3 | `apps/backend/src/middleware/rbac.integration.test.ts` | Session projectId ≠ URL projectId → 403 |
| Auth: login / logout / session revocation | E2E | — | 4 | `apps/frontend/e2e/auth/login.spec.ts` | Admin + Member credentials |
| Auth: unauthenticated request to protected route → 401 | API | — | 3 | `apps/backend/src/routes/*.integration.test.ts` | All route families |
| AI tools: unauthenticated tool call → 401 | API | R-003 | 2 | `apps/backend/src/routes/ai.integration.test.ts` | Tool endpoint without session |
| AI tools: forbidden tool call (wrong role) → 403 | API | R-003 | 2 | `apps/backend/src/routes/ai.integration.test.ts` | MEMBER calling ADMIN-only tool |
| Yjs 350 KB document size guard fires on `onChange` | Integration | R-004 | 2 | `apps/backend/src/ws-server.integration.test.ts` | Fill to 351 KB, assert error thrown |
| Edge runtime ESLint rule: no AWS SDK in edge routes | Static | R-006 | 1 | `.eslintrc` / CI lint step | `no-restricted-syntax` rule |
| GSI1 present in all vitest-dynalite table setups | Integration | R-007 | 2 | `apps/backend/src/test/setup/dynamodb.ts` | Assert `GSI1` in `GlobalSecondaryIndexes` |

**Total P0:** 22 tests

---

### P1 (High) — Run on every PR to main

**Criteria:** Core user journey OR medium risk (3–5) OR integration boundary

| Requirement | Test Level | Risk Link | Test Count | File Location | Notes |
|-------------|------------|-----------|------------|---------------|-------|
| DynamoDB entity CRUD: ProjectEntity | Integration | — | 4 | `apps/backend/src/lib/dynamo/entities/project.integration.test.ts` | create/read/update/delete + GSI query |
| DynamoDB entity CRUD: FormEntity + FormVersionEntity | Integration | — | 4 | `apps/backend/src/lib/dynamo/entities/form.integration.test.ts` | |
| DynamoDB entity CRUD: SubmissionEntity | Integration | — | 3 | `apps/backend/src/lib/dynamo/entities/submission.integration.test.ts` | |
| DynamoDB entity CRUD: SheetEntity + SheetColumnEntity + SheetRowEntity | Integration | — | 5 | `apps/backend/src/lib/dynamo/entities/sheet.integration.test.ts` | |
| DynamoDB entity CRUD: UserEntity + ProjectMemberEntity | Integration | — | 4 | `apps/backend/src/lib/dynamo/entities/user.integration.test.ts` | byEmail GSI query |
| DynamoDB entity CRUD: TaskEntity | Integration | — | 3 | `apps/backend/src/lib/dynamo/entities/task.integration.test.ts` | |
| DynamoDB entity CRUD: RouteEntity + RouteStopEntity | Integration | — | 3 | `apps/backend/src/lib/dynamo/entities/route.integration.test.ts` | |
| Yjs CRDT convergence: 2 concurrent editors, same cell | E2E | R-008 | 3 | `apps/frontend/e2e/collaboration/crdt-convergence.spec.ts` | Story 0-11 |
| Role demotion triggers `auth:force_refresh` Redis event | Integration | R-010 | 2 | `apps/backend/src/services/auth.integration.test.ts` | Subscribe Redis, demote user, assert event |
| S3 presigned URL: PUT upload + GET retrieve cycle | Integration | — | 2 | `apps/backend/src/routes/upload.integration.test.ts` | LocalStack |
| Pinecone: upsert + projectId-scoped query | Integration | R-012 | 2 | `apps/backend/src/services/embedding.integration.test.ts` | Two projects, assert isolation |
| BullMQ: job retries with exponential backoff | Integration | R-009 | 2 | `apps/backend/src/worker.integration.test.ts` | Simulate worker failure |
| Health endpoint: returns 503 when Redis unavailable | API | — | 1 | `apps/frontend/app/api/health/route.test.ts` | Mock Redis unreachable |
| Form submission end-to-end (create form → submit → retrieve) | E2E | — | 3 | `apps/frontend/e2e/forms/form-submit.spec.ts` | P1 happy path |
| Project creation → member invite → access grant | E2E | — | 2 | `apps/frontend/e2e/projects/project-invite.spec.ts` | |

**Total P1:** 43 tests

---

### P2 (Medium) — Run nightly

**Criteria:** Secondary features OR low risk (1–2) OR edge cases

| Requirement | Test Level | Risk Link | Test Count | File Location | Notes |
|-------------|------------|-----------|------------|---------------|-------|
| S3 presigned URL does not leak `localstack` hostname in non-local env | Integration | R-013 | 1 | `apps/backend/src/services/upload.service.test.ts` | Assert URL contains `s3.amazonaws.com` when `S3_ENDPOINT` unset |
| PDF engine: overlay + flatten preserves field values | Integration | — | 2 | `apps/backend/src/services/spec.service.test.ts` | |
| Webhook BullMQ: retry on 5xx upstream response | Integration | — | 2 | `apps/backend/src/routes/webhooks.integration.test.ts` | |
| AI assistant: tool registry returns correct schema | Unit | — | 3 | `apps/backend/src/services/ai.unit.test.ts` | |
| Rate limiter: enforces per-IP limit on auth endpoints | Integration | — | 2 | `apps/backend/src/middleware/rateLimiter.integration.test.ts` | |
| Audit log: every mutation writes AuditLog entity | Integration | — | 3 | `apps/backend/src/middleware/audit.integration.test.ts` | |
| i18n: `Accept-Language: es` returns Spanish error messages | API | R-015 | 1 | `apps/backend/src/routes/users.integration.test.ts` | When Epic 1-10 active |
| Route stop → sheet row bi-directional link integrity | Integration | — | 2 | `apps/backend/src/lib/dynamo/entities/route.integration.test.ts` | |
| Visibility config: PRIVATE form returns 403 to non-member | Integration | — | 2 | `apps/backend/src/routes/forms.integration.test.ts` | |

**Total P2:** 18 tests

---

### P3 (Low) — On-demand / full regression only

**Criteria:** Nice-to-have OR exploratory OR performance benchmarks

| Requirement | Test Level | Test Count | File Location | Notes |
|-------------|------------|------------|---------------|-------|
| Component library: visual regression (screenshot diff) | E2E | 3 | `apps/frontend/e2e/component-library/visual.spec.ts` | Playwright screenshot comparison |
| Performance: p95 < 100 ms on `/api/projects` under 50 concurrent users | Load | 1 | `k6/load-test-projects.js` | k6 against staging |
| Performance: p95 < 100 ms on `/api/forms` under 50 concurrent users | Load | 1 | `k6/load-test-forms.js` | k6 against staging |
| OCR worker: scanned PDF produces SpecSection rows | Integration | 2 | `apps/backend/src/worker.ocr.test.ts` | Requires Tesseract.js |
| DynamoDB PITR enabled: point-in-time recovery config check | Smoke | 1 | `scripts/verify-pitr.sh` | aws-cli assertion |

**Total P3:** 8 tests

---

## Execution Order

### Smoke Tests (< 3 min) — Every commit

- [ ] `GET /api/health` → 200 with `dynamodb: connected`, `redis: connected` (15s)
- [ ] Auth: login with `admin@worktree.pro` → dashboard (30s)
- [ ] Auth: unauthenticated → 401 on protected route (10s)
- [ ] DynamoDB: `ProjectEntity.create()` + `findById()` round-trip (15s)
- [ ] RBAC: cross-tenant projectId → 403 (10s)
- [ ] Edge runtime lint check passes (5s)

**Total smoke:** 6 scenarios, ~1.5 min

---

### P0 Tests (< 10 min) — Every commit (after smoke)

- [ ] RBAC middleware enforcement suite (Integration, 3 tests)
- [ ] Cross-tenant injection rejection suite (Integration, 3 tests)
- [ ] Auth login/logout/revocation (E2E, 4 tests)
- [ ] Unauthenticated → 401 on all route families (API, 3 tests)
- [ ] AI tool auth enforcement (API, 4 tests)
- [ ] Yjs 350 KB size guard (Integration, 2 tests)
- [ ] GSI1 test setup validation (Integration, 2 tests)
- [ ] ESLint edge runtime rule (Static, CI lint)

**Total P0:** ~22 scenarios, ~8 min

---

### P1 Tests (< 30 min) — Every PR to main

- [ ] All 23 ElectroDB entity CRUD suites (Integration, ~26 tests)
- [ ] Yjs CRDT convergence — 2-user concurrent edit (E2E, 3 tests) *(Story 0-11 prerequisite)*
- [ ] Role demotion → auth:force_refresh (Integration, 2 tests)
- [ ] S3 upload + retrieve cycle (Integration, 2 tests)
- [ ] Pinecone project isolation (Integration, 2 tests)
- [ ] BullMQ retry (Integration, 2 tests)
- [ ] Health 503 on Redis down (API, 1 test)
- [ ] Form submit E2E (E2E, 3 tests)
- [ ] Project + invite E2E (E2E, 2 tests)

**Total P1:** ~43 scenarios, ~20 min

---

### P2/P3 Tests (< 60 min) — Nightly + release gate

- All P2 integration and unit tests
- P3 visual regression (Playwright)
- P3 k6 load tests (staging only)

**Total P2/P3:** ~26 scenarios, ~30 min

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hrs/Test | Total Hours | Notes |
|----------|-------|----------|-------------|-------|
| P0       | 22    | 2.0      | 44 hrs      | Security + complex setup |
| P1       | 43    | 1.0      | 43 hrs      | DynamoDB CRUD is template-repeatable |
| P2       | 18    | 0.5      | 9 hrs       | Simpler scenarios |
| P3       | 8     | 0.25     | 2 hrs       | Exploratory |
| **Total**| **91**| —        | **~98 hrs** | **~12 engineering days** |

### Prerequisites

**Test Data Factories:**

- `projectFactory` — creates `ProjectEntity` with `ProjectMemberEntity` (owner + 1 member)
- `formFactory` — creates `FormEntity` + initial `FormVersionEntity`
- `submissionFactory` — creates `SubmissionEntity` linked to form
- `sheetFactory` — creates `SheetEntity` with 3 `SheetColumnEntity` rows
- `userFactory` — creates `UserEntity` with bcrypt-hashed password

**Tooling:**

| Tool | Purpose | Status |
|------|---------|--------|
| Vitest + vitest-dynalite | DynamoDB integration tests | Ready (Story 0-9 done) |
| Playwright | E2E + collaboration tests | Ready (config needed for 0-11) |
| k6 | Load testing against staging | Pending setup |
| ESLint `no-restricted-syntax` | Edge runtime guard | Pending config |
| Supertest (optional) | Express API tests alternative | Optional |

**Environment:**

- Local: `docker compose up --watch` + `bash scripts/seed-dev.sh`
- CI: GitHub Actions with vitest-dynalite (no Docker needed for integration)
- E2E CI: Full Docker Compose stack (`collaboration` CI job — Story 0-11)
- Staging: ECS Fargate deployment (for k6 load tests only)

---

## Quality Gate Criteria

### Pass/Fail Thresholds

| Gate | Threshold | Enforcement |
|------|-----------|-------------|
| P0 pass rate | 100% | CI blocks merge |
| P1 pass rate | ≥95% | CI warns; waivers logged |
| P2/P3 pass rate | ≥90% | Nightly report only |
| SEC-category risks | 0 open unmitigated | Release blocker |
| API p95 latency | < 100 ms | Staging gate (k6) |

### Non-Negotiable Requirements

- [ ] All P0 tests pass (zero exceptions)
- [ ] R-001 (multi-tenancy bypass) mitigated and verified by integration test
- [ ] R-002 (projectId injection) mitigated and verified
- [ ] R-003 (AI auth bypass) mitigated and verified
- [ ] R-007 (GSI1 in all test setups) enforced via scaffold or lint
- [ ] No `export const runtime = 'edge'` in any AWS SDK-touching file (lint enforced)

---

## Mitigation Plans

### R-001 + R-002: Multi-tenancy enforcement (SEC, Score 6)

**Strategy:** Write a shared test helper `assertCrossTenantRejected(endpoint, method, memberSession)` that calls every route with a mismatched projectId. Run as part of P0 suite on every commit. Add to code review checklist: "Does this route call `requireProjectAccess()` before any DynamoDB operation?"

**Owner:** Dev Lead
**Timeline:** Sprint 0 (immediate — infrastructure already exists, tests missing)
**Verification:** P0 RBAC integration tests green in CI

---

### R-003: AI tool auth bypass (SEC, Score 6)

**Strategy:** Add integration tests that call each AI tool endpoint: (a) with no session cookie → assert 401, (b) with MEMBER session calling ADMIN-only tool → assert 403. Review `ai-tools.ts` to confirm every tool calls a Server Action (never direct DB).

**Owner:** Dev Lead
**Timeline:** Sprint 2
**Verification:** AI integration test suite passes

---

### R-004: Yjs document size overflow (DATA, Score 6)

**Strategy:** Write a unit test that creates a Yjs doc, fills it programmatically to 351 KB, runs it through the `onChange` guard, and asserts the `Error("Document size exceeds...")` is thrown. Add a client-side E2E test asserting the user sees a toast notification on rejection.

**Owner:** QA
**Timeline:** Sprint 3 (when Sheets feature is in development)
**Verification:** Integration test + E2E test green

---

### R-005: Offline sync ledger corruption (DATA, Score 6)

**Strategy:** Playwright test: User A goes offline, User B makes edits, User A makes conflicting edits offline, User A reconnects. Assert final server state is deterministic and consistent (no duplicate/corrupted rows).

**Owner:** QA
**Timeline:** Sprint 4 (when offline sync feature is active)
**Verification:** Playwright offline sync test suite

---

### R-006: Edge runtime + AWS SDK (TECH, Score 6)

**Strategy:** Add ESLint `no-restricted-syntax` rule targeting `ExportNamedDeclaration[declaration.declarations.0.id.name="runtime"]` in any file importing `@aws-sdk/*` or `@pinecone-database/*`. CI fails on violation. Document rule in CLAUDE.md.

**Owner:** Dev Lead
**Timeline:** Immediate (Sprint 0)
**Verification:** `npm run lint` fails when rule violated

---

### R-007: GSI1 missing from test table setup (TECH, Score 6)

**Strategy:** Centralize all `CreateTableCommand` calls through a single exported `createTestTable()` function in `apps/backend/src/test/setup/dynamodb.ts`. This function always includes GSI1. No test file is permitted to call `CreateTableCommand` directly. Add ESLint rule or team convention.

**Owner:** Dev Lead
**Timeline:** Sprint 0 (Story 0-9 — partially done; verify all test files use shared setup)
**Verification:** CI integration test suite — no `ValidationException: GSI1` errors

---

### R-008: CRDT convergence failure (TECH, Score 6)

**Strategy:** Implement Story 0-11 (Playwright collaboration test infrastructure). Two Playwright browser contexts connect to the same Hocuspocus room. Each makes concurrent edits. Assert both contexts converge to identical final state within 3 seconds.

**Owner:** QA
**Timeline:** Sprint 3 (block on Story 0-11 being unblocked from backlog)
**Verification:** `e2e/collaboration/crdt-convergence.spec.ts` green in CI collaboration job

---

## Assumptions and Dependencies

### Assumptions

1. `vitest-dynalite` is already installed and configured (Story 0-9 complete — confirmed done)
2. Playwright base config exists or will be created before E2E tests are written
3. The `seed-dev.sh` script provides sufficient data for form/sheet/route E2E scenarios
4. Story 0-11 will be pulled from backlog before Sprint 3 begins
5. k6 load testing is deferred until staging environment is stable

### Dependencies

| Dependency | Required By |
|------------|-------------|
| Story 0-11 (Playwright collaboration infra) | CRDT convergence test (R-008) |
| k6 installed + staging env | P3 load tests |
| ESLint `no-restricted-syntax` rule configured | R-006 mitigation |
| Shared `createTestTable()` helper | R-007 mitigation |

### Risks to This Plan

- **Risk:** Story 0-11 stays in backlog too long → CRDT convergence tests (R-008) remain unverified until late
  - **Contingency:** Manual Playwright session in local Docker Compose as interim verification

- **Risk:** AI routes change rapidly during development → AI auth tests need frequent updates
  - **Contingency:** Test against tool registry contract (unit), not individual tool endpoints (brittle)

---

## Interworking & Regression

| Service/Component | Impact | Regression Scope |
|-------------------|--------|-----------------|
| **RBAC Middleware** | Any route change can bypass auth | P0 cross-tenant suite must pass on every commit |
| **ElectroDB Entities** | Schema changes break all consumers | P1 entity CRUD suite runs on every PR |
| **Hocuspocus WS Server** | Yjs doc changes affect all collaborators | CRDT convergence E2E on every PR (after Story 0-11) |
| **BullMQ Workers** | Queue failures silently drop jobs | P1 retry tests on every PR |
| **Auth.js DynamoDB Adapter** | Auth table corruption locks all users | P0 login E2E on every commit |
| **Pinecone Vector Search** | Cross-project data leakage | P1 isolation integration test on every PR |
| **S3 / LocalStack** | Presigned URL failures break file upload | P1 upload cycle integration test on every PR |

---

## Sprint Planning Handoff

| Task | Owner | Priority | Notes |
|------|-------|----------|-------|
| Move Story 0-11 from backlog to Sprint 3 | PM | High | Unblocks CRDT test (R-008) |
| Add ESLint edge runtime guard rule | Dev Lead | Immediate | R-006 mitigation |
| Create `createTestTable()` shared helper | Dev Lead | Sprint 0 | R-007 mitigation |
| Write P0 RBAC integration tests | QA | Sprint 1 | R-001, R-002 |
| Write AI auth integration tests | QA | Sprint 2 | R-003 |
| Create test data factory library | QA | Sprint 1 | Prerequisite for all integration tests |
| Set up k6 for staging load tests | DevOps | Sprint 4 | P3 — deferred |

---

## Follow-on Workflows

- Run `[AT] ATDD` to generate failing acceptance tests for Epic 2 (Form Builder) before development begins
- Run `[TA] Test Automation` to generate the full Playwright test suite for Epic 1 stories
- Run `[TR] Trace Requirements` to map epics.md acceptance criteria → test cases

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk scoring framework (P × I = Score)
- `probability-impact.md` — Scoring scale definitions
- `test-levels-framework.md` — Unit vs integration vs E2E selection
- `test-priorities-matrix.md` — P0–P3 classification criteria

### Related Documents

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Epics: `_bmad-output/planning-artifacts/epics.md`
- Sprint Status: `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Generated by:** BMad TEA Agent — Murat (Master Test Architect)
**Workflow:** `_bmad/tea/testarch/test-design` (System-Level QA Mode)
**Version:** 5.0
