"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireSession, requirePermission } from "@/lib/session";
import type {
    ScheduleTemplate,
    TemplateDay,
    TemplateTimeSlot,
    TemplateBreak,
} from "@/lib/types";

// ============================================
// TEMPLATE CRUD
// ============================================

/** Get all templates for a doctor */
export async function getTemplates(doctorId: string): Promise<ScheduleTemplate[]> {
    const session = await requireSession();
    const result = await db.query(
        `SELECT * FROM schedule_templates
         WHERE doctor_id = $1 AND clinic_id = $2
         ORDER BY is_active DESC, created_at DESC`,
        [doctorId, session.clinic_id]
    );
    return result.rows;
}

/** Get the active template with full day/slot/break data */
export async function getActiveTemplate(doctorId: string): Promise<ScheduleTemplate | null> {
    const session = await requireSession();

    const tplResult = await db.query(
        `SELECT * FROM schedule_templates
         WHERE doctor_id = $1 AND clinic_id = $2 AND is_active = true
         LIMIT 1`,
        [doctorId, session.clinic_id]
    );
    if (tplResult.rows.length === 0) return null;
    const template: ScheduleTemplate = tplResult.rows[0];

    // Load days
    const daysResult = await db.query(
        `SELECT * FROM template_days WHERE template_id = $1
         ORDER BY CASE day_of_week
           WHEN 'MON' THEN 1 WHEN 'TUE' THEN 2 WHEN 'WED' THEN 3
           WHEN 'THU' THEN 4 WHEN 'FRI' THEN 5 WHEN 'SAT' THEN 6
           WHEN 'SUN' THEN 7 END`,
        [template.template_id]
    );

    // Load time slots and breaks for all days in one query each
    const dayIds = daysResult.rows.map((d: TemplateDay) => d.day_id);

    let allSlots: TemplateTimeSlot[] = [];
    let allBreaks: TemplateBreak[] = [];

    if (dayIds.length > 0) {
        const slotsResult = await db.query(
            `SELECT * FROM template_time_slots WHERE day_id = ANY($1) ORDER BY sort_order`,
            [dayIds]
        );
        allSlots = slotsResult.rows;

        const breaksResult = await db.query(
            `SELECT * FROM template_breaks WHERE day_id = ANY($1) ORDER BY start_time`,
            [dayIds]
        );
        allBreaks = breaksResult.rows;
    }

    // Assemble
    template.days = daysResult.rows.map((day: TemplateDay) => ({
        ...day,
        time_slots: allSlots.filter((s) => s.day_id === day.day_id),
        breaks: allBreaks.filter((b) => b.day_id === day.day_id),
    }));

    return template;
}

/** Get a specific template by ID with full day/slot/break data */
export async function getTemplateById(templateId: string): Promise<ScheduleTemplate | null> {
    const session = await requireSession();

    const tplResult = await db.query(
        `SELECT * FROM schedule_templates WHERE template_id = $1 AND clinic_id = $2`,
        [templateId, session.clinic_id]
    );
    if (tplResult.rows.length === 0) return null;
    const template: ScheduleTemplate = tplResult.rows[0];

    const daysResult = await db.query(
        `SELECT * FROM template_days WHERE template_id = $1
         ORDER BY CASE day_of_week
           WHEN 'MON' THEN 1 WHEN 'TUE' THEN 2 WHEN 'WED' THEN 3
           WHEN 'THU' THEN 4 WHEN 'FRI' THEN 5 WHEN 'SAT' THEN 6
           WHEN 'SUN' THEN 7 END`,
        [template.template_id]
    );

    const dayIds = daysResult.rows.map((d: TemplateDay) => d.day_id);
    let allSlots: TemplateTimeSlot[] = [];
    let allBreaks: TemplateBreak[] = [];

    if (dayIds.length > 0) {
        const slotsResult = await db.query(
            `SELECT * FROM template_time_slots WHERE day_id = ANY($1) ORDER BY sort_order`,
            [dayIds]
        );
        allSlots = slotsResult.rows;

        const breaksResult = await db.query(
            `SELECT * FROM template_breaks WHERE day_id = ANY($1) ORDER BY start_time`,
            [dayIds]
        );
        allBreaks = breaksResult.rows;
    }

    template.days = daysResult.rows.map((day: TemplateDay) => ({
        ...day,
        time_slots: allSlots.filter((s) => s.day_id === day.day_id),
        breaks: allBreaks.filter((b) => b.day_id === day.day_id),
    }));

    return template;
}

