# ⚡ Quick Reference - Worktree-Forms

**Print this. Bookmark this. Love this.** 

---

## 🚀 Quick Start (5 minutes)

```bash
git clone https://github.com/UNN-Devotek/Worktree-Forms
cd Worktree-Forms
cp .env.example .env
docker-compose up -d
docker-compose exec backend npm install
docker-compose exec frontend npm install
docker-compose exec backend npm run migrate:dev
```

✅ **Access**: http://localhost:3000

---

## 🎨 Ameritech Colors

```css
/* Primary Actions */
--primary-blue: #0055B8;      /* Buttons, links */
--primary-blue-hover: #003D82; /* Button hover */
--primary-blue-active: #1E90FF;/* Button active */

/* Status & Alerts */
--error-red: #B31B1B;   /* Warnings, errors */
--success-green: #28a745; /* Success messages */
--info-blue: #0055B8;    /* Info messages */

/* Text & Background */
--text-dark: #1F2937;    /* Primary text */
--bg-light: #F3F4F6;     /* Page background */
--bg-white: #FFFFFF;     /* Cards, modals */
```

---

## 🔑 API Endpoints

### Authentication
```
POST   /api/auth/register          # Sign up
POST   /api/auth/login             # Login
POST   /api/auth/refresh           # Refresh token
POST   /api/auth/logout            # Logout
POST   /api/auth/reset-password    # Reset password
```

### Users
```
GET    /api/users                  # List (admin)
GET    /api/users/:id              # Get one
POST   /api/users                  # Create (admin)
PUT    /api/users/:id              # Update
DELETE /api/users/:id              # Delete (admin)
GET    /api/users/me               # Current user
```

### Forms
```
GET    /api/forms                  # List
GET    /api/forms/:id              # Get one
POST   /api/forms                  # Create
PUT    /api/forms/:id              # Update
DELETE /api/forms/:id              # Delete
POST   /api/forms/:id/submit       # Submit form
GET    /api/forms/:id/submissions  # Get submissions
```

### Admin
```
GET    /api/admin/users            # All users
GET    /api/admin/roles            # All roles
GET    /api/admin/audit-logs       # Audit logs
GET    /api/admin/stats            # Dashboard stats
```

---

## 🧪 Test Commands

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- auth.test.ts

# Watch mode
npm run test -- --watch

# E2E tests
npm run test:e2e
```

---

## 🗄️ Database

### Connection
```bash
# Via Docker
docker-compose exec db psql -U worktree -d worktree_forms

# Via local psql
psql -h localhost -U worktree -d worktree_forms
```

### Common Commands
```bash
# Run migrations
npm run migrate:dev
npm run migrate:prod
npm run migrate:reset    # ⚠️ Deletes data!

# Seed demo data
npm run seed

# Generate Prisma client
npm run prisma:generate
```

---

## 📦 NPM Scripts

```bash
# Development
npm run dev              # Start all services
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only

# Building
npm run build            # Build all
npm run build:frontend   # Frontend build
npm run build:backend    # Backend build

# Quality
npm run lint             # ESLint
npm run type-check       # TypeScript check
npm run format           # Format with Prettier

# Testing
npm run test             # Run tests
npm run test:coverage    # With coverage
npm run test:e2e         # E2E tests

# Database
npm run migrate:dev      # Dev migrations
npm run migrate:prod     # Prod migrations
npm run seed             # Seed data
```

---

## 🔐 Default Credentials

**Development Only** (Change in Production!)

```
Email: admin@worktreeforms.com
Password: admin123
Role: Admin
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Change `FRONTEND_PORT` in .env |
| Cannot connect to DB | Check `DATABASE_URL` in .env |
| Migrations failed | Run `npm run migrate:reset` then `npm run migrate:dev` |
| Tests failing | Ensure DB is seeded: `npm run seed` |
| TypeScript errors | Run `npm run type-check` to see all errors |

---

## 📁 Key Files

```
.env                          # Environment variables
apps/frontend/app/            # Next.js pages
apps/frontend/components/     # React components
apps/backend/src/routes/      # API endpoints
apps/backend/src/prisma/      # Database schema
docker-compose.yml            # Docker services
README.md                     # Project overview
claude.md                     # Full dev guide
```

---

## 🎯 Common Tasks

### Add a new API endpoint
1. Add route in `apps/backend/src/routes/`
2. Add Zod schema in `apps/backend/src/utils/validators.ts`
3. Add tests in `apps/backend/tests/`
4. Document in API.md

### Add a new page
1. Create folder in `apps/frontend/app/`
2. Create `page.tsx`
3. Add layout if needed
4. Add tests in `apps/frontend/tests/`

### Add a new component
1. Create in `apps/frontend/components/`
2. Export from `components/index.ts`
3. Add tests
4. Storybook story (optional)

---

## 📞 Need Help?

1. **Check QUICK-REFERENCE.md** (you're reading it!)
2. **Check claude.md** for detailed dev guide
3. **Check worktree-forms-plan.md** for specifications
4. **Check ADMIN-PAGES-GUIDE.md** for admin features
5. **Check strategic-overview.md** for architecture

---

## 🚀 Production Deploy

```bash
# Build
docker-compose build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl http://localhost:5000/api/health

# Monitor logs
docker-compose logs -f
```

---

**Last Updated**: December 11, 2025  
**Remember**: Bookmark this file! 🔖
