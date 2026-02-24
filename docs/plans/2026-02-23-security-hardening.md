# Security Hardening & Quality Remediation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 50 adversarial review findings covering critical security vulnerabilities, authorization gaps, infrastructure hardening, and documentation sync.

**Architecture:** Changes span backend Express routes/middleware, frontend Next.js components/hooks, Docker/compose config, Dockerfile multi-stage build, and documentation. Issues are grouped by risk level and dependency order — critical auth/secrets first, then authorization, then hardening, then quality/docs.

**Tech Stack:** Next.js 14 App Router, Express.js, Prisma, JWT (jsonwebtoken), bcrypt, Docker Compose, PM2, MinIO, Redis/BullMQ, TypeScript strict mode.

---

## ⚠️ PRE-TASK: Manual Credential Rotation (REQUIRED BEFORE ANY CODE CHANGES)

These steps cannot be automated — the developer must do them manually before starting.

**Step 1: Rotate all exposed credentials**
The following are in git history and MUST be rotated at their respective services:
- `JWT_SECRET=wt_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0` → generate new 64-char random secret
- `MINIO_SECRET_KEY=1jzyutenyjaallul` → rotate in MinIO console
- `NOCODB_API_TOKEN=-2AJY26lLt-JKuOOeYeIAd3FfoIy13IC4WW1Tkam` → regenerate in NocoDB
- Backend `.env` database password → rotate in Dokploy database settings

Generate a new JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Step 2: Remove `.env` from git history**
```bash
# Install BFG if needed: https://rtyley.github.io/bfg-repo-cleaner/
# Or use git filter-repo (preferred):
pip install git-filter-repo
git filter-repo --path .env --invert-paths --force
# Then force-push (coordinate with team):
git push origin --force --all
```

