---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
workflowType: "research"
lastStep: 1
research_type: "technical"
research_topic: "PRD Feasibility"
research_goals: "Validate architectural feasibility and implementation strategies"
user_name: "White"
date: "2026-01-08"
web_research_enabled: true
source_verification: true
---

# Research Report: technical

**Date:** 2026-01-08
**Author:** White
**Research Type:** technical

---

## Research Overview

[Research overview and methodology will be appended here]

---

## Integration Patterns Analysis

### REST vs GraphQL for Project Data

**Decision**: **REST API** with specialized endpoints is the most pragmatic choice for a self-hosted MVP.

- **Rationale**: While GraphQL fits the graph nature of projects/tasks, it adds complexity (caching, N+1 query vulnerability) that contradicts the "robust self-hosted" goal.
- **Pattern**: Use standard REST for 90% of CRUD. Use a specialized "Aggregate Endpoint" (e.g., `GET /api/projects/:id/full-tree`) to fetch the entire project graph for the initial load, minimizing round trips.
- **Source**: _LogRocket: REST vs GraphQL Performance, StackOverflow Architectures_

### Real-Time Engine (Chat + Notifications)

**Decision**: **WebSockets (Socket.io) + Redis Adapter**.

- **Requirement**: "Project Chat" implies bi-directional communication, ruling out Server-Sent Events (SSE) which are uni-directional.
- **Architecture**:
  - **Frontend**: `socket.io-client` connects to the Next.js server.
  - **Backend**: Next.js API Routes (custom server) or a separate Node.js worker handles socket connections.
  - **Scaling**: **Redis Adapter** is critical. It allows multiple container instances to broadcast messages to all connected clients, regardless of which container they are connected to.
- **Source**: _Socket.io Redis Adapter Docs, WebSocket Best Practices_

### Mobile-Webview Geolocation Bridge

**Pattern**: **The "Background-to-Foreground" Handoff**.

- **Challenge**: The Webview (UI) is dead when the app is in the background, but Geolocation Logic must run.
- **Solution**:
  1.  **Native Layer**: Capacitor Background Runner plugin detects "Significant Location Change" (OS Event).
  2.  **Storage**: Native layer writes coordinates to `Capacitor Preferences` (Native Storage) immediately.
  3.  **Wake-up**: When the user opens the app (Foreground), the Webview mounts.
  4.  **Handoff**: On mount, Webview queries `Capacitor Preferences` via Bridge to check for "Pending Location Triggers" and navigates accordingly.
- **Source**: _Capacitor Background Runner Docs, React Native Bridge Patterns_

### Security: Field-Level Encryption

**Pattern**: **AES-256-GCM** for API Keys.

- **Requirement**: Secure storage of third-party keys (OpenAI, SendGrid).
- **Implementation**:
  - **Key Hierarchy**: Use a "Master Key" (Environment Variable `ENCRYPTION_KEY`) to encrypt/decrypt fields.
  - **Library**: Use Node.js `crypto` module.
  - **Scope**: Only encrypt the specific `api_key` column in the `project_settings` table. Do NOT encrypt the whole row to maintain searchability of non-sensitive fields.
- **Source**: _OWASP Cryptographic Storage Cheatsheet_

## Technical Research Scope Confirmation

**Research Topic:** PRD Feasibility
**Research Goals:** Validate architectural feasibility and implementation strategies

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

## Technology Stack Analysis

### Self-Hosted Infrastructure Strategy

**Feasibility:** Confirmed. The proposed stack (Next.js + Postgres + MinIO + Redis) is a standard, robust production pattern for self-hosted environments.

- **Containerization**: Use **Docker Compose** with named volumes for persistence (`postgres_data`, `minio_data`). Use **multi-stage builds** for Next.js to minimize image size.
- **Network Isolation**: Define custom Docker networks to isolate backend services (DB, Redis) from public access, exposing only the Next.js frontend and API gateway.
- **Source**: _Docker Best Practices (Docker.com), Self-Hosted Roadmaps (Dev.to)_

### Job Queue Architecture (Redis vs Postgres)

**Decision**: **Redis (BullMQ)** is the superior choice for high-throughput workloads (IMAP polling, AI rate limiting) vs Postgres-based queues (`pg-boss`).

- **BullMQ (Redis)**: High throughput, low latency, efficient "at-least-once" delivery. Ideal for high-volume event processing (email ingestion).
- **Postgres (`pg-boss`)**: Transactional guarantees (atomic jobs) but lower throughput and higher DB load. Better for critical "slow" jobs like financial transactions.
- **Verdict**: Stick with **Redis + BullMQ** as requested by User, as it offloads processing load from the primary database.
- **Source**: _BullMQ Framework Docs, Postgres vs Redis Benchmarks (DragonflyDB)_

### RAG Engine: pgvector vs Specialized Vector DB

**Decision**: **PostgreSQL `pgvector`** is the correct architectural choice for this project magnitude (<100M vectors).

- **Unified Stack**: Eliminates the need for a separate vector DB (Qdrant/Milvus), simplifying the "Self-Hosted" promise significantly.
- **Transactional RAG**: Allows joining vector search results with standard SQL `WHERE` clauses (e.g., "Find similar docs WHERE project_id = X"), enforcement of RBAC at the query level.
- **Performance**: `pgvector` with HNSW indexing provides millisecond-latency search sufficient for form data and chat history.
- **Source**: _Supabase Vector Guides, pgvector Performance Analysis_

### Mobile Geolocation & Battery Hygiene

**Validation**: Innovation #4 (Contextual Compass) is feasible but dangerous for battery life if misimplemented.

- **Strategy**: Do NOT use active polling (`watchPosition`) in the background.
- **Implementation**: Use **Significant Location Change (SLC)** API via React Native/Capacitor plugins. This wakes the app only when the device moves by a significant distance (e.g., 500m), reducing battery impact to <5% daily.
- **Source**: _React Native Background Geolocation Docs, Apple CoreLocation Best Practices_

### Email Ingestion: Polling vs IDLE

**Optimization**: The PRD suggests "Polling", but **IMAP IDLE** is superior.

- **Technology**: Use **`ImapFlow`** (Modern Node.js client) instead of legacy `node-imap`.
- **Mechanism**: `ImapFlow` supports **IMAP IDLE**, allowing the server to "push" new email notifications instantly. This replaces "Polling every 5 minutes" with "Real-time" ingestion and massively reduces network traffic.
- **Source**: _Nodemailer/ImapFlow Documentation, RFC 2177_
