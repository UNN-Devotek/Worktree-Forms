import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './db.js';
import { StorageService } from './storage.js';
import { validateEnvironment } from './utils/validate-env.js';
import { getSecurityMiddleware } from './middleware/security.js';
import { rateLimitTiers } from './middleware/rateLimiter.js';

// Route Imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import projectRoutes from './routes/projects.routes.js';
import folderRoutes from './routes/folders.routes.js';
import formRoutes from './routes/forms.routes.js';
import mobileRoutes from './routes/mobile.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import rfiRoutes from './routes/rfi.routes.js';
import specRoutes from './routes/spec.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';
import aiRoutes from './routes/ai.routes.js';
import webhookRoutes from './routes/webhooks.routes.js';
import keyRoutes from './routes/keys.routes.js';
import helpRoutes from './routes/help.routes.js';
import shareRoutes from './routes/share.routes.js';
import prefRoutes from './routes/preferences.routes.js';
import uploadRoutes from './routes/upload.routes.js';

dotenv.config();

// BigInt serialization shim
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Validate environment before starting server
validateEnvironment();

const app: Express = express();
const rawPort = process.env.BACKEND_PORT || process.env.PORT || '5005';
const match = String(rawPort).match(/^(\d+)/) || String(rawPort).match(/(\d+)/);
const parsedPort = match ? parseInt(match[0], 10) : 5005;
const PORT = (parsedPort > 0 && parsedPort < 65536) ? parsedPort : 5005;

