"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireSession, requirePermission } from "@/lib/session";
import { getDayCode, timeToMin, minToTime, generateSlotTimes } from "@/lib/schedule-utils";

export async function setWorkingHours(data: {
    doctor_id: string;
    day_of_week: string;
    is_working_day: boolean;
    start_time?: string;
    end_time?: string;
    slot_duration_min?: number;
    break_start?: string;
    break_end?: string;
    max_patients?: number;
    effective_from: string;
    effective_to?: string;
}) {
    const session = await requireSession();
    requirePermission(session, "appointments:update", "config:update");

    const result = await db.query(
        `INSERT INTO doctor_working_hours (
       clinic_id, doctor_id, day_of_week, is_working_day,
       start_time, end_time, slot_duration_min,
       break_start, break_end, max_patients,
       effective_from, effective_to, created_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
        [
            session.clinic_id, data.doctor_id, data.day_of_week, data.is_working_day,
            data.start_time, data.end_time, data.slot_duration_min || 15,
            data.break_start, data.break_end, data.max_patients,
            data.effective_from, data.effective_to, session.user_id,
        ]
    );

    revalidatePath("/dashboard");
    return { success: true, schedule: result.rows[0] };
}

export async function generateSlots(doctorId: string, date: string) {
    console.log("Generating slots for", doctorId, date);
    const session = await requireSession();
    const dayCode = getDayCode(date);
    console.log("Day code:", dayCode);

    // 1. Check for time blocks (full day leaves/holidays, etc)
    const blocksResult = await db.query(
        `SELECT * FROM time_blocks 
         WHERE clinic_id = $1 
         AND (doctor_id = $2 OR doctor_id IS NULL)
         AND status = 'APPROVED'
         AND start_date <= $3 AND end_date >= $3`,
        [session.clinic_id, doctorId, date]
    );
    const dayBlocks = blocksResult.rows;
    const isFullDayBlocked = dayBlocks.some((b: any) => b.is_full_day);
    const blockReason = dayBlocks.length > 0 ? dayBlocks[0].title : null;

    // 2. Check for slot overrides
    let overrideBehavior = "NONE";
    let overrideSlots: any[] = [];

    const overrideResult = await db.query(
        `SELECT * FROM slot_overrides 
         WHERE clinic_id = $1 AND doctor_id = $2 AND override_date = $3`,
        [session.clinic_id, doctorId, date]
    );

    if (overrideResult.rows.length > 0) {
        const override = overrideResult.rows[0];
        overrideBehavior = override.override_behavior;

        const tsResult = await db.query(
            `SELECT * FROM override_time_slots WHERE override_id = $1 ORDER BY sort_order`,
            [override.override_id]
        );
        overrideSlots = tsResult.rows;
    }

    // 3. Get template slots if applicable
    let templateSlots: any[] = [];
    if (overrideBehavior !== "REPLACE") {
        const { getActiveTemplate } = await import("@/actions/schedule-templates");
        const template = await getActiveTemplate(doctorId);
        if (template) {
            const dayConfig = template.days?.find((d: any) => d.day_of_week === dayCode);
            if (dayConfig && dayConfig.is_working_day && dayConfig.time_slots) {
                const dur = dayConfig.slot_duration_override || template.slot_duration_min || 15;
                const buf = dayConfig.buffer_time_override || template.buffer_time_min || 0;

                for (const ts of dayConfig.time_slots) {
                    const tsDur = ts.slot_duration_override || dur;
                    const breaks = (dayConfig.breaks || [])
                        .filter((b: any) => b.time_slot_id === ts.time_slot_id)
                        .map((b: any) => ({ startMin: timeToMin(b.start_time), endMin: timeToMin(b.end_time) }));

                    const slots = generateSlotTimes(
                        timeToMin(ts.start_time),
                        timeToMin(ts.end_time),
                        tsDur,
                        buf,
                        breaks
                    );

                    slots.forEach(s => {
                        templateSlots.push({
                            start_time: s.start,
                            end_time: s.end,
                            duration: tsDur,
                            type: ts.slot_type
                        });
                    });
                }
            }
        }
    }

    // 4. Incorporate override slots
    let finalSlots: any[] = [];
    if (overrideBehavior === "REPLACE") {
        for (const ts of overrideSlots) {
            const tsDur = ts.slot_duration_min || 15;
            const breaks = [];
            if (ts.break_start && ts.break_end) {
                breaks.push({ startMin: timeToMin(ts.break_start), endMin: timeToMin(ts.break_end) });
            }
            const slots = generateSlotTimes(
                timeToMin(ts.start_time),
                timeToMin(ts.end_time),
                tsDur,
                0,
                breaks
            );
            slots.forEach(s => {
                finalSlots.push({
                    start_time: s.start,
                    end_time: s.end,
                    duration: tsDur,
                    type: ts.slot_type
                });
            });
        }
    } else {
        finalSlots = [...templateSlots];
        if (overrideBehavior === "ADD") {
            for (const ts of overrideSlots) {
                const tsDur = ts.slot_duration_min || 15;
                const breaks = [];
                if (ts.break_start && ts.break_end) {
                    breaks.push({ startMin: timeToMin(ts.break_start), endMin: timeToMin(ts.break_end) });
                }
                const addSlots = generateSlotTimes(
                    timeToMin(ts.start_time),
                    timeToMin(ts.end_time),
                    tsDur,
                    0,
                    breaks
                );
                addSlots.forEach(s => {
                    finalSlots.push({
                        start_time: s.start,
                        end_time: s.end,
                        duration: tsDur,
                        type: ts.slot_type
                    });
                });
            }
        }
    }

    // Sort slots by start time
    finalSlots.sort((a, b) => timeToMin(a.start_time) - timeToMin(b.start_time));

    // 5. Insert into DB
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        for (const slot of finalSlots) {
            let status = isFullDayBlocked ? "BLOCKED" : "AVAILABLE";
            let reason = isFullDayBlocked ? blockReason : null;

            if (!isFullDayBlocked) {
                const sMin = timeToMin(slot.start_time);
                const eMin = timeToMin(slot.end_time);
                const overlappingBlock = dayBlocks.find((b: any) => {
                    if (b.is_full_day) return true;
                    if (b.start_time && b.end_time) {
                        const bStart = timeToMin(b.start_time);
                        const bEnd = timeToMin(b.end_time);
                        return sMin < bEnd && bStart < eMin;
                    }
                    return false;
                });

                if (overlappingBlock) {
                    status = "BLOCKED";
                    reason = overlappingBlock.title;
                }
            }

            await client.query(
                `INSERT INTO appointment_slots (clinic_id, doctor_id, slot_date, slot_start_time, slot_end_time, slot_duration_min, status, blocked_reason)
                  VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                  ON CONFLICT (doctor_id, slot_date, slot_start_time) DO NOTHING`,
                [session.clinic_id, doctorId, date, slot.start_time, slot.end_time, slot.duration, status, reason]
            );
        }
        await client.query("COMMIT");
        console.log("Successfully committed", finalSlots.length, "slots");
    } catch (e) {
        console.error("Error inserting slots:", e);
        await client.query("ROLLBACK");
    } finally {
        client.release();
    }

    // 6. Return all slots
    const slotsResult = await db.query(
        `SELECT s.*, a.patient_id, p.first_name || ' ' || p.last_name as patient_name
         FROM appointment_slots s
         LEFT JOIN appointments a ON s.slot_id = a.slot_id AND a.status NOT IN ('CANCELLED_BY_PATIENT','CANCELLED_BY_CLINIC','CANCELLED_BY_SYSTEM')
         LEFT JOIN patients p ON a.patient_id = p.patient_id
         WHERE s.doctor_id = $1 AND s.slot_date = $2 AND s.clinic_id = $3
         ORDER BY s.slot_start_time`,
        [doctorId, date, session.clinic_id]
    );

    return { slots: slotsResult.rows };
}

export async function getAvailableSlots(doctorId: string, date: string) {
    console.log("getAvailableSlots called for:", doctorId, date);
    const session = await requireSession();

    // Ensure slots exist
    const existing = await db.query(
        "SELECT COUNT(*) as cnt FROM appointment_slots WHERE doctor_id = $1 AND slot_date = $2",
        [doctorId, date]
    );
    console.log("Existing slot count:", existing.rows[0].cnt);
    if (parseInt(existing.rows[0].cnt) === 0) {
        console.log("Generating new slots...");
        await generateSlots(doctorId, date);
    }

    const result = await db.query(
        `SELECT * FROM appointment_slots
     WHERE doctor_id = $1 AND slot_date = $2 AND clinic_id = $3 AND status = 'AVAILABLE'
     ORDER BY slot_start_time`,
        [doctorId, date, session.clinic_id]
    );

    return result.rows;
}

export async function getDoctors() {
    const session = await requireSession();

    // Get doctors with their details
    const result = await db.query(
        `SELECT u.user_id as doctor_id, u.first_name, u.last_name, u.email
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.clinic_id = $1 AND r.role_name = 'doctor' AND u.status = 'ACTIVE'
         ORDER BY u.first_name, u.last_name`,
        [session.clinic_id]
    );

    return result.rows;
}
