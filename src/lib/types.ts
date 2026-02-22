// ============================================
// Database Entity Types
// ============================================

export interface Clinic {
    clinic_id: string;
    clinic_name: string;
    country_code: string;
    timezone: string;
    currency_code: string;
    language_code: string;
    specialty_type: string;
    status: string;
    subscription_plan: string;
    // Clinical config
    visit_types?: string[];
    diagnosis_style?: string;
    measurement_system?: string;
    prescription_rules?: Record<string, unknown>;
    required_fields?: Record<string, unknown>;
    // AI config
    enable_summarization?: boolean;
    enable_suggestions?: boolean;
    enable_risk_flagging?: boolean;
    enable_prescription_assist?: boolean;
    suggestion_confidence_threshold?: number;
    explainability_level?: string;
}

export interface User {
    user_id: string;
    clinic_id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role_name: string;
    status: string;
    permissions: string[];
}

export interface SessionUser {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    clinic_id: string;
    role: string;
    permissions: string[];
}

export interface Patient {
    patient_id: string;
    clinic_id: string;
    first_name: string;
    last_name: string;
    phone: string;
    date_of_birth?: string;
    age?: number;
    gender?: string;
    email?: string;
    blood_group?: string;
    profile_complete: boolean;
    created_via?: string;
    status: string;
}

export interface DoctorWorkingHours {
    schedule_id: string;
    clinic_id: string;
    doctor_id: string;
    day_of_week: string;
    is_working_day: boolean;
    start_time?: string;
    end_time?: string;
    slot_duration_min: number;
    break_start?: string;
    break_end?: string;
    max_patients?: number;
    effective_from: string;
    effective_to?: string;
}

export interface AppointmentSlot {
    slot_id: string;
    clinic_id: string;
    doctor_id: string;
    slot_date: string;
    slot_start_time: string;
    slot_end_time: string;
    slot_duration_min: number;
    status: "AVAILABLE" | "BOOKED" | "BLOCKED" | "COMPLETED" | "NO_SHOW";
    blocked_reason?: string;
    patient_name?: string;
}

export interface Appointment {
    appointment_id: string;
    clinic_id: string;
    patient_id: string;
    doctor_id: string;
    slot_id: string;
    appointment_date: string;
    appointment_time: string;
    estimated_end_time?: string;
    actual_start_time?: string;
    actual_end_time?: string;
    visit_type: string;
    reason_for_visit?: string;
    source: string;
    is_first_visit: boolean;
    status: string;
    check_in_time?: string;
    consultation_start?: string;
    consultation_end?: string;
    wait_time_minutes?: number;
    rescheduled_count: number;
    patient_name?: string;
    patient_phone?: string;
    doctor_name?: string;
    age?: number;
    gender?: string;
    notes?: string;
}

export interface VisitContext {
    context_id: string;
    appointment_id: string;
    patient_id: string;
    summary?: string;
    visit_prediction?: string;
    pending_items: unknown[];
    allergies: unknown[];
    ongoing_medications: unknown[];
    risk_flags: { flag: string; suggestion: string; confidence: number }[];
    context_confidence?: number;
    generation_status: string;
    generated_at?: string;
}

export interface QueueData {
    in_consultation: Appointment | null;
    waiting: (Appointment & { wait_minutes?: number })[];
    upcoming: Appointment[];
    summary: {
        completed_today: number;
        cancelled_today: number;
        no_shows_today: number;
        total_waiting: number;
        total_upcoming: number;
    };
}

export interface DailySummary {
    date: string;
    scheduled: number;
    checked_in: number;
    in_consultation: number;
    completed: number;
    cancelled: number;
    no_show: number;
    total: number;
}

// ============================================
// Schedule & Availability Types
// ============================================

export interface ScheduleTemplate {
    template_id: string;
    clinic_id: string;
    doctor_id: string;
    template_name: string;
    template_type: "REGULAR" | "TEMPORARY";
    is_active: boolean;
    slot_duration_min: number;
    buffer_time_min: number;
    effective_from: string;
    effective_to?: string;
    notes?: string;
    version: number;
    created_by: string;
    created_at: string;
    updated_at: string;
    // Joined data
    days?: TemplateDay[];
}

export interface TemplateDay {
    day_id: string;
    template_id: string;
    day_of_week: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
    is_working_day: boolean;
    slot_duration_override?: number;
    buffer_time_override?: number;
    // Joined data
    time_slots?: TemplateTimeSlot[];
    breaks?: TemplateBreak[];
}

export interface TemplateTimeSlot {
    time_slot_id: string;
    day_id: string;
    start_time: string;
    end_time: string;
    slot_type: "CONSULTATION" | "PROCEDURE" | "EMERGENCY";
    slot_duration_override?: number;
    sort_order: number;
}

export interface TemplateBreak {
    break_id: string;
    day_id: string;
    time_slot_id: string;
    break_type: "LUNCH" | "TEA" | "MEETING" | "OTHER";
    start_time: string;
    end_time: string;
    label?: string;
}

export interface TimeBlock {
    block_id: string;
    clinic_id: string;
    doctor_id: string;
    block_type: "LEAVE" | "HOLIDAY" | "MEETING" | "EMERGENCY" | "PERSONAL";
    title: string;
    reason?: string;
    is_full_day: boolean;
    start_date: string;
    end_date: string;
    start_time?: string;
    end_time?: string;
    repeat_pattern: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    repeat_until?: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    approved_by?: string;
    approved_at?: string;
    rejection_reason?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    // Joined
    doctor_name?: string;
    approved_by_name?: string;
}

export interface SlotOverride {
    override_id: string;
    clinic_id: string;
    doctor_id: string;
    override_date: string;
    reason?: string;
    override_behavior: "REPLACE" | "ADD";
    created_by: string;
    created_at: string;
    updated_at: string;
    // Joined
    time_slots?: OverrideTimeSlot[];
}

export interface OverrideTimeSlot {
    time_slot_id: string;
    override_id: string;
    start_time: string;
    end_time: string;
    slot_type: "CONSULTATION" | "PROCEDURE" | "EMERGENCY";
    slot_duration_min: number;
    break_start?: string;
    break_end?: string;
    sort_order: number;
}

export interface ComputedSlot {
    start_time: string;
    end_time: string;
    slot_type: string;
    status: "AVAILABLE" | "BOOKED" | "BLOCKED";
    is_break: boolean;
    is_buffer: boolean;
}
