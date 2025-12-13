import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==========================================
// PERSISTENCE LAYER
// ==========================================
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DB {
  forms: any[];
  submissions: any[];
}

// Initial Data for Seeding
const INITIAL_DATA: DB = {
  forms: [
    {
        id: 1,
        group_id: 1,
        slug: 'contact-form',
        title: 'Contact Form',
        description: 'Simple contact form for inquiries',
        form_type: 'general',
        form_schema: {
            version: '2.0',
            pages: [],
            settings: { title: 'Contact Form' },
            theme: { mode: 'auto' }
        },
        is_published: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
  ],
  submissions: []
};

// Load data helper
function loadData(): DB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(fileData);
    } 
    // If file doesn't exist, create it with initial data
    saveData(INITIAL_DATA);
    return INITIAL_DATA;
  } catch (error) {
    console.error('Error loading data:', error);
    return INITIAL_DATA;
  }
}

// Save data helper
function saveData(data: DB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Initialize Stores from File
// We load fresh on every request to ensure consistency in this simple implementation, 
// or load once here if we want caching. For dev simplicity (and to avoid race conditions with multiple processes/hot reload),
// loading on request or handling it carefully is better. 
// For now, let's keep in-memory variables that we sync.

let db = loadData();
let FORMS_STORE = db.forms;
let SUBMISSIONS_STORE = db.submissions;

// Helper to sync changes to disk
function syncToDisk() {
  saveData({
    forms: FORMS_STORE,
    submissions: SUBMISSIONS_STORE
  });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    storage_path: DB_FILE
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

// Demo Form Endpoints (Legacy / Global)
app.get('/api/forms', (req: Request, res: Response) => {
  // Return all forms from all groups for now, or just legacy ones
  res.json({
    success: true,
    data: FORMS_STORE
  });
});

// Demo Admin Endpoints
app.get('/api/admin/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      totalUsers: 5,
      activeForms: FORMS_STORE.length,
      totalSubmissions: SUBMISSIONS_STORE.length,
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

// ==========================================
// GROUP FORM ENDPOINTS
// ==========================================

// Get all forms for a group
app.get('/api/groups/:groupId/forms', (req: Request, res: Response) => {
  // Reload data to ensure freshness
  db = loadData();
  FORMS_STORE = db.forms;

  const groupId = parseInt(req.params.groupId);
  const forms = FORMS_STORE.filter(f => f.group_id === groupId);
  
  res.json({
    success: true,
    data: {
      forms: forms
    }
  });
});

// Get specific form
app.get('/api/groups/:groupId/forms/:formId', (req: Request, res: Response) => {
  // Reload data
  db = loadData();
  FORMS_STORE = db.forms;

  const groupId = parseInt(req.params.groupId);
  const formId = parseInt(req.params.formId);
  
  const form = FORMS_STORE.find(f => f.group_id === groupId && f.id === formId);
  
  if (!form) {
    return res.status(404).json({
      success: false,
      error: 'Form not found'
    });
  }

  res.json({
    success: true,
    data: {
      form: form
    }
  });
});

// Create new form
app.post('/api/groups/:groupId/forms', (req: Request, res: Response) => {
  const groupId = parseInt(req.params.groupId);
  const { title, description, form_type, form_json, is_published, is_active } = req.body;

  // Generate slug
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

  const newForm = {
    id: Math.floor(Math.random() * 10000) + 100, // Random ID
    group_id: groupId,
    slug,
    title,
    description,
    form_type,
    form_schema: form_json,
    is_published: is_published || false,
    is_active: is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  FORMS_STORE.push(newForm);
  syncToDisk(); // Persist changes

  console.log('Created Form:', newForm.id);

  res.status(201).json({
    success: true,
    data: {
      form: newForm
    },
    message: 'Form created successfully'
  });
});

// Update form
app.put('/api/groups/:groupId/forms/:formId', (req: Request, res: Response) => {
  const groupId = parseInt(req.params.groupId);
  const formId = parseInt(req.params.formId);
  const updates = req.body;

  const formIndex = FORMS_STORE.findIndex(f => f.group_id === groupId && f.id === formId);

  if (formIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Form not found'
    });
  }

  // Update fields
  const updatedForm = {
    ...FORMS_STORE[formIndex],
    ...updates,
    form_schema: updates.form_json || FORMS_STORE[formIndex].form_schema,
    updated_at: new Date().toISOString()
  };

  FORMS_STORE[formIndex] = updatedForm;
  syncToDisk(); // Persist changes
  
  console.log('Updated Form:', updatedForm.id);

  res.json({
    success: true,
    data: {
      form: updatedForm
    },
    message: 'Form updated successfully'
  });
});

// ==========================================
// SUBMISSION ENDPOINTS
// ==========================================

// Upload File (Mock)
app.post('/api/groups/:groupId/forms/:formId/upload', (req: Request, res: Response) => {
  const groupId = req.params.groupId;
  const formId = req.params.formId;
  
  const mockFile = {
    filename: 'uploaded-image.png',
    object_key: `mock-image-${Date.now()}`,
    url: `https://picsum.photos/400/300?random=${Date.now()}`, 
    size: 1024 * 50,
    content_type: 'image/png'
  };

  res.json({
    success: true,
    data: {
      files: [mockFile]
    }
  });
});

// Create Submission (Group Scoped)
app.post('/api/groups/:groupId/forms/:formId/submit', (req: Request, res: Response) => {
  const groupId = parseInt(req.params.groupId);
  const formId = parseInt(req.params.formId);
  const data = req.body;

  // Verify form exists in group
  const form = FORMS_STORE.find(f => f.group_id === groupId && f.id === formId);
  if (!form) {
    return res.status(404).json({
      success: false,
      error: 'Form not found in this group'
    });
  }

  const newSubmission = {
    id: Math.floor(Math.random() * 10000) + 100,
    form_id: formId,
    data: data,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  SUBMISSIONS_STORE.push(newSubmission);
  syncToDisk();

  res.status(201).json({
    success: true,
    submission_id: newSubmission.id, // Explicitly return submission_id as expected by frontend
    data: {
      submission: newSubmission
    },
    message: 'Submission received'
  });
});

// Get Image (Mock)
app.get('/api/images/:key', (req: Request, res: Response) => {
    res.redirect(`https://picsum.photos/400/300?random=${req.params.key}`);
});

// Create Submission
app.post('/api/forms/:formId/submissions', (req: Request, res: Response) => {
  const formId = parseInt(req.params.formId);
  const data = req.body;

  const newSubmission = {
    id: Math.floor(Math.random() * 10000) + 100,
    form_id: formId,
    data: data,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  SUBMISSIONS_STORE.push(newSubmission);
  syncToDisk();

  res.status(201).json({
    success: true,
    data: {
      submission: newSubmission
    },
    message: 'Submission received'
  });
});

// Get Submissions for a Form
app.get('/api/forms/:formId/submissions', (req: Request, res: Response) => {
  // Reload data
  db = loadData();
  SUBMISSIONS_STORE = db.submissions;

  const formId = parseInt(req.params.formId);
  const submissions = SUBMISSIONS_STORE.filter(s => s.form_id === formId).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  res.json({
    success: true,
    data: {
      submissions
    }
  });
});

// Update Submission (Status or Content)
app.put('/api/submissions/:id', (req: Request, res: Response) => {
  const submissionId = parseInt(req.params.id);
  const updates = req.body;
  
  const index = SUBMISSIONS_STORE.findIndex(s => s.id === submissionId);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Submission not found' });
  }

  const updatedSubmission = {
    ...SUBMISSIONS_STORE[index],
    ...updates,
    updated_at: new Date().toISOString()
  };

  SUBMISSIONS_STORE[index] = updatedSubmission;
  syncToDisk();

  res.json({
    success: true,
    data: {
      submission: updatedSubmission
    }
  });
});

// Delete Submission
app.delete('/api/submissions/:id', (req: Request, res: Response) => {
  const submissionId = parseInt(req.params.id);
  const index = SUBMISSIONS_STORE.findIndex(s => s.id === submissionId);
  
  if (index !== -1) {
     SUBMISSIONS_STORE.splice(index, 1);
     syncToDisk();
     return res.json({ success: true, message: 'Submission deleted' });
  }

  res.status(404).json({ success: false, error: 'Submission not found' });
});

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
  console.log(`📂 Data directory: ${DATA_DIR}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`✅ Health Check: http://localhost:${PORT}/api/health\n`);
});

export default app;
