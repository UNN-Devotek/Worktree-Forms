# Worktree Full Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete all Epics 0–11: migrate from Prisma/PostgreSQL/MinIO to DynamoDB/S3/ElastiCache/Pinecone, implement all feature stories, enforce code quality standards, and deploy via GitHub Actions → ECS Fargate.

**Architecture:** Single-table DynamoDB with ElectroDB entities; S3 via AWS SDK (LocalStack in dev); Hocuspocus WebSocket + Yjs for real-time collaboration; Next.js App Router with Server Actions; Express.js REST API for mobile.

**Tech Stack:** Next.js 15, Express.js, ElectroDB, DynamoDB, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, @auth/dynamodb-adapter, NextAuth v5, vitest-dynalite, BullMQ + ioredis, Hocuspocus, Yjs, Tailwind CSS, shadcn/ui, Zod.

**Story Files:** `_bmad-output/implementation-artifacts/` — read each before implementing its tasks.
**Sprint Status:** `_bmad-output/implementation-artifacts/sprint-status.yaml` — update status as you go.

---

## PHASE 1: Foundation (Sequential — Epic 0 core)

> Run Phase 1 tasks IN ORDER. Nothing else can use the DB until Task 1 is done.
> After each task: `npm run build` must pass.

---

### Task 1: ElectroDB Entity Definitions (Story 0.1)

**Story file:** `_bmad-output/implementation-artifacts/0-1-dynamodb-schema-electrodb-entities.md` (read first)

**Files:**
- Create: `apps/backend/src/lib/dynamo/client.ts`
- Create: `apps/backend/src/lib/dynamo/entities/user.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/project.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/project-member.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/form.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/form-version.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/submission.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/sheet.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/sheet-column.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/sheet-row.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/route.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/route-stop.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/task.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/audit-log.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/file-upload.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/vector-embedding.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/sync-ledger.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/help-article.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/compliance-record.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/public-token.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/api-key.entity.ts`
- Create: `apps/backend/src/lib/dynamo/entities/webhook.entity.ts`
- Create: `apps/backend/src/lib/dynamo/index.ts`
- Create: `apps/frontend/lib/dynamo/client.ts` (thin re-export, Node.js runtime)
- Create: `apps/frontend/lib/dynamo/index.ts`

**Step 1: Install electrodb**
```bash
npm install electrodb @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb -w apps/backend
npm install electrodb @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb -w apps/frontend
```

**Step 2: Create DynamoDB client factory**

`apps/backend/src/lib/dynamo/client.ts`:
```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.DYNAMODB_REGION ?? "us-east-1",
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
});

export const docClient = DynamoDBDocumentClient.from(client);
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME ?? "worktree-local";
```

**Step 3: Write UserEntity**

`apps/backend/src/lib/dynamo/entities/user.entity.ts`:
```typescript
// GSI1PK: USER | GSI1SK: email
// Access patterns: getById (PK/SK), getByEmail (GSI1)
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client";

export const UserEntity = new Entity(
  {
    model: { entity: "user", version: "1", service: "worktree" },
    attributes: {
      userId: { type: "string", required: true },
      email: { type: "string", required: true },
      name: { type: "string" },
      passwordHash: { type: "string" },
      avatarKey: { type: "string" },
      role: { type: "string", default: "USER" },
      theme: { type: "string", default: "system" },
      createdAt: { type: "string", default: () => new Date().toISOString() },
      updatedAt: { type: "string", default: () => new Date().toISOString() },
    },
    indexes: {
      primary: {
        pk: { field: "PK", composite: ["userId"] },
        sk: { field: "SK", composite: [] },
      },
      byEmail: {
        index: "GSI1",
        pk: { field: "GSI1PK", composite: ["email"] },
        sk: { field: "GSI1SK", composite: [] },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
```

**Step 4: Write ProjectEntity**
```typescript
// GSI1PK: PROJECT | GSI1SK: createdAt (list all projects for admin)
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client";

export const ProjectEntity = new Entity(
  {
    model: { entity: "project", version: "1", service: "worktree" },
    attributes: {
      projectId: { type: "string", required: true },
      slug: { type: "string", required: true },
      name: { type: "string", required: true },
      description: { type: "string" },
      ownerId: { type: "string", required: true },
      settings: { type: "map", properties: {} },
      createdAt: { type: "string", default: () => new Date().toISOString() },
      updatedAt: { type: "string", default: () => new Date().toISOString() },
    },
    indexes: {
      primary: {
        pk: { field: "PK", composite: ["projectId"] },
        sk: { field: "SK", composite: [] },
      },
      bySlug: {
        index: "GSI1",
        pk: { field: "GSI1PK", composite: ["slug"] },
        sk: { field: "GSI1SK", composite: [] },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
```

**Step 5: Write ProjectMemberEntity**
```typescript
// PK: PROJECT#<projectId> | SK: MEMBER#<userId>
// GSI1PK: USER#<userId> | GSI1SK: PROJECT#<projectId> (list projects for user)
import { Entity } from "electrodb";
import { docClient, TABLE_NAME } from "../client";

export const ProjectMemberEntity = new Entity(
  {
    model: { entity: "projectMember", version: "1", service: "worktree" },
    attributes: {
      projectId: { type: "string", required: true },
      userId: { type: "string", required: true },
      roles: { type: "list", items: { type: "string" }, default: () => ["VIEWER"] },
      invitedBy: { type: "string" },
      joinedAt: { type: "string", default: () => new Date().toISOString() },
    },
    indexes: {
      primary: {
        pk: { field: "PK", composite: ["projectId"] },
        sk: { field: "SK", composite: ["userId"] },
      },
      byUser: {
        index: "GSI1",
        pk: { field: "GSI1PK", composite: ["userId"] },
        sk: { field: "GSI1SK", composite: ["projectId"] },
      },
    },
  },
  { table: TABLE_NAME, client: docClient }
);
```

**Step 6: Write remaining entities** (FormEntity, FormVersionEntity, SubmissionEntity, SheetEntity, SheetColumnEntity, SheetRowEntity, RouteEntity, RouteStopEntity, TaskEntity, AuditLogEntity, FileUploadEntity, VectorEmbeddingEntity, SyncLedgerEntity, HelpArticleEntity, ComplianceRecordEntity, PublicTokenEntity, ApiKeyEntity, WebhookEntity)

