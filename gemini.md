# 📚 Gemini Development Guide - Worktree-Forms

**Last Updated**: December 16, 2025 (Docker Setup Documentation)
**For**: AI Assistant (Gemini) & Development Team
**Quick Access**: Read this file for context!

> [!CRITICAL]
> **MUST READ**: See "🚨 CRITICAL RULES - READ FIRST" section below before making ANY changes to configuration, environment variables, or Docker-related files.

---

## ⚡ Deployment & Workflow

### Development Cycle

1. **Clone & Setup**

   ```bash
   git clone https://github.com/UNN-Devotek/Worktree-Forms
   cd Worktree-Forms
   npm install
   ```

   > [!IMPORTANT]
   > **NO LOCALHOST RULE**: Never use `localhost` or `127.0.0.1` in the codebase for binding or accessing services, as this breaks Docker networking. Always bind to `0.0.0.0` and use service names (e.g., `app`, `db`) or environment variables.

2. **Make Changes**
   - Edit code in `apps/frontend` or `apps/backend`.
   - Ensure code standards are met.

3. **Verify Changes (Pre-Commit)**

   ```bash
   # Run type checks
   npm run build

   # Run tests
   npm run test
   ```

4. **Deploy**
   - Commit changes to GitHub.
   - Dokploy will automatically build and deploy.
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push
   ```

### Testing

- **Production Environment**: [https://worktree.pro](https://worktree.pro)
- **API Docs**: [https://worktree.pro/api/docs](https://worktree.pro/api/docs)

### Common Tasks

```bash
# Run tests
npm run test

# Linting
npm run lint

# Build verification
npm run build
```

---

## 🐳 Local Development Setup

### Overview

Local development runs in Docker and connects to **external Dokploy services** for database and MinIO storage.

### Prerequisites

- Docker Desktop installed and running
- `.env` file configured (contains external service credentials)

> [!IMPORTANT]
> Never commit `.env` to git. It contains sensitive credentials and is already in `.gitignore`.

### Quick Start

```bash
# 1. Ensure .env file exists with external Dokploy connections
# (Get credentials from Dokploy environment settings)

# 2. Start all services with Docker Compose
docker-compose up -d

# 3. Check logs for successful startup
docker-compose logs -f app

# 4. Verify environment validation passed
# Look for: "✓ Environment validation passed"

# 5. Access the application
# Frontend: http://localhost:3100
# Backend API: http://localhost:5100
# Health Check: http://localhost:5100/api/health
```

### Required Environment Variables

Your `.env` file must include (get actual values from Dokploy):

```bash
# Application Ports
PORT=3100
BACKEND_PORT=5100
NODE_ENV=development

# External Database Connection
DATABASE_URL=postgresql://[get-from-dokploy]

# External MinIO Connection
MINIO_PUBLIC_URL=https://minio.worktree.pro
MINIO_ENDPOINT=https://minio.worktree.pro
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=[get-from-dokploy]
MINIO_SECRET_KEY=[get-from-dokploy]
MINIO_BUCKET_NAME=worktree

# JWT Configuration
JWT_SECRET=[32+-character-secret]
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Frontend URLs
NEXT_PUBLIC_API_URL=http://localhost:5100/api
NEXT_PUBLIC_MINIO_URL=https://minio.worktree.pro
```

### Common Operations

**Stop Services:**
```bash
docker-compose down
```

**Rebuild After Code Changes:**
```bash
docker-compose up -d --build
docker-compose logs -f app
```

**Run Database Migrations:**
```bash
docker-compose exec app sh -c "cd apps/backend && npx prisma migrate deploy"
```

**Clean Restart:**
```bash
docker-compose down -v
docker-compose up -d --build
```

### Troubleshooting Local Development

**Container won't start:**
```bash
# Check logs
docker-compose logs app

# Look for "✓ Environment validation passed"
# If validation fails, check .env file
```

**Port conflicts:**
```bash
# Check if ports 3100 or 5100 are in use
netstat -ano | findstr :3100
netstat -ano | findstr :5100