/** Create a new schedule template */
export async function createTemplate(data: {
    doctor_id: string;
    template_name: string;
    template_type?: "REGULAR" | "TEMPORARY";
    slot_duration_min?: number;
    buffer_time_min?: number;
    effective_from: string;
    effective_to?: string;
    notes?: string;
    copy_from_template_id?: string;
}) {
    const session = await requireSession();
    requirePermission(session, "config:update", "appointments:update");

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const result = await client.query(
            `INSERT INTO schedule_templates
             (clinic_id, doctor_id, template_name, template_type, slot_duration_min, buffer_time_min,
              effective_from, effective_to, notes, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             RETURNING *`,
            [
                session.clinic_id, data.doctor_id, data.template_name,
                data.template_type || "REGULAR",
                data.slot_duration_min || 15, data.buffer_time_min || 0,
                data.effective_from, data.effective_to || null,
                data.notes || null, session.user_id,
            ]
        );
        const template = result.rows[0];

        // Create 7 day entries (all off by default)
        const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
        for (const day of days) {
            await client.query(
                `INSERT INTO template_days (template_id, day_of_week, is_working_day) VALUES ($1,$2,false)`,
                [template.template_id, day]
            );
        }

        // Copy from existing template if requested
        if (data.copy_from_template_id) {
            const srcDays = await client.query(
                `SELECT * FROM template_days WHERE template_id = $1`,
                [data.copy_from_template_id]
            );
            for (const srcDay of srcDays.rows) {
                // Update the matching day
                const destDay = await client.query(
                    `UPDATE template_days SET is_working_day = $2, slot_duration_override = $3, buffer_time_override = $4
                     WHERE template_id = $1 AND day_of_week = $5 RETURNING day_id`,
                    [template.template_id, srcDay.is_working_day, srcDay.slot_duration_override, srcDay.buffer_time_override, srcDay.day_of_week]
                );
                const newDayId = destDay.rows[0].day_id;

                // Copy time slots
                const srcSlots = await client.query(
                    `SELECT * FROM template_time_slots WHERE day_id = $1 ORDER BY sort_order`,
                    [srcDay.day_id]
                );
                for (const srcSlot of srcSlots.rows) {
                    const newSlot = await client.query(
                        `INSERT INTO template_time_slots (day_id, start_time, end_time, slot_type, slot_duration_override, sort_order)
                         VALUES ($1,$2,$3,$4,$5,$6) RETURNING time_slot_id`,
                        [newDayId, srcSlot.start_time, srcSlot.end_time, srcSlot.slot_type, srcSlot.slot_duration_override, srcSlot.sort_order]
                    );

                    // Copy breaks for this slot
                    const srcBreaks = await client.query(
                        `SELECT * FROM template_breaks WHERE time_slot_id = $1`,
                        [srcSlot.time_slot_id]
                    );
                    for (const srcBreak of srcBreaks.rows) {
                        await client.query(
                            `INSERT INTO template_breaks (day_id, time_slot_id, break_type, start_time, end_time, label)
                             VALUES ($1,$2,$3,$4,$5,$6)`,
                            [newDayId, newSlot.rows[0].time_slot_id, srcBreak.break_type, srcBreak.start_time, srcBreak.end_time, srcBreak.label]
                        );
                    }
                }
            }
        }

        await client.query("COMMIT");
        revalidatePath("/dashboard");
        return { success: true, template };
    } catch (error) {
        await client.query("ROLLBACK");
        return { error: (error as Error).message };
    } finally {
        client.release();
    }
}

/** Update template metadata */
export async function updateTemplate(templateId: string, data: {
    template_name?: string;
    template_type?: "REGULAR" | "TEMPORARY";
    slot_duration_min?: number;
    buffer_time_min?: number;
    effective_from?: string;
    effective_to?: string;
    notes?: string;
}) {
    const session = await requireSession();
    requirePermission(session, "config:update", "appointments:update");

    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 3;

    if (data.template_name !== undefined) { sets.push(`template_name = $${idx++}`); vals.push(data.template_name); }
    if (data.template_type !== undefined) { sets.push(`template_type = $${idx++}`); vals.push(data.template_type); }
    if (data.slot_duration_min !== undefined) { sets.push(`slot_duration_min = $${idx++}`); vals.push(data.slot_duration_min); }
    if (data.buffer_time_min !== undefined) { sets.push(`buffer_time_min = $${idx++}`); vals.push(data.buffer_time_min); }
    if (data.effective_from !== undefined) { sets.push(`effective_from = $${idx++}`); vals.push(data.effective_from); }
    if (data.effective_to !== undefined) { sets.push(`effective_to = $${idx++}`); vals.push(data.effective_to); }
    if (data.notes !== undefined) { sets.push(`notes = $${idx++}`); vals.push(data.notes); }

    if (sets.length === 0) return { error: "No fields to update" };

    const result = await db.query(
        `UPDATE schedule_templates SET ${sets.join(", ")}
         WHERE template_id = $1 AND clinic_id = $2 RETURNING *`,
        [templateId, session.clinic_id, ...vals]
    );

    if (result.rows.length === 0) return { error: "Template not found" };
    revalidatePath("/dashboard");
    return { success: true, template: result.rows[0] };
}