Follow the same pattern: each entity has:
- `PK`/`SK` for primary access
- `GSI1PK`/`GSI1SK` for secondary access patterns
- All writes use `projectId` in PK for tenant scoping: `PK: PROJECT#<projectId>`, `SK: ENTITY#<entityId>`

FormEntity PK: `PROJECT#<projectId>` / SK: `FORM#<formId>`
SubmissionEntity PK: `PROJECT#<projectId>` / SK: `SUBMISSION#<submissionId>` / GSI1PK: `FORM#<formId>` / GSI1SK: `createdAt`
SheetEntity PK: `PROJECT#<projectId>` / SK: `SHEET#<sheetId>`
SheetRowEntity PK: `SHEET#<sheetId>` / SK: `ROW#<rowId>`
TaskEntity PK: `PROJECT#<projectId>` / SK: `TASK#<taskId>`
AuditLogEntity PK: `PROJECT#<projectId>` / SK: `AUDIT#<timestamp>#<auditId>`
RouteEntity PK: `PROJECT#<projectId>` / SK: `ROUTE#<routeId>`
ApiKeyEntity PK: `APIKEY#<keyHash>` / SK: `APIKEY` / GSI1PK: `PROJECT#<projectId>`
HelpArticleEntity PK: `HELPARTICLE#<articleId>` / SK: `HELPARTICLE`
ComplianceRecordEntity PK: `PROJECT#<projectId>` / SK: `COMPLIANCE#<recordId>`
PublicTokenEntity PK: `TOKEN#<token>` / SK: `TOKEN`

**Step 7: Create barrel export**

`apps/backend/src/lib/dynamo/index.ts`:
```typescript
export { docClient, TABLE_NAME } from "./client";
export { UserEntity } from "./entities/user.entity";
export { ProjectEntity } from "./entities/project.entity";
export { ProjectMemberEntity } from "./entities/project-member.entity";
export { FormEntity } from "./entities/form.entity";
export { FormVersionEntity } from "./entities/form-version.entity";
export { SubmissionEntity } from "./entities/submission.entity";
export { SheetEntity } from "./entities/sheet.entity";
export { SheetColumnEntity } from "./entities/sheet-column.entity";
export { SheetRowEntity } from "./entities/sheet-row.entity";
export { RouteEntity } from "./entities/route.entity";
export { RouteStopEntity } from "./entities/route-stop.entity";
export { TaskEntity } from "./entities/task.entity";
export { AuditLogEntity } from "./entities/audit-log.entity";
export { FileUploadEntity } from "./entities/file-upload.entity";
export { VectorEmbeddingEntity } from "./entities/vector-embedding.entity";
export { SyncLedgerEntity } from "./entities/sync-ledger.entity";
export { HelpArticleEntity } from "./entities/help-article.entity";
export { ComplianceRecordEntity } from "./entities/compliance-record.entity";
export { PublicTokenEntity } from "./entities/public-token.entity";
export { ApiKeyEntity } from "./entities/api-key.entity";
export { WebhookEntity } from "./entities/webhook.entity";
```

**Step 8: Mirror client in frontend**

`apps/frontend/lib/dynamo/client.ts`:
```typescript
// Node.js runtime only — never add export const runtime = 'edge'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.DYNAMODB_REGION ?? "us-east-1",
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
});

export const docClient = DynamoDBDocumentClient.from(client);
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME ?? "worktree-local";
```

`apps/frontend/lib/dynamo/index.ts` — re-export all entities from `apps/backend/src/lib/dynamo/` via relative imports.

**Step 9: Run build**
```bash
npm run build
```
Expected: TypeScript compiles cleanly. Fix any type errors before proceeding.

**Step 10: Commit**
```bash
git add apps/backend/src/lib/dynamo/ apps/frontend/lib/dynamo/
git commit -m "feat(0.1): add ElectroDB entity definitions for all data models"
```

---

### Task 2: S3 Storage Service Swap (Story 0.2)

**Story file:** `_bmad-output/implementation-artifacts/0-2-s3-bucket-storage-service-swap.md` (read first)

**Files:**
- Modify: `apps/frontend/lib/storage.ts`
- Modify: `apps/backend/src/storage.ts`
- Delete: any file importing from `minio` package

**Step 1: Install s3-request-presigner if not present**
```bash
npm install @aws-sdk/s3-request-presigner @aws-sdk/client-s3 -w apps/frontend
npm install @aws-sdk/s3-request-presigner @aws-sdk/client-s3 -w apps/backend
```

**Step 2: Rewrite `apps/frontend/lib/storage.ts`**
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(process.env.S3_ENDPOINT && {
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "local",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "local",
    },
  }),
});

export const S3_BUCKET = process.env.S3_BUCKET ?? "worktree-local";

export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return rewriteForBrowser(url);
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return rewriteForBrowser(url);
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}

export async function ensureProjectFolder(projectId: string): Promise<void> {
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: `projects/${projectId}/.keep`,
    Body: "",
  }));
}

// Rewrite internal Docker hostname to host-accessible address for local dev
function rewriteForBrowser(url: string): string {
  if (process.env.S3_ENDPOINT?.includes("localstack")) {
    return url.replace("http://localstack:4510", "http://localhost:4510");
  }
  return url;
}
```

**Step 3: Rewrite `apps/backend/src/storage.ts`** — same pattern as above.

**Step 4: Remove minio package**
```bash
npm uninstall minio -w apps/backend
npm uninstall minio -w apps/frontend
```

**Step 5: Grep for remaining MINIO_ references and fix them**
```bash
grep -r "MINIO_" apps/ --include="*.ts" -l
```
Replace each `MINIO_*` env var reference with the corresponding `S3_*`/`AWS_*` var per the mapping in Story 0.2 AC.

**Step 6: Build and commit**
```bash
npm run build
git add apps/frontend/lib/storage.ts apps/backend/src/storage.ts
git commit -m "feat(0.2): swap MinIO SDK for AWS S3 SDK with LocalStack support"
```

---

### Task 3: NextAuth DynamoDB Adapter (Story 0.5)

**Story file:** `_bmad-output/implementation-artifacts/` — no dedicated file; use epics.md Story 0.5 AC.

**Files:**
- Modify: `apps/frontend/auth.ts`
- Modify: `apps/frontend/lib/db.ts` (delete after migration)
- Modify: `apps/frontend/lib/database.ts` (delete after migration)
- Create: `apps/frontend/lib/dynamo/auth-client.ts`

**Step 1: Install auth adapter**
```bash
npm install @auth/dynamodb-adapter -w apps/frontend
```

**Step 2: Create dedicated auth DynamoDB client**

`apps/frontend/lib/dynamo/auth-client.ts`:
```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Auth table is SEPARATE from the main app table (different key schema)
const client = new DynamoDBClient({
  region: process.env.DYNAMODB_REGION ?? "us-east-1",
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
});

