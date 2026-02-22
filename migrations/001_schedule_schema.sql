-- ============================================================
-- Doctor Schedule & Availability — Schema Evolution
-- Sub-Module 1 of Appointments & Visit Management
-- ============================================================

BEGIN;

-- ============================================================
-- 1. SCHEDULE TEMPLATES
-- A named, reusable weekly schedule pattern for a doctor.
-- Only one may be active per doctor at a time (partial unique index).
-- ============================================================
CREATE TABLE IF NOT EXISTS schedule_templates (
    template_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id       UUID NOT NULL REFERENCES organization_config(clinic_id),
    doctor_id       UUID NOT NULL REFERENCES users(user_id),
    template_name   VARCHAR(100) NOT NULL,
    template_type   VARCHAR(20) NOT NULL DEFAULT 'REGULAR',
    is_active       BOOLEAN NOT NULL DEFAULT false,
    slot_duration_min   INTEGER NOT NULL DEFAULT 15,
    buffer_time_min     INTEGER NOT NULL DEFAULT 0,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    notes           TEXT,
    version         INTEGER NOT NULL DEFAULT 1,
    created_by      UUID NOT NULL REFERENCES users(user_id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_template_type CHECK (template_type IN ('REGULAR', 'TEMPORARY')),
    CONSTRAINT chk_template_slot_dur CHECK (slot_duration_min BETWEEN 5 AND 120),
    CONSTRAINT chk_template_buffer CHECK (buffer_time_min BETWEEN 0 AND 60),
    CONSTRAINT chk_template_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- Only one active regular template per doctor
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_template
    ON schedule_templates (doctor_id) WHERE (is_active = true);

CREATE INDEX IF NOT EXISTS idx_st_clinic ON schedule_templates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_st_doctor ON schedule_templates(doctor_id);

-- ============================================================
-- 2. TEMPLATE DAYS
-- Per-day working/off configuration within a template.
-- ============================================================
CREATE TABLE IF NOT EXISTS template_days (
    day_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID NOT NULL REFERENCES schedule_templates(template_id) ON DELETE CASCADE,
    day_of_week     VARCHAR(3) NOT NULL,
    is_working_day  BOOLEAN NOT NULL DEFAULT false,
    slot_duration_override  INTEGER,
    buffer_time_override    INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_td_day CHECK (day_of_week IN ('MON','TUE','WED','THU','FRI','SAT','SUN')),
    CONSTRAINT chk_td_slot_dur CHECK (slot_duration_override IS NULL OR slot_duration_override BETWEEN 5 AND 120),
    CONSTRAINT chk_td_buffer CHECK (buffer_time_override IS NULL OR buffer_time_override BETWEEN 0 AND 60),
    CONSTRAINT uq_template_day UNIQUE (template_id, day_of_week)
);

-- ============================================================
-- 3. TEMPLATE TIME SLOTS
-- Multiple working periods per day (max 3, enforced at app level).
-- ============================================================
CREATE TABLE IF NOT EXISTS template_time_slots (
    time_slot_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id          UUID NOT NULL REFERENCES template_days(day_id) ON DELETE CASCADE,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    slot_type       VARCHAR(20) NOT NULL DEFAULT 'CONSULTATION',
    slot_duration_override  INTEGER,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_ts_times CHECK (end_time > start_time),
    CONSTRAINT chk_ts_min_span CHECK ((EXTRACT(EPOCH FROM (end_time - start_time)) / 60) >= 30),
    CONSTRAINT chk_ts_type CHECK (slot_type IN ('CONSULTATION', 'PROCEDURE', 'EMERGENCY')),
    CONSTRAINT chk_ts_dur_override CHECK (slot_duration_override IS NULL OR slot_duration_override BETWEEN 5 AND 120)
);

CREATE INDEX IF NOT EXISTS idx_tts_day ON template_time_slots(day_id);

-- ============================================================
-- 4. TEMPLATE BREAKS
-- Breaks within a time slot (max 2/day, enforced at app level).
-- ============================================================
CREATE TABLE IF NOT EXISTS template_breaks (
    break_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id          UUID NOT NULL REFERENCES template_days(day_id) ON DELETE CASCADE,
    time_slot_id    UUID NOT NULL REFERENCES template_time_slots(time_slot_id) ON DELETE CASCADE,
    break_type      VARCHAR(20) NOT NULL DEFAULT 'LUNCH',
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    label           VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_brk_times CHECK (end_time > start_time),
    CONSTRAINT chk_brk_min CHECK ((EXTRACT(EPOCH FROM (end_time - start_time)) / 60) >= 15),
    CONSTRAINT chk_brk_type CHECK (break_type IN ('LUNCH', 'TEA', 'MEETING', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_tb_day ON template_breaks(day_id);

-- ============================================================
-- 5. TIME BLOCKS (replaces doctor_leaves)
-- Leaves, holidays, meetings — with approval workflow.
-- ============================================================
CREATE TABLE IF NOT EXISTS time_blocks (
    block_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id       UUID NOT NULL REFERENCES organization_config(clinic_id),
    doctor_id       UUID NOT NULL REFERENCES users(user_id),
    block_type      VARCHAR(20) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    reason          TEXT,
    is_full_day     BOOLEAN NOT NULL DEFAULT true,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    start_time      TIME,
    end_time        TIME,
    -- Recurrence
    repeat_pattern  VARCHAR(20) NOT NULL DEFAULT 'NONE',
    repeat_until    DATE,
    -- Approval
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_by     UUID REFERENCES users(user_id),
    approved_at     TIMESTAMPTZ,
    rejection_reason TEXT,
    -- Metadata
    created_by      UUID NOT NULL REFERENCES users(user_id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_tb_block_type CHECK (block_type IN ('LEAVE', 'HOLIDAY', 'MEETING', 'EMERGENCY', 'PERSONAL')),
    CONSTRAINT chk_tb_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_tb_times CHECK (
        is_full_day = true
        OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
    ),
    CONSTRAINT chk_tb_repeat CHECK (repeat_pattern IN ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
    CONSTRAINT chk_tb_repeat_until CHECK (repeat_pattern = 'NONE' OR repeat_until IS NOT NULL),
    CONSTRAINT chk_tb_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_tblk_clinic ON time_blocks(clinic_id, start_date);
CREATE INDEX IF NOT EXISTS idx_tblk_doctor ON time_blocks(doctor_id, start_date);
CREATE INDEX IF NOT EXISTS idx_tblk_status ON time_blocks(status);

-- ============================================================
-- 6. SLOT OVERRIDES
-- Custom schedule for one specific date per doctor.
-- ============================================================
CREATE TABLE IF NOT EXISTS slot_overrides (
    override_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id       UUID NOT NULL REFERENCES organization_config(clinic_id),
    doctor_id       UUID NOT NULL REFERENCES users(user_id),
    override_date   DATE NOT NULL,
    reason          VARCHAR(200),
    override_behavior VARCHAR(10) NOT NULL DEFAULT 'REPLACE',
    created_by      UUID NOT NULL REFERENCES users(user_id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_so_behavior CHECK (override_behavior IN ('REPLACE', 'ADD')),
    CONSTRAINT uq_override_per_day UNIQUE (doctor_id, override_date)
);

CREATE INDEX IF NOT EXISTS idx_so_clinic ON slot_overrides(clinic_id);
CREATE INDEX IF NOT EXISTS idx_so_doctor ON slot_overrides(doctor_id, override_date);

-- ============================================================
-- 7. OVERRIDE TIME SLOTS
-- Time slots within a slot override.
-- ============================================================
CREATE TABLE IF NOT EXISTS override_time_slots (
    time_slot_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    override_id     UUID NOT NULL REFERENCES slot_overrides(override_id) ON DELETE CASCADE,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    slot_type       VARCHAR(20) NOT NULL DEFAULT 'CONSULTATION',
    slot_duration_min INTEGER NOT NULL DEFAULT 15,
    break_start     TIME,
    break_end       TIME,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_ots_times CHECK (end_time > start_time),
    CONSTRAINT chk_ots_min_span CHECK ((EXTRACT(EPOCH FROM (end_time - start_time)) / 60) >= 30),
    CONSTRAINT chk_ots_type CHECK (slot_type IN ('CONSULTATION', 'PROCEDURE', 'EMERGENCY')),
    CONSTRAINT chk_ots_break CHECK (break_end IS NULL OR (break_start IS NOT NULL AND break_end > break_start))
);

CREATE INDEX IF NOT EXISTS idx_ots_override ON override_time_slots(override_id);

-- ============================================================
-- Auto-update timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_st_updated_at') THEN
        CREATE TRIGGER trg_st_updated_at BEFORE UPDATE ON schedule_templates
            FOR EACH ROW EXECUTE FUNCTION update_schedule_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_td_updated_at') THEN
        CREATE TRIGGER trg_td_updated_at BEFORE UPDATE ON template_days
            FOR EACH ROW EXECUTE FUNCTION update_schedule_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tblk_updated_at') THEN
        CREATE TRIGGER trg_tblk_updated_at BEFORE UPDATE ON time_blocks
            FOR EACH ROW EXECUTE FUNCTION update_schedule_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_so_updated_at') THEN
        CREATE TRIGGER trg_so_updated_at BEFORE UPDATE ON slot_overrides
            FOR EACH ROW EXECUTE FUNCTION update_schedule_updated_at();
    END IF;
END $$;

COMMIT;
