# 📚 Gemini Development Guide - Worktree-Forms

**Last Updated**: December 11, 2025
**For**: AI Assistant (Gemini) & Development Team
**Quick Access**: Read this file for context!

---

## ⚡ Daily Commands

## ⚡ Daily Commands

### Start Development Environment

````bash
# Clone repo
git clone https://github.com/UNN-Devotek/Worktree-Forms
cd Worktree-Forms

# Setup environment
cp .env.example .env

### Option 1: Local Development (Recommended)
This runs the apps locally. The database and object store are hosted on Dokploy/External.

```bash
# 1. Setup Environment
# Ensure .env is configured for the hosted Dokploy services.
# Ask the team for the latest .env values.

# 2. Install dependencies (Root)
npm install

# 3. Start Development Server
npm run dev
# -> Frontend: http://localhost:3005
# -> Backend:  http://localhost:5005
````

### Option 2: Full Docker (Production/Dokploy Test)

Runs everything in the production container logic.

```bash
# Start service
docker-compose up -d
```

````

### Access Services

- **Frontend**: `http://<your-domain>:3000`
- **Backend API**: `http://<your-domain>:5005`
- **API Docs**: `http://<your-domain>:5005/api/docs`
- **Database**: External (Hosted)
- **Object Storage**: External (Hosted)

### Common Development Tasks

```bash
# Run tests
npm run test
npm run test:coverage

# Linting
npm run lint

# Database commands (Connects to Hosted DB)
npm run migrate:dev          # Run dev migrations
npm run migrate:prod         # Run prod migrations
npm run migrate:reset        # CAUTION: Resets Hosted DB
npm run seed                 # Seed demo data

# Development
npm run dev                  # Start both frontend & backend

# Build for production
npm run build
````

### Stop Services

```bash
# Stop all services
docker-compose down
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