**Step 3: Update `.gitignore` to ensure .env is ignored** (verify it's present — it should already be there).

**Step 4: Update Dokploy** with all newly rotated credentials before deploying any of the code changes below.

---

## Task 1: Fix Hardcoded Credentials in `session-provider.tsx`

**Files:**
- Modify: `apps/frontend/components/session-provider.tsx`

**Context:** Lines 79–85 re-authenticate using hardcoded `admin@worktree.pro` / `admin123`. This must call a real endpoint or be removed entirely.

**Step 1: Read the file**
```bash
cat apps/frontend/components/session-provider.tsx
```

**Step 2: Remove the hardcoded credential block**

Find and replace the hardcoded re-auth section. The session refresh should call the standard `/api/auth/refresh` endpoint using the stored refresh token, NOT hardcoded credentials. Remove any `admin@worktree.pro` or `admin123` strings entirely. If the re-auth flow requires credentials, it should prompt the user to log in again (redirect to `/login`).

**Step 3: Verify no hardcoded emails or passwords remain**
```bash
grep -r "admin123\|admin@worktree" apps/frontend/
```
Expected: no matches.

**Step 4: Commit**
```bash
git add apps/frontend/components/session-provider.tsx
git commit -m "fix: remove hardcoded credentials from session provider"
```

---

## Task 2: Disable Dev Login Bypass in Production Build

**Files:**
- Modify: `apps/backend/src/routes/auth.routes.ts`
- Modify: `Dockerfile`
- Modify: `docker-compose.yml`

**Context:** `ENABLE_DEV_LOGIN=true` is set in `docker-compose.yml` environment AND passed as a build arg `NEXT_PUBLIC_ENABLE_DEV_LOGIN=true`. The production Dockerfile should never bake this in.

**Step 1: Add explicit guard in auth route**

In `apps/backend/src/routes/auth.routes.ts`, find the dev login block and strengthen the guard:
```typescript
// Before: if (ENABLE_DEV_LOGIN === 'true')
// After:
if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_LOGIN === 'true') {
```

**Step 2: Fix Dockerfile build arg**

In `Dockerfile`, change:
```dockerfile
# Before:
ARG NEXT_PUBLIC_ENABLE_DEV_LOGIN=true
ENV NEXT_PUBLIC_ENABLE_DEV_LOGIN=${NEXT_PUBLIC_ENABLE_DEV_LOGIN}

# After:
ARG NEXT_PUBLIC_ENABLE_DEV_LOGIN=false
ENV NEXT_PUBLIC_ENABLE_DEV_LOGIN=${NEXT_PUBLIC_ENABLE_DEV_LOGIN}
```

**Step 3: Remove ENABLE_DEV_LOGIN from docker-compose environment (it's dev-only)**

`docker-compose.yml` can keep it since compose is only for local dev. Add a comment:
```yaml
ENABLE_DEV_LOGIN: "true" # LOCAL DEV ONLY — never set in production
NEXT_PUBLIC_ENABLE_DEV_LOGIN: "true" # LOCAL DEV ONLY
```

**Step 4: Verify**
```bash
grep -r "ENABLE_DEV_LOGIN" Dockerfile docker-compose.yml apps/backend/src/
```

**Step 5: Commit**
```bash
git add Dockerfile docker-compose.yml apps/backend/src/routes/auth.routes.ts
git commit -m "fix: prevent dev login bypass from reaching production"
```

---

## Task 3: Move JWT Tokens from localStorage to httpOnly Cookies

**Files:**
- Modify: `apps/frontend/lib/api.ts`
- Modify: `apps/backend/src/routes/auth.routes.ts` (set-cookie on login/refresh)
- Modify: `apps/frontend/hooks/use-form-submission.ts`

**Context:** `localStorage` tokens are readable by any JavaScript on the page (XSS vector). The backend should set `access_token` and `refresh_token` as `httpOnly; Secure; SameSite=Strict` cookies. The frontend API client reads them automatically via browser cookie jar — no explicit storage needed.

**Step 1: Read current auth route login handler**
```bash
grep -n "access_token\|refresh_token\|localStorage" apps/backend/src/routes/auth.routes.ts
grep -n "localStorage" apps/frontend/lib/api.ts | head -30
```

**Step 2: Update backend login to set cookies**

In `apps/backend/src/routes/auth.routes.ts` login handler, after generating tokens:
```typescript
const isProduction = process.env.NODE_ENV === 'production';
res.cookie('access_token', accessToken, {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
});
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth/refresh',
});
// Still return tokens in body for backward compatibility during migration
return res.json({ success: true, data: { access_token: accessToken, user } });
```

Do the same for the refresh endpoint.

**Step 3: Update frontend `api.ts` to prefer cookie auth, fall back to localStorage**

In `apps/frontend/lib/api.ts`, update the auth header logic:
```typescript
// Remove localStorage reads for tokens in all request interceptors
// Cookies are sent automatically — no Authorization header needed for cookie-auth flows
// Keep Authorization header only for explicit API key flows (webhooks, public API)
```

Remove all `localStorage.setItem('access_token', ...)` and `localStorage.getItem('access_token')` calls. The user object can still be stored in localStorage for display purposes but never tokens.

**Step 4: Remove token reads from `use-form-submission.ts`**
```bash
grep -n "localStorage" apps/frontend/hooks/use-form-submission.ts
```
Replace `localStorage.getItem('user')` with a React context/hook call to get the authenticated user.

**Step 5: Verify no token storage in localStorage remains**
```bash
grep -rn "localStorage.setItem.*token\|localStorage.getItem.*token" apps/frontend/
```
Expected: no matches.

**Step 6: Commit**
```bash
git add apps/frontend/lib/api.ts apps/frontend/hooks/use-form-submission.ts apps/backend/src/routes/auth.routes.ts
git commit -m "fix: move JWT tokens from localStorage to httpOnly cookies"
```

---

## Task 4: Add SSRF Protection on Webhook URL Registration

**Files:**
- Modify: `apps/backend/src/routes/webhooks.routes.ts`

**Context:** Webhook `url` field is stored unvalidated, allowing SSRF to internal Docker services, `file://`, `gopher://` etc.

**Step 1: Read the webhook route**
```bash
cat apps/backend/src/routes/webhooks.routes.ts
```

**Step 2: Add URL validation utility**

Add to the webhook validation schema (or create a Zod refinement):
```typescript
import { URL } from 'url';

function isAllowedWebhookUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  // Only allow https in production
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') return false;
  // Block private/internal IP ranges
  const hostname = parsed.hostname;
  const blocked = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^0\.0\.0\.0$/,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
  ];
  if (blocked.some(re => re.test(hostname))) return false;
  // Block non-http(s) schemes
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  return true;
}
```

**Step 3: Apply validation in the route handler**
```typescript
if (!isAllowedWebhookUrl(body.url)) {
  return res.status(400).json({ success: false, error: 'Invalid webhook URL. Must be a public HTTPS URL.' });
}
```

**Step 4: Commit**
```bash
git add apps/backend/src/routes/webhooks.routes.ts
git commit -m "fix: add SSRF protection to webhook URL registration"
```

---

## Task 5: Add Non-Root USER to Dockerfile

**Files:**
- Modify: `Dockerfile`

**Context:** All stages run as root. Add a non-root user to the runner stage.

**Step 1: Add non-root user to runner stage**

In the `runner` stage of `Dockerfile`, after `WORKDIR /app`:
```dockerfile
# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# ... existing COPY commands ...

# Own app files
RUN chown -R appuser:nodejs /app

USER appuser
```

**Step 2: Verify the deps stage (dev) still works as root for npm installs — that's acceptable since it's build-only.**

**Step 3: Commit**
```bash
git add Dockerfile
git commit -m "fix: run production container as non-root user"
```

---

## Task 6: Add Redis Authentication

**Files:**
- Modify: `docker-compose.yml`
- Modify: `apps/backend/src/` (wherever Redis connection is initialized)

**Context:** Redis is bound to `0.0.0.0:6379` with no password.

**Step 1: Find Redis connection code**
```bash
grep -rn "redis\|REDIS_URL" apps/backend/src/ | grep -v node_modules
```

**Step 2: Update `docker-compose.yml` to require a Redis password**
```yaml
redis:
  image: redis:alpine
  command: redis-server --requirepass ${REDIS_PASSWORD:-changeme-in-production}
  environment:
    REDIS_PASSWORD: ${REDIS_PASSWORD:-changeme-in-production}
```

Update `ws-server` and `app` environment to include the password in the URL:
```yaml
REDIS_URL: redis://:${REDIS_PASSWORD:-changeme-in-production}@redis:6379
```

**Step 3: Add `REDIS_PASSWORD` to `.env.example`**
```bash
REDIS_PASSWORD=your-redis-password-here
```

**Step 4: Ensure the backend Redis client reads the updated URL** (should work if it reads `REDIS_URL` from env).

**Step 5: Commit**
```bash
git add docker-compose.yml .env.example
git commit -m "fix: add Redis authentication requirement"
```

---

## Task 7: Fix localhost URLs and Port Inconsistencies in docker-compose.yml

**Files:**
- Modify: `docker-compose.yml`

**Context:** `AUTH_URL` and `NEXTAUTH_URL` point to `localhost:3005`, `NEXT_PUBLIC_WS_URL` points to `ws://localhost:1234`. These break Docker networking. Also, the `app` environment correctly uses service names for DB and MinIO but not for WS.

**Step 1: Fix auth URLs**
```yaml
# Before:
AUTH_URL: http://localhost:3005
NEXTAUTH_URL: http://localhost:3005

# After (app talks to itself on the same container):
AUTH_URL: http://app:${PORT:-3005}
NEXTAUTH_URL: http://app:${PORT:-3005}
```

**Step 2: Fix WebSocket URL**
```yaml
# Before:
NEXT_PUBLIC_WS_URL: ws://localhost:1234

# After (for local dev, frontend runs on same host as browser):
NEXT_PUBLIC_WS_URL: ${NEXT_PUBLIC_WS_URL:-ws://localhost:1234}
```
Note: `NEXT_PUBLIC_WS_URL` is a browser-side env var. The browser connects to the WS server from outside Docker, so `localhost:1234` is actually correct for browser clients in local dev. But for production this must be set via env to the real hostname. Add a comment clarifying this.

**Step 3: Standardize ports**
In `.env.example`, document that `PORT=3005` and `BACKEND_PORT=5005` are the defaults. Update CLAUDE.md and README.md in Task 26 to match.

**Step 4: Commit**
```bash
git add docker-compose.yml
git commit -m "fix: correct localhost URLs and document port defaults in docker-compose"
```

---

## Task 8: Fix Authorization — Folders and Form Ownership

**Files:**
- Modify: `apps/backend/src/routes/folders.routes.ts`
- Modify: `apps/backend/src/routes/forms.routes.ts`

**Context:** `GET /api/folders` returns ALL folders. `PUT /api/forms/:id` doesn't verify project ownership.

**Step 1: Read both files**
```bash
cat apps/backend/src/routes/folders.routes.ts
grep -n "PUT\|updateForm\|req.params" apps/backend/src/routes/forms.routes.ts | head -30
```

**Step 2: Fix folders — scope to authenticated user's projects**

In the folder GET handler, add a `where` clause:
```typescript
// Get the user's project IDs first
const userProjects = await prisma.projectMember.findMany({
  where: { userId: req.user.id },
  select: { projectId: true },
});
const projectIds = userProjects.map(p => p.projectId);

const folders = await prisma.folder.findMany({
  where: { projectId: { in: projectIds } },
  // ... rest of query
});
```

**Step 3: Fix forms — verify ownership on update**

In the `PUT /api/forms/:id` handler, before updating:
```typescript
const existingForm = await prisma.form.findUnique({
  where: { id: params.id },
  include: { project: { include: { members: { where: { userId: req.user.id } } } } },
});
if (!existingForm) return res.status(404).json({ success: false, error: 'Form not found' });
if (existingForm.project.members.length === 0 && req.user.systemRole !== 'ADMIN') {
  return res.status(403).json({ success: false, error: 'Forbidden' });
}
```

**Step 4: Apply the same ownership pattern to DELETE on forms**

**Step 5: Commit**
```bash
git add apps/backend/src/routes/folders.routes.ts apps/backend/src/routes/forms.routes.ts
git commit -m "fix: scope folder queries to user projects, verify form ownership on update"
```

---

## Task 9: Fix JWT Algorithm Specification and API Key Timing Safety

**Files:**
- Modify: `apps/backend/src/middleware/authenticate.ts`
- Modify: `apps/backend/src/services/api-key.service.ts`

**Step 1: Add algorithm constraint to `jwt.verify`**

In `authenticate.ts`:
```typescript
// Before:
const payload = jwt.verify(token, JWT_SECRET) as { ... };

// After:
const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as { ... };
```

Also ensure `jwt.sign` uses `{ algorithm: 'HS256' }` explicitly in auth.routes.ts.

**Step 2: Fix timing-safe comparison in `api-key.service.ts`**
```bash
cat apps/backend/src/services/api-key.service.ts
```

Replace hash string comparison with `crypto.timingSafeEqual`:
```typescript
import { timingSafeEqual, createHash } from 'crypto';

function compareHashes(a: string, b: string): boolean {
  const bufA = Buffer.from(createHash('sha256').update(a).digest('hex'));
  const bufB = Buffer.from(createHash('sha256').update(b).digest('hex'));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
```

**Step 3: Commit**
```bash
git add apps/backend/src/middleware/authenticate.ts apps/backend/src/services/api-key.service.ts apps/backend/src/routes/auth.routes.ts
git commit -m "fix: specify JWT algorithm HS256, use timing-safe API key comparison"
```

---

## Task 10: Fix Form Submission Schema Validation

**Files:**
- Modify: `apps/backend/src/routes/forms.routes.ts`

**Context:** Submission data stored as `data.response_data || data` with no schema validation.

**Step 1: Locate the submission handler**
```bash
grep -n "response_data\|submission\|store" apps/backend/src/routes/forms.routes.ts | head -30
```

**Step 2: Fetch the form schema before storing the submission**
```typescript
// After fetching the form, validate the submission against the form's field definitions
const form = await prisma.form.findUnique({ where: { id: formId }, include: { fields: true } });
if (!form) return res.status(404).json({ success: false, error: 'Form not found' });

// Build a basic validation: ensure required fields are present
const requiredFields = form.fields.filter(f => f.required);
for (const field of requiredFields) {
  if (submissionData[field.name] === undefined || submissionData[field.name] === '') {
    return res.status(400).json({
      success: false,
      error: `Required field "${field.label || field.name}" is missing`
    });
  }
}
```

**Step 3: Commit**
```bash
git add apps/backend/src/routes/forms.routes.ts
git commit -m "fix: validate form submission data against form schema before storing"
```

---

## Task 11: Fix Backend Pagination NaN and Audit Log Gaps

**Files:**
- Modify: `apps/backend/src/routes/forms.routes.ts` (and other routes with pagination)
- Modify: `apps/backend/src/middleware/audit.middleware.ts`

**Step 1: Fix pagination NaN**

Create a safe parse helper (add to `apps/backend/src/utils/query.ts` or inline):
```typescript
function parsePaginationParam(value: unknown, defaultVal: number, max: number): number {
  const parsed = parseInt(String(value), 10);
  if (isNaN(parsed) || parsed <= 0) return defaultVal;
  return Math.min(parsed, max);
}
```

Replace all `parseInt(req.query.take as string)` usages:
```typescript
const take = parsePaginationParam(req.query.take, 50, 100);
const skip = parsePaginationParam(req.query.skip, 0, Number.MAX_SAFE_INTEGER);
```

**Step 2: Find all routes with pagination**
```bash
grep -rn "parseInt.*req.query" apps/backend/src/routes/
```
Fix each occurrence.

**Step 3: Fix audit log to capture failed auth attempts**

In `audit.middleware.ts`, update the condition:
```typescript
// Log ALL state-changing operations, not just successful ones
// Also add a separate function for logging security events
export function auditSecurityEvent(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    (res as any).json = function(body: unknown) {
      const result = originalJson(body);
      // Log 401, 403, and all mutations
      if (res.statusCode === 401 || res.statusCode === 403 ||
          (res.statusCode >= 200 && res.statusCode < 300)) {
        const userId = (req as any).user?.id ?? 'anonymous';
        prisma.auditLog.create({
          data: {
            userId,
            action: `${action}:${res.statusCode}`,
            resource: req.path,
            details: JSON.stringify({ method: req.method, status: res.statusCode }),
            ipAddress: req.ip || req.socket?.remoteAddress,
            userAgent: req.headers['user-agent'],
          }
        }).catch((err: Error) => console.error('Audit log write failed:', err.message));
      }
      return result;
    };
    next();
  };
}
```

**Step 4: Commit**
```bash
git add apps/backend/src/routes/ apps/backend/src/middleware/audit.middleware.ts
git commit -m "fix: safe pagination parsing, extend audit log to capture auth failures"
```

---

## Task 12: Fix Email Sanitization and Migration Fire-and-Forget

**Files:**
- Modify: `apps/backend/src/routes/webhooks.routes.ts`
- Modify: `apps/backend/src/routes/forms.routes.ts`

**Step 1: Sanitize email ingestion fields**

In the inbound email webhook handler, sanitize `from`, `subject`, and `text`:
```typescript
import { escape } from 'html-escaper'; // or use a sanitization library already in deps

const sanitized = {
  from: escape(String(body.from ?? '').slice(0, 255)),
  subject: escape(String(body.subject ?? '').slice(0, 500)),
  text: escape(String(body.text ?? '').slice(0, 50000)),
};
```

Check what `html-escaper` or similar is already in `package.json`:
```bash
grep -r "html-escaper\|dompurify\|sanitize" apps/backend/package.json
```

**Step 2: Make migration job awaited and surface errors**

In `forms.routes.ts`, find the fire-and-forget migration call:
```typescript
// Before:
MigrationService.migrateSubmissions().catch(err => console.error(err));

// After: await it or use a proper background job queue
try {
  await MigrationService.migrateSubmissions();
} catch (err) {
  console.error('Migration failed:', err);
  // Return error to caller — don't silently proceed
  return res.status(500).json({ success: false, error: 'Schema migration failed' });
}
```

**Step 3: Commit**
```bash
git add apps/backend/src/routes/webhooks.routes.ts apps/backend/src/routes/forms.routes.ts
git commit -m "fix: sanitize email ingestion inputs, await migration jobs"
```

---

## Task 13: Frontend — Fix ReDoS, Remove window Config Exposure, Purge console.logs

**Files:**
- Modify: `apps/frontend/lib/form-validation.ts`
- Modify: `apps/frontend/lib/api.ts`

**Step 1: Add ReDoS protection in form-validation.ts**
```bash
grep -n "new RegExp\|regex" apps/frontend/lib/form-validation.ts
```

Wrap user-provided regex compilation with a timeout check:
```typescript
function safeCompileRegex(pattern: string): RegExp | null {
  try {
    // Limit pattern length to prevent catastrophic backtracking
    if (pattern.length > 200) return null;
    return new RegExp(pattern);
  } catch {
    return null;
  }
}
```

Replace all `new RegExp(userInput)` calls with `safeCompileRegex(userInput)`.

**Step 2: Remove window API config exposure in `api.ts`**
```bash
grep -n "__SQUIDHUB_API_CONFIG__\|window\." apps/frontend/lib/api.ts
```
Delete the entire block that assigns to `window.__SQUIDHUB_API_CONFIG__`.

**Step 3: Remove console.log debug statements from api.ts**
```bash
grep -n "console.log" apps/frontend/lib/api.ts
```
Remove all `console.log` calls from `api.ts`. Keep `console.error` for genuine error logging.

**Step 4: Commit**
```bash
git add apps/frontend/lib/form-validation.ts apps/frontend/lib/api.ts
git commit -m "fix: add ReDoS protection, remove window API exposure and debug console.logs"
```

---

## Task 14: Fix Frontend ESLint/TypeScript Build Config

**Files:**
- Modify: `apps/frontend/next.config.js`

**Context:** `ignoreDuringBuilds: true` on both eslint and typescript — broken code ships silently.

**Step 1: Read the config**
```bash
cat apps/frontend/next.config.js
```

**Step 2: Remove the ignore flags**
```javascript
// Before:
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreDuringBuilds: true },

// After: remove both blocks entirely, or set to false
eslint: { ignoreDuringBuilds: false },
typescript: { ignoreDuringBuilds: false },
```

**Step 3: Run build and fix any errors that surface**
```bash
npm run build -w apps/frontend 2>&1 | head -100
```
Fix TypeScript and ESLint errors until the build passes cleanly.

**Step 4: Commit**
```bash
git add apps/frontend/next.config.js
git commit -m "fix: enforce TypeScript and ESLint checks during builds"
```

---

## Task 15: Fix Backend TypeScript Config

**Files:**
- Modify: `apps/backend/tsconfig.json`

**Step 1: Read current config**
```bash
cat apps/backend/tsconfig.json
```

**Step 2: Enable strict checks**
```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "strictNullChecks": true
  }
}
```

**Step 3: Build backend and fix errors**
```bash
npm run build -w apps/backend 2>&1 | head -100
```
Fix all type errors that surface.

**Step 4: Commit**
```bash
git add apps/backend/tsconfig.json apps/backend/src/
git commit -m "fix: enable strict TypeScript checks in backend"
```

---

## Task 16: Fix start.sh Error Handling

**Files:**
- Modify: `start.sh`

**Context:** No `set -e`, migration failures are swallowed.

**Step 1: Rewrite start.sh**
```sh
#!/bin/sh
set -e

echo "Starting deployment script..."

echo "Running backend migrations..."
cd apps/backend
if ! npx prisma migrate deploy; then
  echo "ERROR: Database migration failed. Aborting startup."
  exit 1
fi
cd ../..

echo "Starting application with PM2..."
exec pm2-runtime start ecosystem.config.js
```

**Step 2: Commit**
```bash
git add start.sh
git commit -m "fix: add set -e to start.sh, abort on migration failure"
```

---

## Task 17: Add Request Size Limits and Rate Limiting on Deletions

**Files:**
- Modify: `apps/backend/src/index.ts`
- Modify: `apps/backend/src/routes/keys.routes.ts`
- Modify: `apps/backend/src/middleware/rateLimiter.ts`

**Step 1: Read index.ts and rateLimiter.ts**
```bash
cat apps/backend/src/index.ts | head -100
cat apps/backend/src/middleware/rateLimiter.ts
```

**Step 2: Add explicit body size limits in `index.ts`**
```typescript
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
```

**Step 3: Add rate limiter to deletion endpoints**

In `rateLimiter.ts`, add or export a deletion-specific limiter:
```typescript
export const deletionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { success: false, error: 'Too many delete requests, slow down.' },
});
```

**Step 4: Apply to delete routes in `keys.routes.ts` and other deletion endpoints**
```typescript
router.delete('/:id', authenticate, deletionLimiter, async (req, res) => { ... });
```

**Step 5: Commit**
```bash
git add apps/backend/src/index.ts apps/backend/src/routes/keys.routes.ts apps/backend/src/middleware/rateLimiter.ts
git commit -m "fix: add body size limits and rate limiting on deletion endpoints"
```

---

## Task 18: Fix Docker Healthchecks and Production Build Target

**Files:**
- Modify: `docker-compose.yml`
- Modify: `Dockerfile`

**Step 1: Add HEALTHCHECK to Dockerfile runner stage**
```dockerfile
# In runner stage, after EXPOSE:
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:${BACKEND_PORT:-5005}/api/health || exit 1
```

**Step 2: Add healthcheck to Redis in docker-compose.yml**
```yaml
redis:
  healthcheck:
    test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-changeme-in-production}", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**Step 3: Add healthcheck to MinIO in docker-compose.yml**
```yaml
minio:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
    interval: 30s
    timeout: 10s
    retries: 3
```

**Step 4: Fix ws-server dependency to wait for healthy Redis**
```yaml
ws-server:
  depends_on:
    redis:
      condition: service_healthy
```

**Step 5: Fix Dokploy production build to use runner target**

The `docker-compose.yml` uses `target: deps` (development). Document in CLAUDE.md that Dokploy builds without a compose target and uses the Dockerfile default (which must be the runner stage). Update Dockerfile last stage default:
```dockerfile
# Ensure runner is the default (last) stage — it already is, confirm CMD is set:
CMD ["./start.sh"]
```

**Step 6: Commit**
```bash
git add docker-compose.yml Dockerfile
git commit -m "fix: add healthchecks for Redis and MinIO, fix runner stage CMD"
```

---

## Task 19: Add AbortController and Error Boundaries to Frontend

**Files:**
- Modify: `apps/frontend/app/(dashboard)/forms/[formSlug]/page.tsx`
- Create: `apps/frontend/components/error-boundary.tsx`
- Modify: `apps/frontend/app/admin/layout.tsx` (or admin page wrappers)

**Step 1: Add AbortController to the form page fetch**
```typescript
useEffect(() => {
  const controller = new AbortController();

  async function loadForm() {
    try {
      const data = await api.get(`/forms/${formSlug}`, { signal: controller.signal });
      setForm(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      toast.error('Failed to load form');
    }
  }

  loadForm();
  return () => controller.abort();
}, [formSlug]);
```

**Step 2: Create a reusable error boundary**
```typescript
// apps/frontend/components/error-boundary.tsx
'use client';
import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <div>Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}
```

**Step 3: Wrap admin pages with ErrorBoundary**
```typescript
// In admin layout or each admin page:
<ErrorBoundary fallback={<AdminError />}>
  {children}
</ErrorBoundary>
```

**Step 4: Commit**
```bash
git add apps/frontend/app/(dashboard)/forms/ apps/frontend/components/error-boundary.tsx apps/frontend/app/admin/
git commit -m "fix: add AbortController to fetches, add error boundaries to admin pages"
```

---

## Task 20: Fix Hardcoded groupId and Admin Page Hardcoded Data

**Files:**
- Modify: `apps/frontend/components/groups/forms/FormSubmitView.tsx`
- Modify: `apps/frontend/app/admin/users/page.tsx`

**Step 1: Fix groupId=1 fallback**
```bash
grep -n "groupId\|group_id" apps/frontend/components/groups/forms/FormSubmitView.tsx
```
Replace the hardcoded fallback with proper error handling — if `groupId` is missing, show an error rather than silently defaulting to group 1.

**Step 2: Fix admin users page to fetch real data**
```bash
cat apps/frontend/app/admin/users/page.tsx
```
Replace hardcoded user rows with a `useEffect` + API call to `GET /api/admin/users`. Add loading and error states.

**Step 3: Commit**
```bash
git add apps/frontend/components/groups/forms/FormSubmitView.tsx apps/frontend/app/admin/users/page.tsx
git commit -m "fix: remove hardcoded groupId fallback, fetch real users in admin page"
```

---

## Task 21: Add Prisma Index and Fix N+1 Query

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Modify: `apps/backend/src/routes/projects.routes.ts`

**Step 1: Add missing index on FormVersion.form_id**
```bash
grep -n "FormVersion\|form_id" apps/backend/prisma/schema.prisma
```

Add index:
```prisma
model FormVersion {
  // ... existing fields ...
  @@index([form_id])
}
```

**Step 2: Fix N+1 in projects route**
```bash
grep -n "_count\|findMany" apps/backend/src/routes/projects.routes.ts | head -20
```

Consolidate count queries into a single `findMany` with `_count` in the select (Prisma handles this efficiently as a single query with subquery, not N+1):
```typescript
const projects = await prisma.project.findMany({
  where: { members: { some: { userId: req.user.id } } },
  include: {
    _count: { select: { forms: true, members: true } },
  },
});
```

**Step 3: Generate and apply migration**
```bash
# In container or locally with DB access:
npx prisma migrate dev --name add_form_version_index --schema=apps/backend/prisma/schema.prisma
```

**Step 4: Commit**
```bash
git add apps/backend/prisma/ apps/backend/src/routes/projects.routes.ts
git commit -m "fix: add index on FormVersion.form_id, fix N+1 in projects query"
```

---

## Task 22: Add Accessibility and Debounce Fixes

**Files:**
- Modify: `apps/frontend/components/file-browser/FileBrowser.tsx`
- Modify: `apps/frontend/components/form-renderer/FormRenderer.tsx` (or wherever auto-save lives)

**Step 1: Add aria-labels to FileBrowser buttons**
```bash
grep -n "Button\|button\|onClick" apps/frontend/components/file-browser/FileBrowser.tsx | head -20
```

Add `aria-label` to all icon-only buttons:
```tsx
<Button aria-label="Delete folder" onClick={() => deleteFolder(id)}>
  <TrashIcon />
</Button>
```

**Step 2: Add debounce to auto-save**
```bash
grep -n "watch\|autosave\|setValue" apps/frontend/components/form-renderer/FormRenderer.tsx | head -20
```

Wrap the save callback with a debounce (500ms):
```typescript
import { useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce'; // check if already in deps, else add

const debouncedSave = useDebouncedCallback((data) => {
  saveDraft(data);
}, 500);
```

**Step 3: Commit**
```bash
git add apps/frontend/components/file-browser/FileBrowser.tsx apps/frontend/components/form-renderer/FormRenderer.tsx
git commit -m "fix: add aria-labels to icon buttons, debounce form auto-save"
```

---

## Task 23: Add CI/CD Pipeline

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create the workflow file**
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build -w apps/backend
      - run: npm run build -w apps/frontend

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm audit --audit-level=high
```

**Step 2: Verify `npm run lint` and `npm run build` scripts exist in package.json**
```bash
cat package.json | grep '"lint"\|"build"\|"test"'
```

**Step 3: Commit**
```bash
git add .github/workflows/ci.yml
git commit -m "feat: add GitHub Actions CI pipeline with build, lint, and security audit"
```

---

## Task 24: Add PM2 Cluster Mode and Graceful Shutdown

**Files:**
- Modify: `ecosystem.config.js`

**Step 1: Update PM2 config**
```javascript
module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './apps/backend',
      script: 'npm',
      args: process.env.NODE_ENV === 'development' ? 'run dev' : 'run start',
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
      kill_timeout: 5000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.BACKEND_PORT || '5005',
      },
    },
    {
      name: 'frontend',
      cwd: './apps/frontend',
      script: 'npm',
      args: process.env.NODE_ENV === 'development' ? 'run dev' : 'run start',
      instances: 1,
      kill_timeout: 5000,
      listen_timeout: 30000,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || '3005',
      },
    },
  ],
};
```

**Step 2: Commit**
```bash
git add ecosystem.config.js
git commit -m "fix: add PM2 cluster mode for backend, graceful shutdown timeouts"
```

---

## Task 25: Consolidate CLAUDE.md and gemini.md — Make Them Identical

**Files:**
- Modify: `CLAUDE.md`
- Modify: `gemini.md`

**Context:** Both files contain overlapping documentation with divergences in port numbers, MinIO config, and credential examples. We will make `gemini.md` a verbatim copy of `CLAUDE.md` after fixing all doc errors.

**Step 1: Fix all doc errors in CLAUDE.md**

Apply ALL of the following corrections to `CLAUDE.md`:

1. **Port numbers** — Standardize to `PORT=3005`, `BACKEND_PORT=5005` (match docker-compose defaults):
   - Change every `3100` → `3005` and `5100` → `5005` (or document that `.env` overrides apply)
   - Fix the `curl http://localhost:5000/api/health` example → `curl http://localhost:5005/api/health`

2. **Dev credentials** — Standardize to `admin@worktree.pro / password` (remove `admin123` reference)

3. **MinIO port** — Clarify: internal Docker port is `9000` (docker-compose default), external Dokploy port is `9004`. The `MINIO_PORT` env var controls the host binding (currently `9004` in docker-compose).

4. **Remove direct IP** — Remove any `67.222.144.10:9004` references; use domain names only.

5. **Add Redis documentation section** — Document Redis purpose (BullMQ job queue), connection via `REDIS_URL`, and the new `REDIS_PASSWORD` requirement.

6. **Add WebSocket server section** — Document `ws-server` service on port 1234, its purpose (real-time collaboration/notifications), and `NEXT_PUBLIC_WS_URL` configuration.

7. **Document `MOCK_STORAGE`** — Add: "When `MOCK_STORAGE=true`, file uploads are stored in memory/local disk instead of MinIO. Use for local dev when MinIO is unavailable. Set to `false` to test actual MinIO integration."

8. **Fix psql example** — Change `psql -h localhost -U worktree -d worktree_forms` to `docker compose exec db psql -U ${POSTGRES_USER:-user} -d ${POSTGRES_DB:-worktree}`

9. **Remove stale file references** — Remove references to `worktree-forms-plan.md`, `strategic-overview.md`, `ADMIN-PAGES-GUIDE.md`, `COLOR-THEME-UPDATE.md` from Support section if they don't exist.

10. **Update Last Updated date** → `2026-02-23`

**Step 2: Copy CLAUDE.md to gemini.md verbatim**
```bash
cp CLAUDE.md gemini.md
```

**Step 3: Verify they are identical**
```bash
diff CLAUDE.md gemini.md
```
Expected: no output (files identical).

**Step 4: Commit**
```bash
git add CLAUDE.md gemini.md
git commit -m "docs: fix all documentation errors, make CLAUDE.md and gemini.md identical"
```

---

## Task 26: Add Log Rotation and Backup Documentation

**Files:**
- Modify: `docker-compose.yml`
- Modify: `docs/minio-guide.md` or create `docs/operations.md`

**Step 1: Add log rotation to docker-compose.yml**
```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"
  # Apply same to ws-server, redis, minio, db
```

**Step 2: Add backup documentation**

Add a section to `docs/minio-guide.md` or create `docs/operations.md`:
```markdown
## Backup Strategy

### PostgreSQL
docker exec worktree-db pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > backup-$(date +%Y%m%d).sql

### MinIO
Use `mc` (MinIO client) to mirror bucket:
mc mirror minio/worktree /backup/minio/$(date +%Y%m%d)/

### Redis
Redis is used for ephemeral job queues only — no backup required.
```

**Step 3: Commit**
```bash
git add docker-compose.yml docs/
git commit -m "fix: add Docker log rotation, document backup procedures"
```

---

## Final Verification

**Step 1: Run full build**
```bash
npm run build -w apps/backend
npm run build -w apps/frontend
```

**Step 2: Run linter**
```bash
npm run lint
```

**Step 3: Verify no tokens in localStorage**
```bash
grep -rn "localStorage.*token\|token.*localStorage" apps/frontend/src/ apps/frontend/app/ apps/frontend/components/ apps/frontend/lib/
```

**Step 4: Verify no hardcoded credentials**
```bash
grep -rn "admin123\|minioadmin\|your-secret-key\|changeme" apps/ --include="*.ts" --include="*.tsx"
```

**Step 5: Verify localhost is not used in backend or compose (except where documented)**
```bash
grep -rn "localhost" apps/backend/src/ docker-compose.yml
```

**Step 6: Final commit**
```bash
git add .
git commit -m "chore: final verification pass — all 50 adversarial findings addressed"
git push origin main
```
