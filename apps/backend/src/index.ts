import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    success: true,
    name: 'Worktree-Forms API',
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
    title: 'Worktree-Forms API Documentation',
    version: '1.0.0',
    description: 'Complete form management system with RBAC and audit logging',
    baseUrl: `http://localhost:${PORT}/api`,
    endpoints: {
      authentication: {
        login: 'POST /auth/login - { email, password }',
        register: 'POST /auth/register - { email, password, name }',
        refresh: 'POST /auth/refresh - { refreshToken }',
        logout: 'POST /auth/logout',
      },
      users: {
        list: 'GET /users - List all users (admin)',
        get: 'GET /users/:id - Get user details',
        create: 'POST /users - Create new user (admin)',
        update: 'PUT /users/:id - Update user',
        delete: 'DELETE /users/:id - Delete user (admin)',
        me: 'GET /users/me - Get current user',
      },
      forms: {
        list: 'GET /forms - List forms',
        get: 'GET /forms/:id - Get form details',
        create: 'POST /forms - Create form',
        update: 'PUT /forms/:id - Update form',
        delete: 'DELETE /forms/:id - Delete form',
        submit: 'POST /forms/:id/submit - Submit form',
        submissions: 'GET /forms/:id/submissions - Get submissions',
      },
      admin: {
        users: 'GET /admin/users - All users',
        roles: 'GET /admin/roles - All roles',
        auditLogs: 'GET /admin/audit-logs - Audit logs',
        stats: 'GET /admin/stats - Dashboard stats',
        settings: 'GET /admin/settings, PUT /admin/settings',
      },
    },
    authentication: 'JWT Bearer token in Authorization header',
    roles: ['admin', 'editor', 'viewer'],
  });
});

// Demo Auth Endpoints
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (email === 'admin@worktreeforms.com' && password === 'admin123') {
    return res.json({
      success: true,
      data: {
        token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiZW1haWwiOiJhZG1pbkB3b3JrdHJlZWZvcm1zLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6JHtEYXRlLm5vdygpLzEwMDB9fQ.demo-signature`,
        user: {
          id: '1',
          email: 'admin@worktreeforms.com',
          name: 'Admin User',
          role: 'admin',
        },
      },
      message: 'Login successful',
    });
  }

  res.status(401).json({
    success: false,
    error: 'Invalid credentials',
    message: 'Use admin@worktreeforms.com / admin123 for demo',
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: email, password, name',
    });
  }

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: `user-${Date.now()}`,
        email,
        name,
        role: 'viewer',
      },
    },
    message: 'Registration successful',
  });
});

// Demo User Endpoints
app.get('/api/users', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        email: 'admin@worktreeforms.com',
        name: 'Admin User',
        role: 'admin',
        createdAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        email: 'editor@worktreeforms.com',
        name: 'Editor User',
        role: 'editor',
        createdAt: '2025-01-02T00:00:00Z',
      },
      {
        id: '3',
        email: 'viewer@worktreeforms.com',
        name: 'Viewer User',
        role: 'viewer',
        createdAt: '2025-01-03T00:00:00Z',
      },
    ],
  });
});

app.get('/api/users/me', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      id: '1',
      email: 'admin@worktreeforms.com',
      name: 'Admin User',
      role: 'admin',
    },
  });
});

// Demo Form Endpoints
app.get('/api/forms', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        title: 'Contact Form',
        description: 'Simple contact form for inquiries',
        fields: [
          { id: 'f1', name: 'Full Name', type: 'text', required: true },
          { id: 'f2', name: 'Email', type: 'email', required: true },
          { id: 'f3', name: 'Message', type: 'textarea', required: true },
        ],
        submissions: 42,
        createdAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        title: 'Feedback Survey',
        description: 'Customer feedback and satisfaction survey',
        fields: [
          { id: 'f1', name: 'Rating', type: 'select', options: ['1', '2', '3', '4', '5'] },
          { id: 'f2', name: 'Comments', type: 'textarea' },
        ],
        submissions: 156,
        createdAt: '2025-01-05T00:00:00Z',
      },
    ],
  });
});

// Demo Admin Endpoints
app.get('/api/admin/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      totalUsers: 5,
      activeForms: 12,
      totalSubmissions: 234,
      auditLogs: 1245,
      lastSync: new Date().toISOString(),
    },
  });
});

app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        userId: '1',
        action: 'LOGIN',
        resource: 'auth',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        details: 'User logged in successfully',
      },
      {
        id: '2',
        userId: '1',
        action: 'CREATE',
        resource: 'form',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        details: 'Created new form: Contact Form',
      },
      {
        id: '3',
        userId: '2',
        action: 'SUBMIT',
        resource: 'form_submission',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        details: 'Submitted form: Contact Form',
      },
    ],
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`,
    suggestion: 'Check /api/docs for available endpoints',
  });
});

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Worktree-Forms API running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`✅ Health Check: http://localhost:${PORT}/api/health\n`);
});

export default app;