export const authDocClient = DynamoDBDocumentClient.from(client);
export const AUTH_TABLE_NAME = process.env.DYNAMODB_AUTH_TABLE_NAME ?? "worktree-auth-local";
```

**Step 3: Update `apps/frontend/auth.ts`**
```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DynamoDBAdapter } from "@auth/dynamodb-adapter";
import { authDocClient, AUTH_TABLE_NAME } from "@/lib/dynamo/auth-client";
import { UserEntity } from "@/lib/dynamo";
import bcrypt from "bcrypt";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DynamoDBAdapter(authDocClient, { tableName: AUTH_TABLE_NAME }),
  session: { strategy: "database" },
  providers: [
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const result = await UserEntity.query.byEmail({ email }).go();
        const user = result.data[0];
        if (!user || !user.passwordHash) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        return { id: user.userId, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (user) session.user.id = user.id;
      return session;
    },
  },
});
```

**Step 4: Delete legacy Prisma db files**
```bash
rm apps/frontend/lib/db.ts
rm apps/frontend/lib/database.ts
```

**Step 5: Build to catch all import errors**
```bash
npm run build 2>&1 | grep "lib/db\|lib/database"
```
Fix each import by replacing `from "@/lib/db"` or `from "@/lib/database"` with entity imports from `@/lib/dynamo`.

**Step 6: Commit**
```bash
git commit -m "feat(0.5): replace Prisma auth adapter with @auth/dynamodb-adapter"
```

---

### Task 4: Integration Test Infrastructure (Story 0.9)

**Story file:** `_bmad-output/implementation-artifacts/0-9-integration-test-infrastructure-dynamodb.md` (read first)

**Files:**
- Create: `tests/setup/dynamodb.ts`
- Create: `vitest.config.ts` (modify if exists)
- Delete: all `*.test.ts` files that import from Prisma

**Step 1: Install vitest-dynalite**
```bash
npm install -D vitest-dynalite vitest -w apps/backend
npm install -D vitest-dynalite vitest -w apps/frontend
```

**Step 2: Delete stale Prisma-based test files**
```bash
# Find all test files importing Prisma and delete them
grep -rl "@prisma/client\|from.*prisma-client\|from.*lib/db\|from.*lib/database" apps/ --include="*.test.ts" -l
# Delete each found file
rm apps/frontend/test/rls-integration.test.ts
rm apps/frontend/test/audit-security.test.ts
rm apps/frontend/features/users/server/invite-actions.test.ts
# Check for any others and remove them too
```

**Step 3: Create test setup**

`tests/setup/dynamodb.ts`:
```typescript
import { setup, teardown } from "vitest-dynalite";
import { beforeAll, afterAll, beforeEach } from "vitest";
import { CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export function setupDynamodbTests() {
  setup();

  beforeAll(async () => {
    const client = new DynamoDBClient({
      endpoint: "http://localhost:8000", // vitest-dynalite default
      region: "us-east-1",
      credentials: { accessKeyId: "local", secretAccessKey: "local" },
    });

    try {
      await client.send(new CreateTableCommand({
        TableName: "worktree-test",
        KeySchema: [
          { AttributeName: "PK", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" },
        ],
        AttributeDefinitions: [
          { AttributeName: "PK", AttributeType: "S" },
          { AttributeName: "SK", AttributeType: "S" },
          { AttributeName: "GSI1PK", AttributeType: "S" },
          { AttributeName: "GSI1SK", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [{
          IndexName: "GSI1",
          KeySchema: [
            { AttributeName: "GSI1PK", KeyType: "HASH" },
            { AttributeName: "GSI1SK", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        }],
        BillingMode: "PAY_PER_REQUEST",
      }));
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== "ResourceInUseException") throw e;
    }
  });

  afterAll(teardown);
}
```

**Step 4: Configure vitest**

`apps/backend/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import { config } from "vitest-dynalite";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["../../tests/setup/dynamodb.ts"],
    ...config,
  },
});
```

**Step 5: Write first integration test**

`apps/backend/src/lib/dynamo/entities/__tests__/user.entity.test.ts`:
```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { setupDynamodbTests } from "../../../../../../tests/setup/dynamodb";
import { UserEntity } from "../user.entity";
import { nanoid } from "nanoid";

setupDynamodbTests();

describe("UserEntity", () => {
  it("creates and retrieves a user by id", async () => {
    const userId = nanoid();
    const email = `test-${userId}@test.com`;

    await UserEntity.create({ userId, email, name: "Test User" }).go();

    const result = await UserEntity.query.primary({ userId }).go();
    expect(result.data[0]?.email).toBe(email);
  });

  it("finds user by email via GSI1", async () => {
    const userId = nanoid();
    const email = `gsi-${userId}@test.com`;

    await UserEntity.create({ userId, email, name: "GSI User" }).go();

    const result = await UserEntity.query.byEmail({ email }).go();
    expect(result.data[0]?.userId).toBe(userId);
  });
});
```

**Step 6: Run integration tests**
```bash
npm run test:integration -w apps/backend
```
Expected: PASS

**Step 7: Commit**
```bash
git commit -m "feat(0.9): add vitest-dynalite integration test infrastructure"
```

---

### Task 5: Seed Script (Story 0.8)

**Story file:** `_bmad-output/implementation-artifacts/` — use epics.md Story 0.8 AC

**Files:**
- Rewrite: `scripts/seed-dev.sh`

**Step 1: Rewrite seed script**

`scripts/seed-dev.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:8100}"
TABLE="${DYNAMODB_TABLE_NAME:-worktree-local}"
AUTH_TABLE="${DYNAMODB_AUTH_TABLE_NAME:-worktree-auth-local}"
S3_ENDPOINT="${S3_ENDPOINT:-http://localhost:4510}"
S3_BUCKET="${S3_BUCKET:-worktree-local}"
REGION="${AWS_REGION:-us-east-1}"

echo "=== Step 1: Create S3 bucket ==="
aws s3 mb "s3://${S3_BUCKET}" --endpoint-url "${S3_ENDPOINT}" --region "${REGION}" 2>/dev/null || echo "Bucket already exists, continuing..."

echo "=== Step 2: Create main DynamoDB table ==="
aws dynamodb create-table \
  --table-name "${TABLE}" \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --global-secondary-indexes '[{"IndexName":"GSI1","KeySchema":[{"AttributeName":"GSI1PK","KeyType":"HASH"},{"AttributeName":"GSI1SK","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"},"ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}}]' \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url "${ENDPOINT}" \
  --region "${REGION}" 2>/dev/null || echo "Table already exists, continuing..."

echo "=== Step 2b: Create auth DynamoDB table ==="
aws dynamodb create-table \
  --table-name "${AUTH_TABLE}" \
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --global-secondary-indexes '[{"IndexName":"GSI1","KeySchema":[{"AttributeName":"GSI1PK","KeyType":"HASH"},{"AttributeName":"GSI1SK","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"},"ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}}]' \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url "${ENDPOINT}" \
  --region "${REGION}" 2>/dev/null || echo "Auth table already exists, continuing..."

echo "=== Step 3: Seed dev users ==="
# Passwords are bcrypt hash of "password" (10 rounds)
HASH='$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u'

ADMIN_ID="user_admin_dev"
USER_ID="user_member_dev"

aws dynamodb put-item \
  --table-name "${TABLE}" \
  --item "{\"PK\":{\"S\":\"USER#${ADMIN_ID}\"},\"SK\":{\"S\":\"USER\"},\"GSI1PK\":{\"S\":\"admin@worktree.pro\"},\"GSI1SK\":{\"S\":\"USER\"},\"userId\":{\"S\":\"${ADMIN_ID}\"},\"email\":{\"S\":\"admin@worktree.pro\"},\"name\":{\"S\":\"Admin User\"},\"passwordHash\":{\"S\":\"${HASH}\"},\"role\":{\"S\":\"ADMIN\"},\"createdAt\":{\"S\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},\"updatedAt\":{\"S\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}" \
  --condition-expression "attribute_not_exists(PK)" \
  --endpoint-url "${ENDPOINT}" --region "${REGION}" 2>/dev/null || echo "Admin user already seeded"

aws dynamodb put-item \
  --table-name "${TABLE}" \
  --item "{\"PK\":{\"S\":\"USER#${USER_ID}\"},\"SK\":{\"S\":\"USER\"},\"GSI1PK\":{\"S\":\"user@worktree.com\"},\"GSI1SK\":{\"S\":\"USER\"},\"userId\":{\"S\":\"${USER_ID}\"},\"email\":{\"S\":\"user@worktree.com\"},\"name\":{\"S\":\"Test User\"},\"passwordHash\":{\"S\":\"${HASH}\"},\"role\":{\"S\":\"USER\"},\"createdAt\":{\"S\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},\"updatedAt\":{\"S\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}" \
  --condition-expression "attribute_not_exists(PK)" \
  --endpoint-url "${ENDPOINT}" --region "${REGION}" 2>/dev/null || echo "Test user already seeded"

echo "=== Step 4: Seed sample project ==="
PROJECT_ID="proj_dev_sample"
aws dynamodb put-item \
  --table-name "${TABLE}" \
  --item "{\"PK\":{\"S\":\"PROJECT#${PROJECT_ID}\"},\"SK\":{\"S\":\"PROJECT\"},\"GSI1PK\":{\"S\":\"sample-project\"},\"GSI1SK\":{\"S\":\"PROJECT\"},\"projectId\":{\"S\":\"${PROJECT_ID}\"},\"slug\":{\"S\":\"sample-project\"},\"name\":{\"S\":\"Sample Project\"},\"ownerId\":{\"S\":\"${ADMIN_ID}\"},\"createdAt\":{\"S\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},\"updatedAt\":{\"S\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}" \
  --condition-expression "attribute_not_exists(PK)" \
  --endpoint-url "${ENDPOINT}" --region "${REGION}" 2>/dev/null || echo "Sample project already seeded"

echo ""
echo "Seed complete. Dev credentials:"
echo "  Admin:  admin@worktree.pro / password"
echo "  User:   user@worktree.com  / password"
```

**Step 2: Make executable and test**
```bash
chmod +x scripts/seed-dev.sh
# Run against local docker stack:
bash scripts/seed-dev.sh
```
Expected: All steps complete without error.

**Step 3: Commit**
```bash
git commit -m "feat(0.8): replace Prisma seed with DynamoDB/LocalStack seed script"
```

---

### Task 6: Environment Variable Migration (Story 0.7)

**Story file:** use epics.md Story 0.7 AC

**Files:**
- Modify: `.env.example`
- Delete: any `DATABASE_URL` references in all `.env*` files

**Step 1: Rewrite `.env.example`**
```bash
# ─── Application ──────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3005
BACKEND_PORT=5005

# Auth.js (NextAuth v5) — use 32+ character secret
AUTH_SECRET=change-me-to-a-32-plus-character-secret
NEXTAUTH_URL=http://localhost:3005

# ─── AWS / DynamoDB ────────────────────────────────────────────────────────────
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=worktree-local
DYNAMODB_AUTH_TABLE_NAME=worktree-auth-local
# Local dev only — omit in production:
DYNAMODB_ENDPOINT=http://dynamodb-local:8100
DYNAMODB_REGION=us-east-1

# ─── S3 / LocalStack ──────────────────────────────────────────────────────────
S3_BUCKET=worktree-local
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
# Local dev only — omit in production:
S3_ENDPOINT=http://localstack:4510

# ─── Redis / ElastiCache ──────────────────────────────────────────────────────
REDIS_URL=redis://redis:6380

# ─── Pinecone ─────────────────────────────────────────────────────────────────
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=worktree-local
# Local dev only (opt-in with --profile pinecone):
# PINECONE_HOST=http://pinecone-local:5080

# ─── AI ───────────────────────────────────────────────────────────────────────
OPENAI_API_KEY=your-openai-api-key

# ─── Public Variables ─────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:5005
NEXT_PUBLIC_WS_URL=ws://localhost:1234
```

**Step 2: Remove DATABASE_URL from all files**
```bash
grep -r "DATABASE_URL\|MINIO_" . --include="*.env*" --include="*.example" -l
# Edit each file to remove those lines
```

**Step 3: Commit**
```bash
git commit -m "feat(0.7): migrate env vars to AWS stack (remove DATABASE_URL, MINIO_*)"
```

---

### Task 7: Redis-Backed Next.js Cache Handler (Story 0.10)

**Files:**
- Create: `apps/frontend/lib/cache-handler.js`
- Modify: `apps/frontend/next.config.ts`

**Step 1: Install ioredis**
```bash
npm install ioredis -w apps/frontend
```

**Step 2: Create cache handler**

`apps/frontend/lib/cache-handler.js`:
```javascript
const { Redis } = require("ioredis");

let redis;
function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6380", {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return redis;
}

