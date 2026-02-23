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
import { contextMiddleware } from './middleware/context.middleware.js';
import { csrfMiddleware } from './middleware/csrf.middleware.js';
import { authenticate } from './middleware/authenticate.js';

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

// Safe BigInt serialization without mutating global prototype
const bigIntReplacer = (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value;

// Validate environment before starting server
validateEnvironment();

const app: Express = express();
const rawPort = process.env.BACKEND_PORT || process.env.PORT || '5005';
const match = String(rawPort).match(/^(\d+)/) || String(rawPort).match(/(\d+)/);
const parsedPort = match ? parseInt(match[0], 10) : 5005;
const PORT = (parsedPort > 0 && parsedPort < 65536) ? parsedPort : 5005;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3005', 'http://localhost:3100', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(csrfMiddleware);
app.use(getSecurityMiddleware()); // Security headers (Helmet)
app.use('/api', rateLimitTiers.api); // General API rate limiting
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => originalJson(JSON.parse(JSON.stringify(body, bigIntReplacer)));
  next();
});

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Authenticate protected routes (sets req.user before contextMiddleware reads it)
app.use([
  '/api/projects',
  '/api/users',
  '/api/folders',
  '/api/forms',
  '/api/groups',
  '/api/rfi',
  '/api/specs',
  '/api/schedule',
  '/api/dashboard',
  '/api/keys',
  '/api/webhooks',
  '/api/help',
  '/api/upload',
  '/api/ai',
  '/api/preferences',
], authenticate);

// Context Middleware (RLS Support) — must run AFTER authenticate so req.user is populated
app.use(contextMiddleware);

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
  const requestId = req.headers['x-request-id'] as string || 'no-id';
  console.error('Unhandled Error:', {
    method: req.method,
    path: req.path,
    requestId,
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
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
async function startServer() {
  await initializeStorage();
  app.listen(PORT as number, HOST, () => {
    console.log(`\n🚀 Worktree API running on port ${PORT} bound to ${HOST}`);
    console.log(`📚 API Docs: /api/docs`);
    console.log(`✅ Health Check: /api/health\n`);
  });
}
startServer();

export default app;
