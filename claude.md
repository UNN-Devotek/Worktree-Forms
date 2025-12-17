# 📚 Claude Development Guide - Worktree-Forms

**Last Updated**: December 16, 2025 (Docker Setup Documentation)  
**For**: Development Team  
**Quick Access**: Bookmark this file!

---

## ⚡ Deployment & Workflow

### Development Cycle

1. **Review Codebase**
   - Read `README.md` and project structure.

   > [!IMPORTANT]
   > **NO LOCALHOST RULE**: Never use `localhost` or `127.0.0.1` in the codebase for binding or accessing services, as this breaks Docker networking. Always bind to `0.0.0.0` and use service names (e.g., `app`, `db`) or environment variables.

2. **Make Changes**
   - Implement features or fixes.

3. **Pre-Deployment Checks**

   ```bash
   # Run tests
   npm run test

   # Verify build
   npm run build
   ```

4. **Deploy**
   - Commit and push to GitHub.
   - Dokploy handles the deployment.
   ```bash
   git push origin main
   ```

### Access & Testing

- **Live Site**: [https://worktree.pro](https://worktree.pro)
- **API Documentation**: [https://worktree.pro/api/docs](https://worktree.pro/api/docs)

### Common Tasks

```bash
# Run tests
npm run test

# Linting
npm run lint
```

---

## 🐳 Local Development Setup

### Prerequisites

- Docker Desktop installed and running
- `.env` file configured with external service connections (see `.env.example`)

> [!IMPORTANT]
> Local development connects to **external Dokploy services** (database and MinIO). You must have the `.env` file properly configured with these connection details.

### Quick Start

```bash
# 1. Ensure .env file exists with external connections
# (Database and MinIO hosted on Dokploy)

# 2. Start the application with Docker Compose
docker-compose up -d

# 3. Check logs for successful startup
docker-compose logs -f app

# 4. Access the application
# Frontend: http://localhost:3100
# Backend API: http://localhost:5100
# Health Check: http://localhost:5100/api/health
```

### Required Environment Variables

Your `.env` file must include:

```bash
# Application Ports
PORT=3100
BACKEND_PORT=5100
NODE_ENV=development

# External Database Connection (Dokploy)
DATABASE_URL=postgresql://[credentials-from-dokploy]

# External MinIO Connection
# NOTE: For local dev, you need external API access to MinIO
# Currently https://minio.worktree.pro points to Console (port 9002)
# For API access (port 9004), you may need to use direct IP or set up a second domain
MINIO_PUBLIC_URL=https://minio.worktree.pro
MINIO_ENDPOINT=https://minio.worktree.pro
MINIO_USE_SSL=true
MINIO_HOST=minio.worktree.pro
MINIO_PORT=443
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

> [!WARNING]
> Never commit the `.env` file to git. It contains sensitive credentials and is already in `.gitignore`.

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Rebuilding After Code Changes

```bash
# Rebuild and restart
docker-compose up -d --build

# View logs during rebuild
docker-compose logs -f app
```

### Database Operations

```bash
# Run migrations (connects to external Dokploy DB)
docker-compose exec app sh -c "cd apps/backend && npx prisma migrate deploy"

# Check migration status
docker-compose exec app sh -c "cd apps/backend && npx prisma migrate status"

# Access Prisma Studio (connects to external DB)
docker-compose exec app sh -c "cd apps/backend && npx prisma studio"
```

### Troubleshooting Local Development

**Container won't start:**
```bash
# Check logs
docker-compose logs app

# Look for "✓ Environment validation passed"
# If validation fails, check your .env file

# Check if ports are available
netstat -ano | findstr :3100
netstat -ano | findstr :5100
```

**Database connection failed:**
- Verify `DATABASE_URL` in `.env` points to external Dokploy database
- Check firewall allows outbound connections to external database
- Ensure external database is accessible and running

**MinIO connection failed:**
- Verify `MINIO_PUBLIC_URL` in `.env` is set to `https://minio.worktree.pro`
- Check `MINIO_USE_SSL=true` for external HTTPS connection
- Test MinIO access: `curl https://minio.worktree.pro`

**Clean restart:**
```bash
# Stop everything, remove volumes, rebuild
docker-compose down -v
docker-compose up -d --build
```

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
      .send({ email: "user@example.com", password: "password123" });

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

## 🚀 Dokploy Production Deployment

### Overview

Production deployment uses Dokploy's environment variable configuration. **All credentials are configured in Dokploy's UI**, not in the codebase.

### Deployment Process

1. **Commit and Push Changes**
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin main
   ```

2. **Dokploy Auto-Deploy**
   - Dokploy automatically pulls from GitHub
   - Builds Docker image using `Dockerfile`
   - Deploys with configured environment variables

3. **Verify Deployment**
   - Check health: `curl https://worktree.pro/api/health`
   - Review Dokploy logs for "✓ Environment validation passed"

### Required Environment Variables in Dokploy

Configure these in Dokploy's environment settings:

**Application Core**:
```bash
NODE_ENV=production
PORT=3100
BACKEND_PORT=5100
HOSTNAME=0.0.0.0
NEXT_PUBLIC_APP_URL=https://worktree.pro
```

**Database (Internal Docker Network)**:
```bash
DATABASE_URL=postgresql://[user]:[pass]@[dokploy-db-service-name]:5432/[database]
```
> Use the internal Docker service name, NOT localhost or external IP

**MinIO (External Service)**:
```bash
# Use external IP/domain for API operations
MINIO_HOST=67.222.144.10      # Direct IP to MinIO API
MINIO_PORT=9004               # MinIO API port (NOT console port 9002)
MINIO_USE_SSL=false          # Internal API uses HTTP
MINIO_ACCESS_KEY=[your-access-key]
MINIO_SECRET_KEY=[your-secret-key]
MINIO_BUCKET_NAME=worktree
MINIO_REGION=us-east-1
```
> **⚠️ IMPORTANT**: MinIO runs as an external service, NOT in the same Docker network as the app. Use the direct IP `67.222.144.10:9004` for API operations (upload/delete/presigned URLs).

**MinIO Public URL (Browser Access)**:
```bash
MINIO_PUBLIC_URL=https://minio.worktree.pro
```
> **Public Endpoint**: Used for presigned URLs that browsers access. The domain `minio.worktree.pro` currently points to Console UI (port 9002), but presigned URLs will route through the API (port 9004).

**Frontend Configuration**:
```bash
BACKEND_HOST=localhost
NEXT_PUBLIC_API_URL=https://worktree.pro/api
NEXT_PUBLIC_MINIO_URL=https://minio.worktree.pro
```

**Security**:
```bash
JWT_SECRET=[32+-character-secret]
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

### Docker Networking Rules for Production

> [!CRITICAL]
> These rules prevent deployment failures:

1. **Internal Service Communication** - Use Docker service names:
   - Database: Use full Dokploy service name (e.g., `devo-corner-worktreedatabasedev-cxfozh:5432`)

2. **External Service Communication** - Use direct IP/domain:
   - MinIO API: `http://67.222.144.10:9004` (external service, NOT in Docker network)

3. **External/Browser Access** - Use public URLs:
   - API: `https://worktree.pro/api`
   - MinIO Public: `https://minio.worktree.pro`

4. **Never use localhost** except for:
   - `BACKEND_HOST=localhost` (Next.js to Express in same container)

5. **MinIO Configuration**:
   - **Backend API operations** (upload, delete): `MINIO_HOST=67.222.144.10`, `MINIO_PORT=9004` (direct external connection)
   - **Presigned URLs** (browser downloads): `MINIO_PUBLIC_URL=https://minio.worktree.pro`
   - **Console UI**: `https://minio.worktree.pro` (port 9002) - for admin access only

6. **MinIO Port Reference**:
   - Port 9004: API endpoint for S3 operations (external access via IP)
   - Port 9002: Console UI (external access via domain)

### Post-Deployment Checks

```bash
# Health check
curl https://worktree.pro/api/health

# Check database connection
# Should show "database": "connected"

# Test file upload
# Upload a file through UI to verify MinIO works
```

### Troubleshooting Production

**"Cannot connect to database"**:
- Check `DATABASE_URL` uses Docker service name
- Verify database service is running in Dokploy
- Never use `localhost` or external IPs for internal services

**"MinIO connection failed"**:
- Verify `MINIO_HOST=minio` (not localhost)
- Check `MINIO_PORT=9004`
- Confirm MinIO container is running
- Ensure `MINIO_PUBLIC_URL` is set for browser access

**"Environment validation failed"**:
- Review error message in Dokploy logs
- This is intentional - it caught a configuration error
- Fix the environment variable mentioned in error

---

## 📞 Support & Questions

- 📖 **Full Plan**: See `worktree-forms-plan.md`
- 🏗️ **Architecture**: See `strategic-overview.md`
- ⚙️ **Quick Ref**: See `QUICK-REFERENCE.md`
- 👨‍💼 **Admin Guide**: See `ADMIN-PAGES-GUIDE.md`
- 🎨 **Colors**: See `COLOR-THEME-UPDATE.md`

---

**Remember**: The docs are your friend. Check them first!
