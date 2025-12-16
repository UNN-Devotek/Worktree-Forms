# 📚 Claude Development Guide - Worktree-Forms

**Last Updated**: December 12, 2025 (Bug Fixes)  
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

## 🌐 Docker Networking Configuration

### Environment Variables for Dokploy

**Backend Internal Services** (Docker network):
```bash
# Database (use Docker service name)
DATABASE_URL=postgresql://worktreedatabasedev:wj9njpzberfmlc2u@devo-corner-worktreedatabasedev-cxfozh:5432/worktreedatabasedev

# MinIO Internal (use Docker service name)
MINIO_HOST=minio
MINIO_PORT=9004
MINIO_USE_SSL=false
MINIO_ENDPOINT=  # Leave empty to use HOST:PORT
```

**Frontend-Backend Communication**:
```bash
# Internal (same container)
BACKEND_HOST=localhost
BACKEND_PORT=5100

# External (client-side)
NEXT_PUBLIC_API_URL=https://worktree.pro/api
NEXT_PUBLIC_MINIO_URL=https://minio.worktree.pro
```

**Port Configuration**:
```bash
PORT=3100              # Frontend port
BACKEND_PORT=5100      # Backend port
HOSTNAME=0.0.0.0       # Bind to all interfaces
```

### Important Notes

1. **Never use localhost in production environment variables** except for BACKEND_HOST (internal container communication)
2. **Use Docker service names** for internal service-to-service communication
3. **Use public URLs** only for client-side browser requests
4. **MinIO internal vs external**:
   - Backend uses: `http://minio:9004` (no SSL, internal)
   - Browser uses: `https://minio.worktree.pro` (SSL, external)

---

## 📞 Support & Questions

- 📖 **Full Plan**: See `worktree-forms-plan.md`
- 🏗️ **Architecture**: See `strategic-overview.md`
- ⚙️ **Quick Ref**: See `QUICK-REFERENCE.md`
- 👨‍💼 **Admin Guide**: See `ADMIN-PAGES-GUIDE.md`
- 🎨 **Colors**: See `COLOR-THEME-UPDATE.md`

---

**Remember**: The docs are your friend. Check them first!