/** Activate a template (deactivates the current active one) */
export async function activateTemplate(templateId: string) {
    const session = await requireSession();
    requirePermission(session, "config:update", "appointments:update");

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        // Get this template's doctor_id
        const tpl = await client.query(
            `SELECT doctor_id FROM schedule_templates WHERE template_id = $1 AND clinic_id = $2`,
            [templateId, session.clinic_id]
        );
        if (tpl.rows.length === 0) throw new Error("Template not found");

        // Deactivate current active
        await client.query(
            `UPDATE schedule_templates SET is_active = false
             WHERE doctor_id = $1 AND clinic_id = $2 AND is_active = true`,
            [tpl.rows[0].doctor_id, session.clinic_id]
        );

        // Activate this one
        await client.query(
            `UPDATE schedule_templates SET is_active = true, version = version + 1
             WHERE template_id = $1`,
            [templateId]
        );

        await client.query("COMMIT");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        await client.query("ROLLBACK");
        return { error: (error as Error).message };
    } finally {
        client.release();
    }
}

/** Deactivate a template */
export async function deactivateTemplate(templateId: string) {
    const session = await requireSession();
    requirePermission(session, "config:update", "appointments:update");

    const result = await db.query(
        `UPDATE schedule_templates SET is_active = false
         WHERE template_id = $1 AND clinic_id = $2 RETURNING *`,
        [templateId, session.clinic_id]
    );

    if (result.rows.length === 0) return { error: "Template not found" };
    revalidatePath("/dashboard");
    return { success: true };
}

// ============================================
// DAY + TIME SLOT + BREAK MANAGEMENT
// ============================================

/** Save a day's full configuration (toggle, time slots, breaks) */
export async function saveTemplateDay(data: {
    day_id: string;
    is_working_day: boolean;
    slot_duration_override?: number | null;
    buffer_time_override?: number | null;
    time_slots: {
        time_slot_id?: string; // existing slot to update, or undefined for new
        start_time: string;
        end_time: string;
        slot_type: string;
        slot_duration_override?: number | null;
        sort_order: number;
        breaks: {
            break_id?: string;
            break_type: string;
            start_time: string;
            end_time: string;
            label?: string;
        }[];
    }[];
}) {
    const session = await requireSession();
    requirePermission(session, "config:update", "appointments:update");

    // Validate max constraints
    if (data.time_slots.length > 3) return { error: "Maximum 3 time slots per day" };
    const totalBreaks = data.time_slots.reduce((sum, s) => sum + s.breaks.length, 0);
    if (totalBreaks > 2) return { error: "Maximum 2 breaks per day" };

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        // Verify ownership
        const dayCheck = await client.query(
            `SELECT td.day_id, st.clinic_id FROM template_days td
             JOIN schedule_templates st ON td.template_id = st.template_id
             WHERE td.day_id = $1 AND st.clinic_id = $2`,
            [data.day_id, session.clinic_id]
        );
        if (dayCheck.rows.length === 0) throw new Error("Day not found");

        // Update day
        await client.query(
            `UPDATE template_days SET is_working_day = $2, slot_duration_override = $3, buffer_time_override = $4
             WHERE day_id = $1`,
            [data.day_id, data.is_working_day, data.slot_duration_override ?? null, data.buffer_time_override ?? null]
        );

        // Delete old slots & breaks (cascade deletes breaks)
        await client.query(`DELETE FROM template_time_slots WHERE day_id = $1`, [data.day_id]);

        // Insert new time slots and breaks
        if (data.is_working_day) {
            for (const slot of data.time_slots) {
                const slotResult = await client.query(
                    `INSERT INTO template_time_slots (day_id, start_time, end_time, slot_type, slot_duration_override, sort_order)
                     VALUES ($1,$2,$3,$4,$5,$6) RETURNING time_slot_id`,
                    [data.day_id, slot.start_time, slot.end_time, slot.slot_type, slot.slot_duration_override ?? null, slot.sort_order]
                );
                const newSlotId = slotResult.rows[0].time_slot_id;

                for (const brk of slot.breaks) {
                    await client.query(
                        `INSERT INTO template_breaks (day_id, time_slot_id, break_type, start_time, end_time, label)
                         VALUES ($1,$2,$3,$4,$5,$6)`,
                        [data.day_id, newSlotId, brk.break_type, brk.start_time, brk.end_time, brk.label || null]
                    );
                }
            }
        }

        await client.query("COMMIT");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        await client.query("ROLLBACK");
        return { error: (error as Error).message };
    } finally {
        client.release();
    }
}

/** Get doctors list for the selector dropdown */
export async function getDoctors() {
    const session = await requireSession();
    const result = await db.query(
        `SELECT u.user_id, u.first_name, u.last_name, u.email
         FROM users u JOIN roles r ON u.role_id = r.role_id
         WHERE u.clinic_id = $1 AND r.role_name = 'doctor' AND u.status = 'active'
         ORDER BY u.first_name`,
        [session.clinic_id]
    );
    return result.rows;
}