# Kill process if needed (Windows)
taskkill /PID <process_id> /F
```

**Database connection failed:**
- Verify `DATABASE_URL` in `.env` has correct external connection string
- Check firewall allows outbound connections
- Ensure external Dokploy database is running and accessible

**MinIO connection failed:**
- Verify `MINIO_PUBLIC_URL=https://minio.worktree.pro`
- Check `MINIO_USE_SSL=true`
- Confirm credentials match Dokploy settings
- Test access: `curl https://minio.worktree.pro`

---

## 🚀 Dokploy Production Deployment

### Overview

Production runs entirely on Dokploy infrastructure. All environment variables are configured in Dokploy's UI, **not in the codebase**.

### Deployment Process

1. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin main
   ```

2. **Auto-Deploy**
   - Dokploy pulls from GitHub automatically
   - Builds Docker image
   - Deploys with configured environment variables

3. **Verify**
   ```bash
   curl https://worktree.pro/api/health
   ```
   - Check Dokploy logs for "✓ Environment validation passed"
   - Test file upload functionality

### Environment Variables in Dokploy

Configure in Dokploy UI (never in code):

**Application**:
```bash
NODE_ENV=production
PORT=3100
BACKEND_PORT=5100
HOSTNAME=0.0.0.0
```

**Database (Internal Docker Network)**:
```bash
DATABASE_URL=postgresql://[credentials]@[dokploy-service-name]:5432/[database]
```
> Must use internal Docker service name

**MinIO Internal (Docker Network)**:
```bash
MINIO_HOST=minio
MINIO_PORT=9004
MINIO_USE_SSL=false
MINIO_ENDPOINT=
MINIO_ACCESS_KEY=[your-access-key]
MINIO_SECRET_KEY=[your-secret-key]
MINIO_BUCKET_NAME=worktree
MINIO_REGION=us-east-1
```
> **Internal Connection**: Backend connects to `http://minio:9004` for direct file operations (upload, delete) within Docker network. No SSL needed for internal traffic.

**MinIO Public (Browser Access)**:
```bash
MINIO_PUBLIC_URL=https://minio.worktree.pro
```
> **External Connection**: Used for presigned URLs that browsers access. Points to MinIO Console (port 9002) via Dokploy domain routing.

**MinIO Port Reference**:
- Port 9004: API endpoint for S3 operations (internal: `minio:9004`)
- Port 9002: Console UI (external: `https://minio.worktree.pro`)

**Frontend**:
```bash
BACKEND_HOST=localhost
NEXT_PUBLIC_API_URL=https://worktree.pro/api
NEXT_PUBLIC_MINIO_URL=https://minio.worktree.pro
```

**Security**:
```bash
JWT_SECRET=[secure-secret]
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

---

## 🚨 CRITICAL RULES - READ FIRST

### ⛔ NEVER DO THESE

1. **NEVER use `localhost` or `127.0.0.1` in code or environment variables** except for:
   - `BACKEND_HOST=localhost` (internal container communication only)
   - This breaks Docker networking and will cause deployment failures

2. **NEVER change these port numbers** without consultation:
   - Frontend: `3100` (PORT)
   - Backend: `5100` (BACKEND_PORT)
   - MinIO internal: `9004` (MINIO_PORT)
   - Changing ports requires updates in 4+ files and can break deployment

3. **NEVER delete or modify** these critical files:
   - `apps/backend/src/utils/validate-env.ts` (environment validation)
   - `ecosystem.config.js` (PM2 process manager)
   - `Dockerfile` (Docker build configuration)
   - `docker-compose.yml` (Docker orchestration)

4. **NEVER hardcode credentials or URLs** in source code:
   - All secrets must be in environment variables
   - Database URLs must use Docker service names (e.g., `devo-corner-worktreedatabasedev-cxfozh:5432`)
   - MinIO endpoints must use service name `minio:9004` for internal, `minio.worktree.pro` for public

5. **NEVER create an `apps/backend/.env` file**:
   - This file was intentionally deleted
   - It contained hardcoded localhost that breaks Docker
   - Use root `.env` or Dokploy environment variables only

### ✅ ALWAYS DO THESE

1. **ALWAYS use Docker service names** for internal communication:
   - Database: Use the full service name from `DATABASE_URL`
   - MinIO: Use `minio` (not `localhost`, not public URL)
   - Services discover each other via Docker network

2. **ALWAYS verify environment variables** before deployment:
   - Check `MINIO_HOST=minio` (not localhost)
   - Check `MINIO_PORT=9004` (not 9000)
   - Check `BACKEND_HOST=localhost` (for internal Next.js rewrites)
   - Check `PORT=3100` and `BACKEND_PORT=5100`

3. **ALWAYS commit before deploying**:
   - Dokploy deploys from Git, not local files
   - Run `git push origin main` to trigger deployment
   - Verify changes in Dokploy logs

4. **ALWAYS test builds locally** before pushing:
   ```bash
   npm run build    # Must succeed
   npm run test     # Must pass
   npm run lint     # Must be clean
   ```

5. **ALWAYS check these after deployment**:
   - Health endpoint: `curl https://worktree.pro/api/health`
   - Look for "✓ Environment validation passed" in logs
   - Test file upload (MinIO connection)
   - Test database queries

