-- ============================================
-- MIGRATION 004: Appointments Module Tables
-- ============================================

-- Table 1: Patients (lightweight)
CREATE TABLE IF NOT EXISTS patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES organization_config(clinic_id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE,
    age INTEGER,
    gender VARCHAR(20),
    email VARCHAR(255),
    blood_group VARCHAR(5),
    profile_complete BOOLEAN NOT NULL DEFAULT false,
    created_via VARCHAR(50) DEFAULT 'APPOINTMENT_BOOKING',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_gender CHECK (gender IN ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY')),
    CONSTRAINT chk_patient_status CHECK (status IN ('ACTIVE','INACTIVE','DECEASED'))
);

CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(clinic_id, phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(clinic_id, first_name, last_name);

CREATE TRIGGER set_updated_at_patients
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 2: Doctor Working Hours
CREATE TABLE IF NOT EXISTS doctor_working_hours (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES organization_config(clinic_id),
    doctor_id UUID NOT NULL REFERENCES users(user_id),
    day_of_week VARCHAR(3) NOT NULL,
    is_working_day BOOLEAN NOT NULL DEFAULT true,
    start_time TIME,
    end_time TIME,
    slot_duration_min INTEGER NOT NULL DEFAULT 15,
    break_start TIME,
    break_end TIME,
    max_patients INTEGER,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_day CHECK (day_of_week IN ('MON','TUE','WED','THU','FRI','SAT','SUN')),
    CONSTRAINT chk_times CHECK (end_time > start_time OR NOT is_working_day),
    CONSTRAINT chk_break CHECK (break_end > break_start OR break_start IS NULL),
    CONSTRAINT chk_slot_duration CHECK (slot_duration_min IN (5,10,15,20,30,45,60))
);

CREATE INDEX IF NOT EXISTS idx_dwh_doctor ON doctor_working_hours(doctor_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_dwh_clinic ON doctor_working_hours(clinic_id);

CREATE TRIGGER set_updated_at_dwh
BEFORE UPDATE ON doctor_working_hours
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 3: Doctor Leaves
CREATE TABLE IF NOT EXISTS doctor_leaves (
    leave_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES organization_config(clinic_id),
    doctor_id UUID REFERENCES users(user_id),
    leave_date_from DATE NOT NULL,
    leave_date_to DATE NOT NULL,
    leave_type VARCHAR(20) NOT NULL,
    reason TEXT,
    notify_patients BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_leave_dates CHECK (leave_date_to >= leave_date_from),
    CONSTRAINT chk_leave_type CHECK (leave_type IN (
        'PERSONAL','MEDICAL','CLINIC_HOLIDAY','TRAINING','EMERGENCY'
    ))
);

CREATE INDEX IF NOT EXISTS idx_leaves_doctor ON doctor_leaves(doctor_id, leave_date_from);
CREATE INDEX IF NOT EXISTS idx_leaves_clinic ON doctor_leaves(clinic_id, leave_date_from);

-- Table 4: Appointment Slots
CREATE TABLE IF NOT EXISTS appointment_slots (
    slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES organization_config(clinic_id),
    doctor_id UUID NOT NULL REFERENCES users(user_id),
    slot_date DATE NOT NULL,
    slot_start_time TIME NOT NULL,
    slot_end_time TIME NOT NULL,
    slot_duration_min INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    blocked_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_slot_status CHECK (status IN (
        'AVAILABLE','BOOKED','BLOCKED','COMPLETED','NO_SHOW'
    )),
    CONSTRAINT unique_slot UNIQUE (doctor_id, slot_date, slot_start_time)
);

CREATE INDEX IF NOT EXISTS idx_slots_doctor_date ON appointment_slots(doctor_id, slot_date, status);
CREATE INDEX IF NOT EXISTS idx_slots_clinic_date ON appointment_slots(clinic_id, slot_date);

-- Table 5: Appointments (core)
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES organization_config(clinic_id),
    patient_id UUID NOT NULL REFERENCES patients(patient_id),
    doctor_id UUID NOT NULL REFERENCES users(user_id),
    slot_id UUID NOT NULL REFERENCES appointment_slots(slot_id),

    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    estimated_end_time TIME,
    actual_start_time TIME,
    actual_end_time TIME,

    visit_type VARCHAR(20) NOT NULL,
    reason_for_visit TEXT,
    source VARCHAR(20) NOT NULL DEFAULT 'WALK_IN',
    is_first_visit BOOLEAN NOT NULL DEFAULT false,

    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    check_in_time TIMESTAMP,
    consultation_start TIMESTAMP,
    consultation_end TIMESTAMP,

    cancelled_at TIMESTAMP,
    cancelled_by UUID REFERENCES users(user_id),
    cancellation_reason TEXT,
    cancellation_type VARCHAR(30),
    rescheduled_count INTEGER NOT NULL DEFAULT 0,
    rescheduled_from_id UUID REFERENCES appointments(appointment_id),

    wait_time_minutes INTEGER,

    booked_by UUID NOT NULL REFERENCES users(user_id),
    booked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(user_id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT,

    CONSTRAINT chk_visit_type CHECK (visit_type IN (
        'NEW_PATIENT','FOLLOW_UP','EMERGENCY','PROCEDURE','TELEMEDICINE'
    )),
    CONSTRAINT chk_source CHECK (source IN (
        'WALK_IN','PHONE','ONLINE','REFERRAL','EMERGENCY'
    )),
    CONSTRAINT chk_appt_status CHECK (status IN (
        'SCHEDULED','CHECKED_IN','IN_CONSULTATION',
        'COMPLETED','CANCELLED_BY_PATIENT','CANCELLED_BY_CLINIC',
        'CANCELLED_BY_SYSTEM','NO_SHOW'
    ))
);

CREATE INDEX IF NOT EXISTS idx_appt_doctor_date ON appointments(doctor_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appt_patient ON appointments(patient_id, appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_appt_clinic_date ON appointments(clinic_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appt_status ON appointments(status, appointment_date);

CREATE TRIGGER set_updated_at_appointments
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 6: Visit Context (AI-generated)
CREATE TABLE IF NOT EXISTS visit_context (
    context_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(appointment_id),
    patient_id UUID NOT NULL REFERENCES patients(patient_id),

    summary TEXT,
    visit_prediction TEXT,

    pending_items JSONB DEFAULT '[]',
    available_results JSONB DEFAULT '[]',
    allergies JSONB DEFAULT '[]',
    ongoing_medications JSONB DEFAULT '[]',
    risk_flags JSONB DEFAULT '[]',

    context_confidence DECIMAL(3,2),
    data_sources JSONB DEFAULT '[]',
    ai_model_version VARCHAR(50),

    generation_status VARCHAR(20) DEFAULT 'PENDING',
    generation_started_at TIMESTAMP,
    generated_at TIMESTAMP,
    generation_error TEXT,

    CONSTRAINT chk_confidence CHECK (
        context_confidence IS NULL OR
        (context_confidence >= 0.0 AND context_confidence <= 1.0)
    ),
    CONSTRAINT chk_gen_status CHECK (generation_status IN (
        'PENDING','IN_PROGRESS','COMPLETED','FAILED','SKIPPED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_context_appointment ON visit_context(appointment_id);
CREATE INDEX IF NOT EXISTS idx_context_patient ON visit_context(patient_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_context_status ON visit_context(generation_status);

-- Table 7: Appointment Notifications
CREATE TABLE IF NOT EXISTS appointment_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(appointment_id),
    patient_id UUID NOT NULL REFERENCES patients(patient_id),
    notification_type VARCHAR(30) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'SMS',
    recipient_phone VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    provider VARCHAR(50),
    provider_message_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_notif_type CHECK (notification_type IN (
        'BOOKING_CONFIRMATION','REMINDER_24H','REMINDER_2H',
        'CANCELLATION','RESCHEDULE','NO_SHOW_FOLLOWUP','DOCTOR_DELAY'
    )),
    CONSTRAINT chk_notif_status CHECK (status IN (
        'PENDING','QUEUED','SENT','DELIVERED','FAILED','CANCELLED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_notif_appointment ON appointment_notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notif_scheduled ON appointment_notifications(scheduled_at, status)
    WHERE status = 'PENDING';
