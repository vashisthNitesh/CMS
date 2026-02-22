-- ============================================
-- MIGRATION 002: Authentication & RBAC Tables
-- ============================================

-- Table 1: Roles
CREATE TABLE IF NOT EXISTS roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO roles (role_name, role_description, is_system_role) VALUES
('super_admin', 'Platform administrator with full access', true),
('clinic_owner', 'Clinic administrator', true),
('doctor', 'Medical practitioner', true),
('nurse', 'Nursing staff', true),
('receptionist', 'Front desk staff', true),
('lab_technician', 'Laboratory staff', true)
ON CONFLICT (role_name) DO NOTHING;

-- Table 2: Permissions
CREATE TABLE IF NOT EXISTS permissions (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    permission_description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_permission UNIQUE (resource, action)
);

INSERT INTO permissions (permission_name, permission_description, resource, action) VALUES
('patients:create', 'Register new patients', 'patients', 'create'),
('patients:read', 'View patient records', 'patients', 'read'),
('patients:update', 'Update patient information', 'patients', 'update'),
('patients:delete', 'Delete patient records', 'patients', 'delete'),
('appointments:create', 'Book appointments', 'appointments', 'create'),
('appointments:read', 'View appointments', 'appointments', 'read'),
('appointments:update', 'Modify appointments', 'appointments', 'update'),
('appointments:cancel', 'Cancel appointments', 'appointments', 'delete'),
('visits:create', 'Start consultations', 'visits', 'create'),
('visits:read', 'View consultation records', 'visits', 'read'),
('visits:update', 'Update visit notes', 'visits', 'update'),
('prescriptions:create', 'Write prescriptions', 'prescriptions', 'create'),
('prescriptions:read', 'View prescriptions', 'prescriptions', 'read'),
('billing:create', 'Generate invoices', 'billing', 'create'),
('billing:read', 'View billing records', 'billing', 'read'),
('billing:update', 'Update billing', 'billing', 'update'),
('config:read', 'View clinic configuration', 'config', 'read'),
('config:update', 'Modify clinic settings', 'config', 'update')
ON CONFLICT (permission_name) DO NOTHING;

-- Table 3: Role-Permission Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- SUPER ADMIN: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r CROSS JOIN permissions p
WHERE r.role_name = 'super_admin'
ON CONFLICT DO NOTHING;

-- CLINIC OWNER: Most permissions except prescriptions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r CROSS JOIN permissions p
WHERE r.role_name = 'clinic_owner' AND p.resource != 'prescriptions'
ON CONFLICT DO NOTHING;

-- DOCTOR: All clinical permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r CROSS JOIN permissions p
WHERE r.role_name = 'doctor'
  AND p.resource IN ('patients', 'appointments', 'visits', 'prescriptions', 'billing')
ON CONFLICT DO NOTHING;

-- RECEPTIONIST: Patient registration, appointments, billing
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r CROSS JOIN permissions p
WHERE r.role_name = 'receptionist'
  AND p.resource IN ('patients', 'appointments', 'billing')
  AND p.action IN ('create', 'read', 'update')
ON CONFLICT DO NOTHING;

-- NURSE: View patients, update vitals
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r CROSS JOIN permissions p
WHERE r.role_name = 'nurse'
  AND p.resource IN ('patients', 'visits')
  AND p.action IN ('read', 'update')
ON CONFLICT DO NOTHING;

-- Table 4: Users
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES organization_config(clinic_id) ON DELETE RESTRICT,
    
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    
    role_id UUID NOT NULL REFERENCES roles(role_id),
    
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_user_status CHECK (status IN ('active', 'suspended', 'inactive'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_clinic ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TRIGGER set_updated_at_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 5: Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_token_hash UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