### 📍 Docker Networking Rules

**Internal Communication** (backend-to-services):
```bash
# Database
DATABASE_URL=postgresql://user:pass@service-name:5432/db

# MinIO (Internal - for direct S3 operations)
MINIO_HOST=minio
MINIO_PORT=9004
MINIO_USE_SSL=false

# MinIO Public URL (for presigned URLs)
MINIO_PUBLIC_URL=https://minio.worktree.pro
```

**External/Public URLs** (client-side only):
```bash
# API (browser requests)
NEXT_PUBLIC_API_URL=https://worktree.pro/api

# MinIO (browser requests)
NEXT_PUBLIC_MINIO_URL=https://minio.worktree.pro
```

**Container Communication** (Next.js to Express):
```bash
# Same container via PM2
BACKEND_HOST=localhost
BACKEND_PORT=5100
```

### 🔧 Port Configuration Reference

| Service | Internal Port | External Port | Notes |
|---------|--------------|---------------|-------|
| Frontend | 3100 | 3100 | Next.js app |
| Backend | 5100 | 5100 | Express API |
| MinIO | 9004 | 443 (HTTPS) | Object storage |
| Database | 5432 | Not exposed | PostgreSQL |

### 🛡️ Environment Validation

The backend automatically validates environment on startup:
- Required variables: `DATABASE_URL`, `JWT_SECRET`, `MINIO_BUCKET_NAME`
- Blocks localhost in production `DATABASE_URL`
- Warns if MinIO uses localhost
- **Failure = Server won't start** (this is intentional!)

### 💡 Quick Troubleshooting

**"Cannot connect to database"**:
- ❌ Check if DATABASE_URL contains `localhost`
- ✅ Must use Docker service name

**"MinIO connection failed"**:
- ❌ Check MINIO_HOST (should be `minio`, not `localhost`)
- ❌ Check MINIO_PORT (should be `9004`, not `9000`)
- ✅ Verify MinIO container is running in Dokploy

**"API requests fail"**:
- ❌ Check BACKEND_HOST in Next.js (should be `localhost`)
- ❌ Check ports match (3100, 5100)
- ✅ Check Next.js rewrites in `next.config.js`

**"Environment validation failed"**:
- ✅ This is GOOD - it caught a configuration error
- Read the error message carefully
- Fix the environment variable it's complaining about

---

## 🏗️ Project Structure

