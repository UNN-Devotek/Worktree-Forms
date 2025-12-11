-- Worktree-Forms Database Initialization
-- PostgreSQL 15+

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email CITEXT UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Permissions (junction table)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form Fields table
CREATE TABLE IF NOT EXISTS form_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  required BOOLEAN DEFAULT false,
  order_index INTEGER,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form Submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES users(id),
  data JSONB NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_forms_created_by ON forms(created_by);
CREATE INDEX idx_forms_is_published ON forms(is_published);
CREATE INDEX idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_created_at ON form_submissions(created_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Insert default roles
INSERT INTO roles (id, name, description, is_custom) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'admin', 'Administrator with full access', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'editor', 'Can create and edit forms', false),
  ('550e8400-e29b-41d4-a716-446655440002', 'viewer', 'Can only view forms and submit', false)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('users_create', 'Create users', 'users', 'create'),
  ('users_read', 'Read users', 'users', 'read'),
  ('users_update', 'Update users', 'users', 'update'),
  ('users_delete', 'Delete users', 'users', 'delete'),
  ('forms_create', 'Create forms', 'forms', 'create'),
  ('forms_read', 'Read forms', 'forms', 'read'),
  ('forms_update', 'Update forms', 'forms', 'update'),
  ('forms_delete', 'Delete forms', 'forms', 'delete'),
  ('forms_publish', 'Publish forms', 'forms', 'publish'),
  ('submissions_read', 'Read submissions', 'submissions', 'read'),
  ('submissions_export', 'Export submissions', 'submissions', 'export'),
  ('roles_manage', 'Manage roles', 'roles', 'manage'),
  ('audit_logs_read', 'Read audit logs', 'audit_logs', 'read'),
  ('admin_access', 'Admin panel access', 'admin', 'access')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Admin has all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000' as role_id,
  id as permission_id
FROM permissions
ON CONFLICT DO NOTHING;

-- Editor can create, read, update, delete forms and read submissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '550e8400-e29b-41d4-a716-446655440001' as role_id,
  id as permission_id
FROM permissions
WHERE resource IN ('forms', 'submissions') AND action IN ('create', 'read', 'update', 'delete', 'export')
ON CONFLICT DO NOTHING;

-- Viewer can only read forms and submit
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '550e8400-e29b-41d4-a716-446655440002' as role_id,
  id as permission_id
FROM permissions
WHERE resource IN ('forms', 'submissions') AND action IN ('read')
ON CONFLICT DO NOTHING;

-- Insert demo admin user (password: admin123, hash generated with bcrypt rounds 10)
INSERT INTO users (email, password_hash, name, role, is_active) VALUES
  ('admin@worktreeforms.com', '$2b$10$9QZZpZFjL6Jxl8eQeQQ5iuV5aVpZvkzP.Q5e8e8e8e8e8e8e8e8e', 'Admin User', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Create demo form
INSERT INTO forms (title, description, created_by, is_published, is_active) VALUES
  ('Contact Form', 'Simple contact form for inquiries', '550e8400-e29b-41d4-a716-446655440003', true, true),
  ('Feedback Survey', 'Customer feedback and satisfaction survey', '550e8400-e29b-41d4-a716-446655440003', true, true)
ON CONFLICT DO NOTHING;
