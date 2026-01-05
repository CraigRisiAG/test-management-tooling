-- Migration 002: Add user roles and permissions tables
-- Date: 2026-01-05
-- Description: Add RBAC (Role-based Access Control) support

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- System roles: admin, user, moderator
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System roles
INSERT INTO roles (name, description, is_system) VALUES
  ('admin', 'Administrator with full access', true),
  ('moderator', 'Moderator with limited admin access', true),
  ('user', 'Regular user with basic access', true),
  ('viewer', 'Read-only user', true),
  ('guest', 'Guest user with minimal access', true)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(100) NOT NULL, -- tests, stories, defects, users, etc
  action VARCHAR(50) NOT NULL, -- create, read, update, delete, execute
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sample permissions (will be auto-generated from API definitions)
INSERT INTO permissions (name, description, resource, action) VALUES
  ('tests:create', 'Create new tests', 'tests', 'create'),
  ('tests:read', 'Read tests', 'tests', 'read'),
  ('tests:update', 'Update existing tests', 'tests', 'update'),
  ('tests:delete', 'Delete tests', 'tests', 'delete'),
  ('tests:execute', 'Execute tests', 'tests', 'execute'),
  ('stories:create', 'Create stories', 'stories', 'create'),
  ('stories:read', 'Read stories', 'stories', 'read'),
  ('stories:update', 'Update stories', 'stories', 'update'),
  ('stories:delete', 'Delete stories', 'stories', 'delete'),
  ('defects:create', 'Create defects', 'defects', 'create'),
  ('defects:read', 'Read defects', 'defects', 'read'),
  ('defects:update', 'Update defects', 'defects', 'update'),
  ('defects:delete', 'Delete defects', 'defects', 'delete'),
  ('users:manage', 'Manage users', 'users', 'manage'),
  ('settings:manage', 'Manage settings', 'settings', 'manage'),
  ('audit:read', 'Read audit logs', 'audit', 'read')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Assign default permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'user' AND p.action IN ('read', 'create', 'execute')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'viewer' AND p.action = 'read'
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