module.exports = class CacheHandler {
  constructor() {}

  async get(key) {
    try {
      const value = await getRedis().get(`nextjs:${key}`);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set(key, data, ctx) {
    const ttl = ctx?.revalidate ? ctx.revalidate : 3600;
    try {
      await getRedis().setex(`nextjs:${key}`, ttl, JSON.stringify(data));
    } catch {}
  }

  async revalidateTag(tag) {
    // Scan and delete all keys tagged with this tag
    // Simple implementation: skip for now (tags work via full revalidation)
  }
};
```

**Step 3: Update next.config.ts**
```typescript
// Add to NextConfig:
cacheMaxMemorySize: 0,
cacheHandler: require.resolve("./lib/cache-handler.js"),
```

**Step 4: Build**
```bash
npm run build -w apps/frontend
```

**Step 5: Commit**
```bash
git commit -m "feat(0.10): add Redis-backed Next.js cache handler for stateless Fargate"
```

---

### Task 8: GitHub Actions / ECS Pipeline (Story 0.6)

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `infrastructure/` (CDK stack — placeholder, flesh out after MVP)

**Step 1: Create GitHub Actions workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to ECS

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com
  APP_REPO: worktree-app
  WS_REPO: worktree-ws

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      - uses: aws-actions/amazon-ecr-login@v2
      - name: Build and push app image
        run: |
          docker build -t $ECR_REGISTRY/$APP_REPO:${{ github.sha }} .
          docker push $ECR_REGISTRY/$APP_REPO:${{ github.sha }}
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster worktree-prod \
            --service worktree-app \
            --force-new-deployment
          aws ecs update-service \
            --cluster worktree-prod \
            --service worktree-ws \
            --force-new-deployment
```

**Step 2: Commit**
```bash
git commit -m "feat(0.6): add GitHub Actions ECS deployment pipeline"
```

---

## PHASE 1b: Sanitization (Parallel with Phase 1 — Stories 0.12–0.22)

> These can run while Phase 1 foundation tasks proceed. They are code-quality sweeps.
> Each sweep: find → fix → build → test → commit.

---

### Task 9: Remove Prisma/Legacy Code (Story 0.12)

**Files to delete:**
- `apps/backend/src/db.ts`
- `apps/backend/src/seed.ts`
- `apps/frontend/test-db.ts`
- `apps/frontend/test-db-direct.ts`
- `apps/frontend/debug-policies.ts`
- `apps/frontend/repro-rls.ts`
- `apps/frontend/scaffold-test-isolation.ts`
- `apps/frontend/list_sheets.ts`
- `apps/frontend/debug-sheet-data.ts`
- `apps/backend/scripts/check-users.ts`
- `apps/backend/scripts/seed-users.ts`
- `apps/backend/scripts/cleanup.ts`
- `apps/frontend/generated/` (entire directory — old Prisma generated client)
- `apps/frontend/lib/prisma-client/` (entire directory)

**Step 1: Delete legacy files**
```bash
rm -f apps/backend/src/db.ts
rm -f apps/backend/src/seed.ts
rm -f apps/frontend/test-db.ts apps/frontend/test-db-direct.ts
rm -f apps/frontend/debug-policies.ts apps/frontend/repro-rls.ts
rm -f apps/frontend/scaffold-test-isolation.ts apps/frontend/list_sheets.ts
rm -f apps/frontend/debug-sheet-data.ts
rm -f apps/backend/scripts/check-users.ts apps/backend/scripts/seed-users.ts
rm -f apps/backend/scripts/cleanup.ts
rm -rf apps/frontend/generated/
rm -rf apps/frontend/lib/prisma-client/
```

**Step 2: Remove Prisma packages**
```bash
npm uninstall prisma @prisma/client @auth/prisma-adapter -w apps/frontend
npm uninstall prisma @prisma/client -w apps/backend
```

**Step 3: Grep for remaining Prisma imports**
```bash
grep -r "from.*prisma\|import.*Prisma\|@prisma" apps/ --include="*.ts" --include="*.tsx" -l
```
For each file found, replace the Prisma import with the appropriate ElectroDB entity import.

**Step 4: Replace "RFI" with "Task" globally**
```bash
grep -r "RFI\b" apps/ --include="*.ts" --include="*.tsx" -l
# For each: sed -i 's/\bRFI\b/Task/g; s/\brfi\b/task/g' <file>
```

**Step 5: Build**
```bash
npm run build
```
Fix all errors before proceeding.

**Step 6: Commit**
```bash
git commit -m "feat(0.12): remove all Prisma/legacy code, replace RFI with Task"
```

---

### Task 10: Code Quality Sweep (Stories 0.14–0.22)

Run each sweep as a targeted find-and-fix. For each story:

**0.14 — Remove `any` types and console.log**
```bash
grep -r "console\.log\|: any\b\|as any\b" apps/ --include="*.ts" --include="*.tsx" -l
```
- Replace `: any` with proper types (use `unknown` then narrow, or define interfaces)
- Remove debug `console.log` from production logic (keep `console.error` with structured context)
- Remove `eslint-disable` suppressions; fix the underlying issue instead

**0.15 — Inline styles → Tailwind**
```bash
grep -r "style={{" apps/ --include="*.tsx" -l
```
- Convert `style={{ color: '#...' }}` → `className="text-..."` using design tokens
- Replace raw `formData.get()` with Zod schema parsing

**0.16 — localStorage → server-side / Zustand**
```bash
grep -r "localStorage\|sessionStorage\|\.then(.*\.catch\|setTimeout\|setInterval" apps/ --include="*.ts" --include="*.tsx" -l
```
- Move `localStorage` reads to server actions or Zustand persist middleware
- Convert `.then().catch()` chains to `async/await`
- Wrap `setTimeout`/`setInterval` in `useEffect` with cleanup

**0.17 — Next.js anti-patterns**
```bash
grep -r "<a href\|window\.location\b\|fetch(" apps/ --include="*.tsx" -l
```
- Replace `<a href="...">` with `<Link href="...">`
- Add `rel="noopener noreferrer"` to all `target="_blank"`
- Replace raw `fetch()` with typed server actions

**0.18 — Type safety + error boundaries**
```bash
grep -r "as any\|@ts-expect-error\|@ts-ignore\|return null" apps/ --include="*.tsx" -l
```
- Replace `as any` with proper types
- Replace `return null` on bad props with `<Skeleton>` or `<ErrorBoundary>`
- Replace hardcoded hex colors with `hsl()` CSS variables

**0.19 — console + TODO cleanup**
```bash
grep -r "console\.log\|console\.error\|TODO\|FIXME\|HACK\|z-\[9999\]" apps/ --include="*.ts" --include="*.tsx" -l
```
- Port `console.log` to structured logging (simple wrapper: `import { log } from '@/lib/logger'`)
- Create `apps/frontend/lib/logger.ts` with `export const log = { info: ..., error: ..., warn: ... }`
- Replace `z-[9999]` with design system token

**0.20 — Framework bypasses**
```bash
grep -r "window\.location\.href\|<input\b\|<select\b" apps/ --include="*.tsx" -l
```
- Replace `window.location.href = ...` with `router.push(...)`
- Replace raw `<input>` with `<Input>` from `@/components/ui/input`

**0.21 — XSS + Docker networking**
```bash
grep -r "dangerouslySetInnerHTML\|localhost\|127\.0\.0\.1" apps/ --include="*.ts" --include="*.tsx" -l
```
- Install `dompurify` and wrap all `dangerouslySetInnerHTML` with `DOMPurify.sanitize()`
- Replace hardcoded `localhost` with environment variables

**0.22 — Polish**
```bash
grep -r "eslint-disable react-hooks/exhaustive-deps\|alert(\|confirm(" apps/ --include="*.tsx" -l
```
- Fix `exhaustive-deps` by wrapping callback in `useCallback`
- Replace `alert()` with `<AlertDialog>` from shadcn
- Add `role="button"` or convert clickable `<div>` to `<button>`

**After each sweep: build and commit**
```bash
npm run build && git commit -m "fix(0.XX): [description of sweep]"
```

---

## PHASE 2: Feature Epics (Parallel after Phase 1 complete)

> Once Phase 1 is complete and `npm run build` passes cleanly, dispatch parallel agents for each epic cluster.
> Each agent reads its story file(s) before implementing. Each story follows TDD: test first, then implementation.
> After each epic: run full test suite, adversarial review, fix all findings.

---

### Task 11: Epic 1 — Core Project Foundation (Agent: Foundation)

**Stories:** 1.1 (MinIO→S3 ref update), 1.3 (RBAC rewrite), 1.4 (Avatar upload S3), 1.10 (i18n)
**Story files:** `_bmad-output/implementation-artifacts/1-1-*.md`, `1-3-*.md`, `1-4-*.md`

**1.1 — Project creation with S3**

File: `apps/frontend/features/projects/server/project-actions.ts`

Replace Prisma calls:
```typescript
// BEFORE:
const projects = await db.project.findMany({ where: { members: { some: { userId } } } });

// AFTER:
import { ProjectMemberEntity, ProjectEntity } from "@/lib/dynamo";

export async function getProjects() {
  const session = await auth();
  if (!session?.user?.id) return [];

  // Find all project memberships for this user
  const memberships = await ProjectMemberEntity.query.byUser({ userId: session.user.id }).go();

  // Fetch each project
  const projects = await Promise.all(
    memberships.data.map(m =>
      ProjectEntity.query.primary({ projectId: m.projectId }).go()
    )
  );

  return projects.flatMap(r => r.data).filter(Boolean);
}

export async function createProject(data: ProjectData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const projectId = nanoid();
  const slug = data.name.toLowerCase().replace(/\s+/g, "-") + "-" + nanoid(6);

  await ProjectEntity.create({ projectId, slug, name: data.name, description: data.description, ownerId: session.user.id }).go();
  await ProjectMemberEntity.create({ projectId, userId: session.user.id, roles: ["OWNER"] }).go();
  await ensureProjectFolder(projectId);

  revalidatePath("/dashboard");
  return { projectId, slug };
}
```

**1.3 — RBAC middleware rewrite**

File: `apps/backend/src/middleware/rbac.ts` (create if not exists, rewrite if exists)
```typescript
import { Request, Response, NextFunction } from "express";
import { ProjectMemberEntity } from "../lib/dynamo";

export function requireProjectAccess(minRole: "VIEWER" | "EDITOR" | "ADMIN" | "OWNER" = "VIEWER") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const projectId = req.params.projectId ?? req.body.projectId;
    const userId = (req as { user?: { id: string } }).user?.id;

    if (!userId || !projectId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await ProjectMemberEntity.query.primary({ projectId, userId }).go();
    const member = result.data[0];

    if (!member) {
      return res.status(403).json({ success: false, error: "Not a project member" });
    }

    const roleHierarchy = ["VIEWER", "EDITOR", "ADMIN", "OWNER"];
    const userMaxRole = member.roles.reduce((max: string, role: string) => {
      return roleHierarchy.indexOf(role) > roleHierarchy.indexOf(max) ? role : max;
    }, "VIEWER");

    if (roleHierarchy.indexOf(userMaxRole) < roleHierarchy.indexOf(minRole)) {
      return res.status(403).json({ success: false, error: "Insufficient permissions" });
    }

    next();
  };
}
```

**Tests:** Write integration tests for RBAC middleware using vitest-dynalite.

**Commit:** `git commit -m "feat(epic-1): rewrite project actions and RBAC for DynamoDB"`

---

### Task 12: Epic 2 — Form Builder (Agent: Forms)

**Stories:** 2.1, 2.2, 2.3, 2.6
**Story files:** `_bmad-output/implementation-artifacts/2-1-*.md`, `2-2-*.md`, `2-3-*.md`, `2-6-*.md`

**2.1 — Drag-and-drop form builder**
- Read `_bmad-output/implementation-artifacts/2-1-drag-and-drop-form-builder.md` for full AC
- Key files: `apps/frontend/features/forms/` directory
- Install `@dnd-kit/core @dnd-kit/sortable` if not present
- Replace any Prisma form queries with FormEntity/FormVersionEntity ElectroDB calls

**2.2 — Field validation**
- Read `2-2-field-validation-logic.md`
- Key file: `apps/frontend/lib/conditional-logic/` (already exists — verify DynamoDB integration)

**2.3 — Smart Table field**
- Read `2-3-smart-table-field.md`
- New field type in form builder that renders an embedded mini-grid

**2.6 — Retroactive renaming** (BullMQ + S3)
- File: `apps/backend/src/services/migration-service.ts` — rewrite to use DynamoDB instead of Prisma
- BullMQ job in `apps/backend/src/jobs/workers/file-rename.worker.ts`

**Commit:** `git commit -m "feat(epic-2): form builder, validation, smart table, retroactive rename"`

---

### Task 13: Epic 4 — Submission Lifecycle (Agent: Submissions)

**Stories:** 4.2 (image upload MinIO→S3)
**Story files:** `_bmad-output/implementation-artifacts/4-2-*.md`

**4.2 — Image optimization with S3**
- File: `apps/frontend/lib/image-optimizer.ts` — update to use S3 presigned upload URLs
- File: `apps/backend/src/services/upload.service.ts` — update S3 client references
- Remove any `MINIO_*` env var references

**Commit:** `git commit -m "feat(epic-4): update image upload to use S3/LocalStack"`

---

### Task 14: Epic 5 — Smart Grid Mission Control (Agent: Dashboard)

**Stories:** 5.1, 5.2, 5.3, 5.4
**Story files:** `_bmad-output/implementation-artifacts/5-1-*.md`, `5-2-*.md`

**5.1 — Dashboard metrics (Prisma→DynamoDB)**
- Replace Prisma aggregate queries with DynamoDB queries
- Use `ProjectMemberEntity`, `SubmissionEntity` counts via `query().where().go()`
- File: `apps/backend/src/routes/dashboard.routes.ts`

**5.2 — Data grid custom columns**
- Read `5-2-data-grid-custom-columns.md` for full AC
- File: `apps/frontend/features/sheets/` components

**5.3 — Lightbox/media ZIP (MinIO→S3)**
- Update ZIP job in BullMQ workers to use S3 client
- File: `apps/backend/src/jobs/workers/` (ZIP worker)

**5.4 — FinOps quotas (Prisma→DynamoDB)**
- Replace `ProjectSettingsEntity` Prisma calls with DynamoDB
- Track storage quota in `ProjectEntity.settings`

**Commit:** `git commit -m "feat(epic-5): dashboard metrics, custom columns, quotas via DynamoDB"`

---

### Task 15: Epic 6 — Live Smart Grid (Agent: Grid)

**Stories:** 6.1–6.14 (all ready-for-dev)
**Story files:** `_bmad-output/implementation-artifacts/6-*.md` — read each one

**Key architecture:**
- `SheetEntity`, `SheetColumnEntity`, `SheetRowEntity` via ElectroDB
- Hocuspocus WebSocket server in `apps/backend/src/ws-server.ts`
- Yjs `Y.Map` per row, CRDT merge on conflict
- File: `apps/frontend/features/sheets/useSheetSync.ts`

**6.1 — High-performance data viewing**
```typescript
// apps/frontend/features/sheets/server/sheet-actions.ts
export async function getSheetRows(sheetId: string, projectId: string) {
  await requireProjectAccessServer(projectId);
  const rows = await SheetRowEntity.query.primary({ sheetId }).go();
  return rows.data;
}
```

**6.2 — Real-time Yjs sync**
- Update `apps/backend/src/ws-server.ts` to remove Prisma, use DynamoDB persistence
- Hocuspocus `onLoadDocument` / `onChange` hooks save to `SheetRowEntity`

**6.3–6.14** — Implement each story in order per AC in story files.

**Commit per story:** `git commit -m "feat(6.X): [story title]"`

---

### Task 16: Epic 7 — Document Control (Agent: Docs)

**Stories:** 7.2 (pgvector→Pinecone)
**Story file:** `_bmad-output/implementation-artifacts/7-2-spec-library-search.md`

**7.2 — Spec library search via Pinecone**
- Install `@pinecone-database/pinecone` if not present
- Create `apps/backend/src/services/vector-search.ts`
- Update `apps/backend/src/services/spec.service.ts` to use Pinecone

```typescript
// apps/backend/src/services/vector-search.ts
import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index(process.env.PINECONE_INDEX_NAME ?? "worktree-local");

export async function upsertEmbedding(id: string, vector: number[], metadata: Record<string, string>) {
  await index.upsert([{ id, values: vector, metadata }]);
}

export async function queryEmbeddings(vector: number[], projectId: string, topK = 5) {
  return index.query({ vector, topK, filter: { projectId }, includeMetadata: true });
}
```

**Commit:** `git commit -m "feat(epic-7): replace pgvector with Pinecone for spec library search"`

---

### Task 17: Epic 8 — Legacy Integration (Agent: Import)

**Stories:** 8.3 (bulk import MinIO→S3)
**Story file:** `_bmad-output/implementation-artifacts/8-3-bulk-import-wizard.md`

**8.3 — Bulk import via S3**
- File: `apps/backend/src/services/import.service.ts` — update to S3 client
- Replace MinIO upload pattern with S3 presigned upload

**Commit:** `git commit -m "feat(epic-8): bulk import wizard uses S3 for file staging"`

---

### Task 18: Epic 9 — Compliance & Access (Agent: Compliance)

**Stories:** 9.1, 9.2
**Story files:** `_bmad-output/implementation-artifacts/9-1-*.md`, `9-2-*.md`

**9.1 — Visa wizard (Prisma→DynamoDB)**
- File: `apps/backend/src/services/compliance.service.ts` — replace Prisma with `ComplianceRecordEntity`

**9.2 — Public link sharing (Prisma→DynamoDB)**
- File: `apps/backend/src/services/share.service.ts` — replace Prisma with `PublicTokenEntity`

**Commit:** `git commit -m "feat(epic-9): compliance and public sharing via DynamoDB"`

---

### Task 19: Epic 10 — AI Layer (Agent: AI)

**Stories:** 10.1 (pgvector→Pinecone RAG), 10.6 (OpenAPI docs)
**Story file:** `_bmad-output/implementation-artifacts/`

**10.1 — RAG ingestion via Pinecone**
- File: `apps/backend/src/services/embedding.service.ts` — rewrite to use Pinecone + OpenAI embeddings
- File: `apps/backend/src/services/ai.service.ts` — update retrieval to use `queryEmbeddings()`

```typescript
// apps/backend/src/services/embedding.service.ts
import OpenAI from "openai";
import { upsertEmbedding } from "./vector-search";
import { VectorEmbeddingEntity } from "../lib/dynamo";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedAndStore(text: string, projectId: string, submissionId: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  const vector = response.data[0].embedding;
  const embeddingId = `${projectId}:${submissionId}`;

  await upsertEmbedding(embeddingId, vector, { projectId, submissionId });
  await VectorEmbeddingEntity.create({
    embeddingId, projectId, submissionId,
    pineconeId: embeddingId
  }).go();
}
```

**10.6 — OpenAPI/Swagger docs**
- Install `swagger-jsdoc swagger-ui-express`
- Add JSDoc `@openapi` annotations to all Express routes
- Mount Swagger UI at `/api/docs`

**Commit:** `git commit -m "feat(epic-10): Pinecone RAG ingestion and OpenAPI docs"`

---

### Task 20: Epic 11 — Help Center (Agent: Help)

**Stories:** 11.1, 11.3
**Story files:** `_bmad-output/implementation-artifacts/11-1-*.md`, `11-3-*.md`

**11.1 — Help article editor (Prisma→DynamoDB)**
- File: `apps/backend/src/services/help-article.service.ts` — replace Prisma with `HelpArticleEntity`
- File: `apps/frontend/lib/help-storage.ts` — update to use ElectroDB

**11.3 — Shake feedback**
- Read story file for AC
- Mobile gesture detection + feedback form submission

**Commit:** `git commit -m "feat(epic-11): help article editor via DynamoDB, shake feedback"`

---

## PHASE 3: Post-Epic Testing & Adversarial Review

> Run after EACH epic cluster completes. Fix ALL findings before marking epic done.

### Per-Epic Test & Review Protocol

**Step 1: Run full test suite**
```bash
npm run test
npm run test:integration
npm run build
npm run lint
```
All must pass with zero errors.

**Step 2: Adversarial review checklist**

For each epic, verify:
- [ ] No `console.log` in production code paths
- [ ] No hardcoded credentials or env var values
- [ ] All DynamoDB calls scoped by `projectId` via `requireProjectAccess`
- [ ] All API inputs validated with Zod schemas
- [ ] No `as any` casts introduced
- [ ] No raw `<a>` tags (use `<Link>`)
- [ ] No raw `localStorage` (use Zustand/server)
- [ ] Presigned URLs rewritten for local dev
- [ ] Grep: `grep -r "Prisma\|MinIO\|DATABASE_URL\|RFI\b" apps/ --include="*.ts" --include="*.tsx"` returns zero matches
- [ ] `npm audit` clean (or findings documented)
- [ ] Error states render `<Skeleton>` or `<ErrorBoundary>`, not `return null`

**Step 3: Auto-fix findings**

For each finding from step 2: create a focused fix commit:
```bash
git commit -m "fix(epic-X): [specific finding description]"
```

**Step 4: Update sprint-status.yaml**

After each epic is complete and all tests pass:
```bash
# Edit _bmad-output/implementation-artifacts/sprint-status.yaml
# Change epic status from in-progress to done
# Change all story statuses to done
git commit -m "chore: mark epic-X done in sprint-status.yaml"
```

---

## PHASE 4: Final Validation

### Task 21: End-to-End Smoke Test

```bash
# Start full local stack
docker compose up --watch &
sleep 30

# Seed dev data
bash scripts/seed-dev.sh

# Verify health endpoint
curl -f http://localhost:3005/api/health
# Expected: {"status":"ok","dynamodb":"connected","redis":"connected"}

# Verify login works
# Open browser: http://localhost:3005
# Login: admin@worktree.pro / password
# Verify dashboard loads and shows sample project
```

### Task 22: Final grep sweep
```bash
# Must return zero matches:
grep -r "Prisma\|MinIO\|DATABASE_URL\|@prisma\|prisma-client\|RFI\b" \
  apps/ --include="*.ts" --include="*.tsx" --include="*.json" \
  --exclude-dir=node_modules --exclude-dir=.next
```

### Task 23: Push to production
```bash
npm run test
npm run build
git push origin main
# GitHub Actions picks up, builds ECR image, deploys to ECS
# Monitor: aws ecs describe-services --cluster worktree-prod --services worktree-app
```

---

## Sprint Status Update Reference

After completing each story, update `_bmad-output/implementation-artifacts/sprint-status.yaml`:
- Story: `backlog` → `in-progress` → `done`
- Epic: `in-progress` → `done` (when ALL stories are done)

---

## Key Rules (repeat for every agent)

1. **Read the story file before implementing** — the AC is the contract
2. **TDD** — write the failing test first, then implement
3. **Never mock DynamoDB SDK** — use vitest-dynalite
4. **Never add `export const runtime = 'edge'`** to files using DynamoDB/S3/Pinecone
5. **All DB calls scoped by projectId** via `requireProjectAccess()` before any query
6. **No `as any`** — use `unknown` then narrow or define proper types
7. **Build must pass** before committing
8. **Commit after each task** with conventional commit message