```
Worktree-Forms/
├── apps/
│   ├── frontend/                # Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── (auth)/         # Auth routes (login, signup, reset)
│   │   │   ├── (admin)/        # Admin pages (requires role: admin)
│   │   │   ├── dashboard/      # User dashboard
│   │   │   ├── forms/          # Form builder & renderer
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── page.tsx        # Home page
│   │   ├── components/
│   │   │   ├── auth/           # Auth components
│   │   │   ├── admin/          # Admin components
│   │   │   ├── forms/          # Form builder components
│   │   │   └── ui/             # Shadcn/ui wrappers
│   │   ├── lib/
│   │   │   ├── api.ts          # API client
│   │   │   ├── auth.ts         # Auth utilities
│   │   │   └── hooks.ts        # Custom React hooks
│   │   ├── tailwind.config.ts  # Ameritech colors
│   │   └── package.json
│   │
│   └── backend/                 # Express.js
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.ts      # Auth endpoints
│       │   │   ├── users.ts     # User CRUD
│       │   │   ├── roles.ts     # Role management
│       │   │   ├── forms.ts     # Form CRUD
│       │   │   └── admin.ts     # Admin endpoints
│       │   ├── middleware/
│       │   │   ├── auth.ts      # JWT verification
│       │   │   ├── rbac.ts      # Role-based access control
│       │   │   └── audit.ts     # Audit logging
│       │   ├── models/
│       │   │   └── prisma/      # Prisma schema
│       │   ├── services/
│       │   │   ├── auth.ts
│       │   │   ├── user.ts
│       │   │   └── form.ts
│       │   ├── utils/
│       │   │   ├── validators.ts # Zod schemas
│       │   │   └── errors.ts     # Error handling
│       │   └── index.ts         # Express app entry
│       ├── tests/
│       ├── migrations/          # Database migrations
│       └── package.json
│
├── docs/                        # Documentation
├── docker-compose.yml          # Docker orchestration
├── Dockerfile.frontend
├── Dockerfile.backend
├── .env.example
├── .gitignore
├── package.json                # Root workspaces config
└── README.md
```

---

## 💻 Code Standards

### TypeScript

- **Strict Mode**: Always enabled (`"strict": true`)
- **Module Resolution**: ESM-compatible
- **Type Definitions**: Explicit types for all function params & returns
- **No `any`**: Use `unknown` if truly dynamic, then narrow

### File Naming

- **Components**: PascalCase (`LoginForm.tsx`, `UserCard.tsx`)
- **Utilities**: camelCase (`authUtils.ts`, `formatDate.ts`)
- **Types/Interfaces**: PascalCase (`User.ts`, `FormSchema.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `DEFAULT_TIMEOUT`)
- **Folders**: kebab-case (`auth-forms/`, `admin-pages/`)

### Function Design

- **Single Responsibility**: One job per function
- **Pure Functions**: Prefer no side effects
- **Error Handling**: Explicit try-catch, never silent failures
- **Validation**: Use Zod for schemas, validate at boundaries

### React/Next.js Patterns

- **Hooks Only**: No class components
- **Context for State**: Use React Context or TanStack Query for global state
- **Server Components**: Use in Next.js 14 by default (mark `'use client'` only when needed)
- **API Routes**: Use route handlers in `app/api/`

### Backend (Express)

- **Middleware Chain**: Auth → RBAC → Validation → Handler → Error
- **Status Codes**: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)
- **Response Format**: `{ success: boolean, data?, error?, message? }`
- **Error Handling**: Centralized error middleware catches all throws

---

## 🧪 Testing Standards

### Coverage Requirements

- **Minimum**: ≥90% code coverage
- **Exceptions**: Generated code, migrations, config files
- **Measurement**: `npm run test:coverage`

### Test Types

> [!IMPORTANT]
> **Browser Testing Rule**:
> Always close the Chrome browser logic in your tools or manually ensure clean state after testing to prevent session bugs.

**Unit Tests** (Vitest)

**Unit Tests** (Vitest)

```typescript
// test/utils.test.ts
import { describe, it, expect } from "vitest";
import { formatDate } from "@/lib/utils";

describe("formatDate", () => {
  it("formats ISO date to readable format", () => {
    expect(formatDate("2025-12-11")).toBe("Dec 11, 2025");
  });
});
```

**Integration Tests** (Jest)

```typescript
// test/api.test.ts
import request from "supertest";
import app from "@/index";

describe("POST /api/auth/login", () => {
  it("returns JWT token on successful login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user", password: "password" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });
});
```

**E2E Tests** (Playwright)

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from "@playwright/test";

test("user can login and see dashboard", async ({ page }) => {
  await page.goto("http://<your-domain>/login");
  await page.fill('input[name="email"]', "user@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button:has-text("Login")');
  await expect(page).toHaveURL("/dashboard");
});
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] All secrets moved to `.env` (no hardcoded values)
- [ ] JWT_SECRET is 32+ characters
- [ ] HTTPS enforced in production
- [ ] CORS configured for allowed domains only
- [ ] Rate limiting enabled on auth endpoints
- [ ] Input validation on all endpoints (Zod)
- [ ] SQL injection prevention via Prisma
- [ ] CSRF tokens on state-changing requests
- [ ] Password hashing uses bcrypt 10+ rounds
- [ ] Audit logs enabled and monitored
- [ ] Dependencies scanned for vulnerabilities (`npm audit`)

---

## 🐛 Troubleshooting

### Docker Issues

**Services won't start**

```bash
# Check logs
docker-compose logs -f

