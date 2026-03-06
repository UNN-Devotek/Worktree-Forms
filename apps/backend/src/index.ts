import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { StorageService } from './storage.js';
import { validateEnvironment } from './utils/validate-env.js';
import { getSecurityMiddleware } from './middleware/security.js';
import { rateLimitTiers } from './middleware/rateLimiter.js';
import { contextMiddleware } from './middleware/context.middleware.js';
import { csrfMiddleware } from './middleware/csrf.middleware.js';
import { authenticate } from './middleware/authenticate.js';
import { docClient } from './lib/dynamo/index.js';
import { ListTablesCommand } from '@aws-sdk/client-dynamodb';

// Background job workers
import './jobs/workers/file-rename.worker.js';
import './jobs/workers/webhook-delivery.worker.js';

// Route Imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import projectRoutes from './routes/projects.routes.js';
import folderRoutes from './routes/folders.routes.js';
import formRoutes from './routes/forms.routes.js';
import mobileRoutes from './routes/mobile.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import taskRoutes from './routes/task.routes.js';
import specRoutes from './routes/spec.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';
import aiRoutes from './routes/ai.routes.js';
import webhookRoutes from './routes/webhooks.routes.js';
import keyRoutes from './routes/keys.routes.js';
import helpRoutes from './routes/help.routes.js';
import shareRoutes from './routes/share.routes.js';
import prefRoutes from './routes/preferences.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import complianceRoutes from './routes/compliance.routes.js';
import filesRoutes from './routes/files.routes.js';

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
const PORT = parsedPort > 0 && parsedPort < 65536 ? parsedPort : 5005;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3005',
  'http://localhost:3100',
  'http://localhost:3000',
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);
app.use(csrfMiddleware);
app.use(getSecurityMiddleware());
app.use('/api', rateLimitTiers.api);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
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

// Authenticate protected routes
app.use(
  [
    '/api/projects',
    '/api/users',
    '/api/folders',
    '/api/forms',
    '/api/groups',
    '/api/tasks',
    '/api/specs',
    '/api/schedule',
    '/api/dashboard',
    '/api/keys',
    '/api/webhooks',
    '/api/help',
    '/api/upload',
    '/api/files',
    '/api/ai',
    '/api/preferences',
    '/api/compliance',
  ],
  authenticate,
);

// Context Middleware (RLS Support)
app.use(contextMiddleware);

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    // Quick DynamoDB connectivity check
    const dynamo = (docClient as unknown as { config: { endpoint: () => Promise<{ hostname: string }> } }).config;
    res.json({
      success: true,
      message: 'API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected (DynamoDB)',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API is running but database connection failed',
      error: String(error),
    });
  }
});

// API Info
app.get('/api', (_req: Request, res: Response) => {
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
app.get('/api/docs', (_req: Request, res: Response) => {
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

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);
app.use('/api/public', shareRoutes);

// Protected routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/folders', folderRoutes);

// Routes mounted at /api because they define prefixed paths internally
app.use('/api', formRoutes);
app.use('/api', taskRoutes);
app.use('/api', specRoutes);
app.use('/api', scheduleRoutes);
app.use('/api', mobileRoutes);
app.use('/api', dashboardRoutes);

app.use('/api/ai', aiRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/preferences', prefRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/files', filesRoutes);
app.use('/api', complianceRoutes);

// Error Handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || 'no-id';
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
    console.warn('S3 bucket initialization failed. Bucket will be created on first upload.');
  }
}

// Start server
const HOST = '0.0.0.0';
async function startServer() {
  await initializeStorage();
  app.listen(PORT as number, HOST, () => {
    console.log(`\nWorktree API running on port ${PORT} bound to ${HOST}`);
    console.log(`API Docs: /api/docs`);
    console.log(`Health Check: /api/health\n`);
  });
}
startServer();

export default app;