// Middleware
app.use(cors());
app.use(getSecurityMiddleware()); // Security headers (Helmet)
app.use('/api', rateLimitTiers.api); // General API rate limiting
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`; // Simple DB check
    res.json({
      success: true,
      message: 'API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API is running but database connection failed',
      error: String(error)
    });
  }
});

// API Info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    success: true,
    name: 'Worktree API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      docs: 'GET /api/docs',
      auth: 'POST /api/auth/login, POST /api/auth/register',
      users: 'GET /api/users, POST /api/users, etc',
      forms: 'GET /api/forms, POST /api/forms, etc',
      admin: 'GET /api/admin/* (admin only)',
    },
  });
});

// Demo API Documentation
app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    success: true,
    title: 'Worktree API Documentation',
    version: '1.0.0',
    description: 'Complete form management system with RBAC and audit logging',
    baseUrl: `/api`,
  });
});

// ==========================================
// MOUNT ROUTERS
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes); // Handles /api/projects/:id...
// Specific sub-route handling in Project Router covers /projects/:projectId/...
// BUT some routes were mounted at root like /api/folders
app.use('/api/folders', folderRoutes); 

app.use('/api', formRoutes); 
// Wait, the Form Router defines '/groups/:groupId/forms'. 
// So `app.use('/api', formRoutes)`? 
// No, the Form Router had `router.get('/', ...)` (which matches /api/forms) AND `router.get('/groups/:groupId/forms', ...)` 
// which matches /api/forms/groups/... => INCORRECT if we mount at /api/forms.
// Logic: If Form Router has `/groups/:groupId/forms`, and we mount at `/api/forms`, path becomes `/api/forms/groups/...`
// ORIGINAL was `/api/groups/:groupId/forms`.
// So we should mount formRoutes at `/api`?
// Let's check Form Router again.
// It has `router.get('/', ...)` -> `/api/forms` (if mounted at /api/forms).
// It has `router.get('/groups/:groupId/forms', ...)` -> `/api/forms/groups/...` (if mounted at /api/forms). This is WRONG.
// We need to mount specific routers carefully or fix paths.
// CLEANEST: Mount at `/api`.
// But then prefix collision?
// Let's create `appRoutes` that mounts them?
// Or just mount them at specific paths.
// If I mount `formRoutes` at `/api`, then `router.get('/forms')` works.
// BUT `formRoutes` defined `router.get('/')`.
// So `formRoutes` expects to be mounted at `/api/forms`.
// What about the `/api/groups/:groupId/forms`?
// That was inside `formRoutes` as `router.get('/groups/:groupId/forms')`.
// So if I mount at `/api/forms`, that becomes `/api/forms/groups/...`.
// This breaks the original API contract `/api/groups/...`.
// FIX: I will mount `formRoutes` at `/api` and change `router.get('/')` inside it to `router.get('/forms')`.
// Wait, I can't edit `formRoutes` now (it's written).
// Let's review `formRoutes`.
// `router.get('/', ...)` -> List all forms.
// `router.get('/groups/:groupId/forms', ...)` -> List group forms.
// So if I mount at `/api`, then `/api/` maps to `List all forms`? NO. `/api` is API Info.
// Conflict.
// I should have split them better.
// Strategy: Mount `formRoutes` at `/api`.
// It has `router.get('/', ...)` -> `/api/`. Conflict with API Info.
// I need to patch `formRoutes` OR `index.ts`.
// I will patch `index.ts` to use a detailed mount strategy or a temporary `apiRouter`.

const apiRouter = express.Router();

// Mount resources to apiRouter
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/projects', projectRoutes); // /api/projects...
apiRouter.use('/folders', folderRoutes);

// Forms is tricky because of the root '/' in `formRoutes`.
// I'll mount it at `/api`. 
// BUT `formRoutes` has `router.get('/')`.
// I will modify `routes/forms.routes.ts` quickly to prefix paths?
// OR: Just mount it at `/api/forms` and expect requests to change?
// No, must preserve backwards compatibility.
// The code had `/api/forms` AND `/api/groups/...`.
// I will just use `app.use('/api', formRoutes)`?
// Then `router.get('/')` becomes `/api/`. That overrides API Info.
// Okay, I will edit `forms.routes.ts` to have explicit paths `/forms`, `/groups/...`.
// Better: Relaunch `forms.routes.ts` overwriting it with explicit paths.
// Same for others if needed.

// Check `projectRoutes`:
// `router.get('/')` -> `/api/projects` (if mounted at /projects).
// `router.post('/:projectId/upload')` -> `/api/projects/:projectId/upload`.
// `projectRoutes` is fine if mounted at `/api/projects`.

// Check `formRoutes` again.
// `router.get('/')` -> `/api/forms`?
// `router.get('/groups/:groupId/forms')` -> `/api/groups...`?
// If I mount at `/api`:
// `router.get('/')` -> `/api` (Bad).
// `router.get('/groups/:groupId/forms')` -> `/api/groups/...` (Good).

// Correct Plan:
// Update `forms.routes.ts`: Change `/` to `/forms`.
// Update `mobile.routes.ts`: remove `/api` prefix (it's relative to router).
// `mobile.routes.ts`: `router.get('/projects/:projectId/routes/my-daily')`.
// If mounted at `/api`, works.

// I will re-write `forms.routes.ts`, `mobile.routes.ts`, `rfi.routes.ts`, `spec.routes.ts`, `schedule.routes.ts` to ensure strict paths relative to `/api`.
// Then mount all of them at `/api`.

// `authRoutes`: `/login` -> Mount at `/api/auth`.
// `usersRoutes`: `/` -> Mount at `/api/users`.
// `projectRoutes`: `/` -> Mount at `/api/projects`.
// `folderRoutes`: `/` -> Mount at `/api/folders`.
// `aiRoutes`: `/chat` -> Mount at `/api/ai`.
// `webhookRoutes`: `/` -> Mount at `/api/webhooks`.
// `keyRoutes`: `/` -> Mount at `/api/keys`.
// `helpRoutes`: `/articles` -> Mount at `/api/help`.
// `shareRoutes`: `/access` -> Mount at `/api/public` (Wait, it was `/api/public/access`). 
//   In `share.routes.ts`, I defined `/access/:token`. 
//   So mount `shareRoutes` at `/api/public`.

// The "Messy" ones are: Forms, RFI, Specs, Schedule, Mobile.
// They used `/api/projects/:id/...`.
// I will rewrite them to be mounted at `/api` and include the full path `projects/:id/...`.

// Or better, I group them under `projectRoutes`?
// No, separation of concerns.

// I will proceed to UPDATE `forms.routes.ts` to facilitate mounting at `/api`.
// Change `router.get('/')` to `router.get('/forms')`.
// Keep `router.get('/groups/:groupId/forms')`.
// Keep `router.post('/:formId/submissions')`. (Alias: `/api/:formId/submissions`? No, original was `/api/forms/:formId/submissions`? Or just `/api/:formId/...`?)
// Original: `app.post('/api/forms/:formId/submissions', ...)`
// In `forms.routes.ts` I wrote `router.post('/:formId/submissions')`.
// If mounted at `/api`, that becomes `/api/:formId/submissions`.
// Wait, `:formId` would capture `auth`, `users` etc if defined early? No, regex.
// `/forms` matches literal.
// `/api/forms/:formId/submissions` -> `router.post('/forms/:formId/submissions')`.

// OKAY. I'll rewrite `forms.routes.ts` to use explicit `/forms` prefix where needed and mount at `/api`.

app.use('/api', formRoutes); 
app.use('/api', rfiRoutes); // /projects/:id/rfis
app.use('/api', specRoutes); // /projects/:id/specs
app.use('/api', scheduleRoutes); // /projects/:id/schedule
app.use('/api', mobileRoutes); // /projects/:id/routes...

// I need to make sure `formRoutes` doesn't capture `/` as root.
// I will rewrite `forms.routes.ts` to be safe.

app.use('/api/dashboard', dashboardRoutes); // was /api/projects/:id/metrics... oh..
// Dashboard routes: `/projects/:id/metrics`.
// If I mount it at `/api`, then works.
app.use('/api', dashboardRoutes);

app.use('/api/ai', aiRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/public', shareRoutes); // /api/public/access
app.use('/api/preferences', prefRoutes);
app.use('/api/upload', uploadRoutes); // /api/upload

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Initialize storage bucket (non-blocking)
async function initializeStorage() {
  try {
    await StorageService.ensureBucket();
  } catch (error) {
    console.warn('⚠️  MinIO bucket initialization failed. Bucket will be created on first upload.');
  }
}

// Start server
const HOST = '0.0.0.0';
app.listen(PORT as number, HOST, () => {
  console.log(`\n🚀 Worktree API running on port ${PORT} bound to ${HOST}`);
  console.log(`📚 API Docs: /api/docs`);
  console.log(`✅ Health Check: /api/health\n`);
  
  initializeStorage();
});

export default app;
