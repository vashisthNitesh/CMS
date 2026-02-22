-- ============================================
-- MIGRATION 001: Configuration Tables
-- ============================================

-- Table 1: Organization (Clinic) Configuration
CREATE TABLE IF NOT EXISTS organization_config (
    clinic_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_name VARCHAR(255) NOT NULL,
    
    -- Location Settings
    country_code VARCHAR(2) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    language_code VARCHAR(5) NOT NULL,
    
    -- Clinic Type
    specialty_type VARCHAR(50) NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    
    -- Subscription
    subscription_plan VARCHAR(20) DEFAULT 'free',
    subscription_valid_until DATE,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_country_code CHECK (country_code ~ '^[A-Z]{2}$'),
    CONSTRAINT chk_status CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
    CONSTRAINT chk_specialty CHECK (specialty_type IN (
        'general_practice', 'dental', 'dermatology', 'orthopedics',
        'pediatrics', 'gynecology', 'psychiatry', 'ophthalmology',
        'multi_specialty'
    ))
);

CREATE INDEX IF NOT EXISTS idx_org_config_country ON organization_config(country_code);
CREATE INDEX IF NOT EXISTS idx_org_config_status ON organization_config(status);
CREATE INDEX IF NOT EXISTS idx_org_config_specialty ON organization_config(specialty_type);

-- Table 2: Clinical Configuration
CREATE TABLE IF NOT EXISTS clinical_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES organization_config(clinic_id) ON DELETE CASCADE,
    
    visit_types JSONB NOT NULL DEFAULT '["new_patient", "follow_up", "emergency"]',
    diagnosis_style VARCHAR(20) NOT NULL DEFAULT 'free_text',
    measurement_system VARCHAR(20) NOT NULL DEFAULT 'metric',
    
    prescription_rules JSONB NOT NULL DEFAULT '{
        "max_duration_days": 90,
        "require_dosage": true,
        "require_frequency": true
    }',
    
    required_fields JSONB NOT NULL DEFAULT '{
        "patient": ["first_name", "last_name", "dob", "phone"],
        "visit": ["chief_complaint", "diagnosis"]
    }',
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_clinical_config_per_clinic UNIQUE (clinic_id)
);

-- Table 3: AI Behavior Configuration
CREATE TABLE IF NOT EXISTS ai_behavior_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES organization_config(clinic_id) ON DELETE CASCADE,
    
    enable_summarization BOOLEAN NOT NULL DEFAULT true,
    enable_suggestions BOOLEAN NOT NULL DEFAULT true,
    enable_risk_flagging BOOLEAN NOT NULL DEFAULT true,
    enable_prescription_assist BOOLEAN NOT NULL DEFAULT true,
    
    suggestion_confidence_threshold DECIMAL(3,2) NOT NULL DEFAULT 0.75,
    explainability_level VARCHAR(20) NOT NULL DEFAULT 'standard',
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_ai_config_per_clinic UNIQUE (clinic_id),
    CONSTRAINT chk_confidence_threshold CHECK (
        suggestion_confidence_threshold >= 0.0 AND 
        suggestion_confidence_threshold <= 1.0
    ),
    CONSTRAINT chk_explainability CHECK (
        explainability_level IN ('minimal', 'standard', 'detailed')
    )
);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_org
BEFORE UPDATE ON organization_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_clinical
BEFORE UPDATE ON clinical_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_ai
BEFORE UPDATE ON ai_behavior_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
