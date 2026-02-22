-- ============================================
-- MIGRATION 003: Audit Logging Tables
-- ============================================

-- Table 1: Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    clinic_id UUID REFERENCES organization_config(clinic_id) ON DELETE SET NULL,
    
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL,
    
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    
    ip_address INET,
    user_agent TEXT,
    
    old_values JSONB,
    new_values JSONB,
    changes JSONB,
    
    request_id UUID,
    notes TEXT,
    
    CONSTRAINT chk_audit_action CHECK (
        action IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT', 'LOGIN', 'LOGOUT')
    )
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_logs(record_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_clinic ON audit_logs(clinic_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_changes ON audit_logs USING gin(changes);

-- Table 2: Login History
CREATE TABLE IF NOT EXISTS login_history (
    login_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    
    ip_address INET,
    user_agent TEXT,
    location_country VARCHAR(2),
    location_city VARCHAR(100),
    
    attempted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_ip ON login_history(ip_address, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_success ON login_history(success, attempted_at DESC);

-- Table 3: Data Access Logs
CREATE TABLE IF NOT EXISTS data_access_logs (
    access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES organization_config(clinic_id) ON DELETE CASCADE,
    
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    
    access_type VARCHAR(20) NOT NULL,
    
    accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    ip_address INET,
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_data_access_user ON data_access_logs(user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_resource ON data_access_logs(resource_type, resource_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_clinic ON data_access_logs(clinic_id, accessed_at DESC);