# Restart everything
docker-compose down -v
docker-compose up -d
```

**Port already in use**

```bash
# Change port in .env
# Or kill process using port
lsof -i :3000  # Find process
kill -9 <PID>  # Kill it
```

### Database Issues

**Migrations failed**

```bash
# View migration status
npm run migrate:status

# Reset and retry
npm run migrate:reset
npm run migrate:dev
```

**Cannot connect to database**

```bash
# Verify DATABASE_URL in .env
# Check if db container is running
docker-compose ps db

# Connect directly
psql -h localhost -U worktree -d worktree_forms
```

### Build Issues

**Node modules corruption**

```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors**

```bash
# Clear build cache
rm -rf .next dist
npm run build
```

---

## Recent Progress

- **Cleanup & UI Polish (Dec 12, 2025)**:
  - Removed dummy data from `file-system-store.ts` (HR Forms, Marketing folders, etc.).
  - Added `brand-green` colors to Tailwind config.
  - Standardized "New Folder" (Green) and "New Form" (Blue) buttons on the Forms page to be same size and full color.
- **Bug Fixes (Dec 12, 2025)**:
  - Fixed "Create Form" button link in FileBrowser.
  - Implemented `persist` middleware in `file-system-store` to save folders and state to localStorage.
- **Styling Update**: The frontend application's global styles (`globals.css`) and Tailwind CSS configuration (`tailwind.config.ts`) have been updated to align with the `Squidhub 2.1` project's shadcn-based theming. Unused font-face declarations were removed, and the color palette now uses CSS variables for enhanced theming capabilities.

## 📋 Commit Conventions

Use conventional commits:

```
feat: add user login functionality
fix: resolve JWT token expiration bug
docs: update README with setup instructions
test: add coverage for auth service
refactor: simplify form builder logic
style: format code with prettier
chore: update dependencies
```

**Format**:

```
<type>: <short description>

[optional body explaining why/what]

[optional footer]
```

---

## 🚀 Deployment Checklist

### Before Each Deployment

- [ ] **Always commit changes to deploy** (Dokploy pulls from Git)
- [ ] All tests passing (`npm run test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] ESLint clean (`npm run lint`)
- [ ] Environment variables set correctly
- [ ] Database backups created
- [ ] Migrations reviewed and tested
- [ ] Audit logs exported

### Deployment Steps

```bash
# Build images
docker-compose build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl http://localhost:5000/api/health
```

---

## 📞 Support & Questions

- 📖 **Full Plan**: See `worktree-forms-plan.md`
- 🏗️ **Architecture**: See `strategic-overview.md`
- ⚙️ **Quick Ref**: See `QUICK-REFERENCE.md`
- 👨‍💼 **Admin Guide**: See `ADMIN-PAGES-GUIDE.md`
- 🎨 **Colors**: See `COLOR-THEME-UPDATE.md`

---

**Remember**: The docs are your friend. Check them first!
