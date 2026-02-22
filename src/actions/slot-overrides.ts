"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireSession, requirePermission } from "@/lib/session";
import type { SlotOverride, OverrideTimeSlot } from "@/lib/types";

// ============================================
// SLOT OVERRIDES — CRUD
// ============================================

/** Get all overrides for a doctor */
export async function getOverrides(doctorId: string): Promise<SlotOverride[]> {
    const session = await requireSession();

    const result = await db.query(
        `SELECT * FROM slot_overrides
         WHERE doctor_id = $1 AND clinic_id = $2
         ORDER BY override_date DESC`,
        [doctorId, session.clinic_id]
    );

    const overrides: SlotOverride[] = result.rows;

    // Load time slots for each override
    if (overrides.length > 0) {
        const overrideIds = overrides.map((o) => o.override_id);
        const slotsResult = await db.query(
            `SELECT * FROM override_time_slots WHERE override_id = ANY($1) ORDER BY sort_order`,
            [overrideIds]
        );
        const allSlots: OverrideTimeSlot[] = slotsResult.rows;

        for (const override of overrides) {
            override.time_slots = allSlots.filter((s) => s.override_id === override.override_id);
        }
    }

    return overrides;
}

/** Create a slot override with its time slots */
export async function createOverride(data: {
    doctor_id: string;
    override_date: string;
    reason?: string;
    override_behavior: "REPLACE" | "ADD";
    time_slots: {
        start_time: string;
        end_time: string;
        slot_type?: string;
        slot_duration_min?: number;
        break_start?: string;
        break_end?: string;
        sort_order?: number;
    }[];
}) {
    const session = await requireSession();
    requirePermission(session, "config:update", "appointments:update");

    if (data.time_slots.length === 0) return { error: "At least one time slot is required" };

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        // Check no existing override for this date
        const existing = await client.query(
            `SELECT override_id FROM slot_overrides
             WHERE doctor_id = $1 AND override_date = $2`,
            [data.doctor_id, data.override_date]
        );
        if (existing.rows.length > 0) throw new Error("An override already exists for this date");

        const overrideResult = await client.query(
            `INSERT INTO slot_overrides (clinic_id, doctor_id, override_date, reason, override_behavior, created_by)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [session.clinic_id, data.doctor_id, data.override_date, data.reason || null, data.override_behavior, session.user_id]
        );
        const override = overrideResult.rows[0];

        // Insert time slots
        for (let i = 0; i < data.time_slots.length; i++) {
            const slot = data.time_slots[i];
            await client.query(
                `INSERT INTO override_time_slots
                 (override_id, start_time, end_time, slot_type, slot_duration_min, break_start, break_end, sort_order)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [
                    override.override_id, slot.start_time, slot.end_time,
                    slot.slot_type || "CONSULTATION", slot.slot_duration_min || 15,
                    slot.break_start || null, slot.break_end || null,
                    slot.sort_order ?? i,
                ]
            );
        }

        await client.query("COMMIT");
        revalidatePath("/dashboard");
        return { success: true, override };
    } catch (error) {
        await client.query("ROLLBACK");
        return { error: (error as Error).message };
    } finally {
        client.release();
    }
}

/** Update an existing slot override */
export async function updateOverride(overrideId: string, data: {
    reason?: string;
    override_behavior?: "REPLACE" | "ADD";
    time_slots?: {
        start_time: string;
        end_time: string;
        slot_type?: string;
        slot_duration_min?: number;
        break_start?: string;
        break_end?: string;
        sort_order?: number;
    }[];
}) {
    const session = await requireSession();
    requirePermission(session, "config:update", "appointments:update");

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        // Verify ownership
        const check = await client.query(
            `SELECT * FROM slot_overrides WHERE override_id = $1 AND clinic_id = $2`,
            [overrideId, session.clinic_id]
        );
        if (check.rows.length === 0) throw new Error("Override not found");

        // Update metadata
        if (data.reason !== undefined || data.override_behavior !== undefined) {
            const sets: string[] = [];
            const vals: unknown[] = [];
            let idx = 3;
            if (data.reason !== undefined) { sets.push(`reason = $${idx++}`); vals.push(data.reason); }
            if (data.override_behavior !== undefined) { sets.push(`override_behavior = $${idx++}`); vals.push(data.override_behavior); }

            await client.query(
                `UPDATE slot_overrides SET ${sets.join(", ")} WHERE override_id = $1 AND clinic_id = $2`,
                [overrideId, session.clinic_id, ...vals]
            );
        }

        // Replace time slots if provided
        if (data.time_slots && data.time_slots.length > 0) {
            await client.query(`DELETE FROM override_time_slots WHERE override_id = $1`, [overrideId]);

            for (let i = 0; i < data.time_slots.length; i++) {
                const slot = data.time_slots[i];
                await client.query(
                    `INSERT INTO override_time_slots
                     (override_id, start_time, end_time, slot_type, slot_duration_min, break_start, break_end, sort_order)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                    [
                        overrideId, slot.start_time, slot.end_time,
                        slot.slot_type || "CONSULTATION", slot.slot_duration_min || 15,
                        slot.break_start || null, slot.break_end || null,
                        slot.sort_order ?? i,
                    ]
                );
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

/** Delete a slot override */
export async function deleteOverride(overrideId: string) {
    const session = await requireSession();
    requirePermission(session, "config:update", "appointments:update");

    const result = await db.query(
        `DELETE FROM slot_overrides WHERE override_id = $1 AND clinic_id = $2 RETURNING *`,
        [overrideId, session.clinic_id]
    );

    if (result.rows.length === 0) return { error: "Override not found" };
    revalidatePath("/dashboard");
    return { success: true };
}
