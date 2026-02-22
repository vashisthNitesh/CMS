"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireSession, requirePermission } from "@/lib/session";
import type { TimeBlock } from "@/lib/types";

// ============================================
// TIME BLOCKS — CRUD + Approval Workflow
// ============================================

/** Get time blocks for a doctor with optional filters */
export async function getTimeBlocks(
    doctorId: string,
    filters?: {
        block_type?: string[];
        status?: string[];
        start_date?: string;
        end_date?: string;
    }
): Promise<TimeBlock[]> {
    const session = await requireSession();

    let query = `SELECT tb.*,
        u.first_name || ' ' || u.last_name AS doctor_name,
        a.first_name || ' ' || a.last_name AS approved_by_name
        FROM time_blocks tb
        JOIN users u ON tb.doctor_id = u.user_id
        LEFT JOIN users a ON tb.approved_by = a.user_id
        WHERE tb.doctor_id = $1 AND tb.clinic_id = $2`;

    const params: unknown[] = [doctorId, session.clinic_id];
    let idx = 3;

    if (filters?.block_type && filters.block_type.length > 0) {
        query += ` AND tb.block_type = ANY($${idx++})`;
        params.push(filters.block_type);
    }
    if (filters?.status && filters.status.length > 0) {
        query += ` AND tb.status = ANY($${idx++})`;
        params.push(filters.status);
    }
    if (filters?.start_date) {
        query += ` AND tb.end_date >= $${idx++}`;
        params.push(filters.start_date);
    }
    if (filters?.end_date) {
        query += ` AND tb.start_date <= $${idx++}`;
        params.push(filters.end_date);
    }

    query += ` ORDER BY tb.start_date DESC`;
    const result = await db.query(query, params);
    return result.rows;
}

/** Create a new time block */
export async function createTimeBlock(data: {
    doctor_id: string;
    block_type: string;
    title: string;
    reason?: string;
    is_full_day: boolean;
    start_date: string;
    end_date: string;
    start_time?: string;
    end_time?: string;
    repeat_pattern?: string;
    repeat_until?: string;
}) {
    const session = await requireSession();

    // Determine status: admin-created blocks are auto-approved
    // Leave requests from doctors default to PENDING
    // Meeting and Personal blocks don't need approval
    const isAdmin = session.role === "clinic_owner" || session.role === "super_admin";
    const needsApproval = data.block_type === "LEAVE" && !isAdmin;
    const autoApproved = !needsApproval;

    const result = await db.query(
        `INSERT INTO time_blocks
         (clinic_id, doctor_id, block_type, title, reason, is_full_day,
          start_date, end_date, start_time, end_time,
          repeat_pattern, repeat_until,
          status, approved_by, approved_at, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING *`,
        [
            session.clinic_id, data.doctor_id, data.block_type,
            data.title, data.reason || null, data.is_full_day,
            data.start_date, data.end_date,
            data.start_time || null, data.end_time || null,
            data.repeat_pattern || "NONE", data.repeat_until || null,
            autoApproved ? "APPROVED" : "PENDING",
            autoApproved ? session.user_id : null,
            autoApproved ? new Date().toISOString() : null,
            session.user_id,
        ]
    );

    revalidatePath("/dashboard");
    return { success: true, block: result.rows[0] };
}

/** Update an existing time block (only PENDING or admin-updating APPROVED) */
export async function updateTimeBlock(blockId: string, data: {
    title?: string;
    reason?: string;
    is_full_day?: boolean;
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    repeat_pattern?: string;
    repeat_until?: string;
}) {
    const session = await requireSession();

    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 3;

    if (data.title !== undefined) { sets.push(`title = $${idx++}`); vals.push(data.title); }
    if (data.reason !== undefined) { sets.push(`reason = $${idx++}`); vals.push(data.reason); }
    if (data.is_full_day !== undefined) { sets.push(`is_full_day = $${idx++}`); vals.push(data.is_full_day); }
    if (data.start_date !== undefined) { sets.push(`start_date = $${idx++}`); vals.push(data.start_date); }
    if (data.end_date !== undefined) { sets.push(`end_date = $${idx++}`); vals.push(data.end_date); }
    if (data.start_time !== undefined) { sets.push(`start_time = $${idx++}`); vals.push(data.start_time); }
    if (data.end_time !== undefined) { sets.push(`end_time = $${idx++}`); vals.push(data.end_time); }
    if (data.repeat_pattern !== undefined) { sets.push(`repeat_pattern = $${idx++}`); vals.push(data.repeat_pattern); }
    if (data.repeat_until !== undefined) { sets.push(`repeat_until = $${idx++}`); vals.push(data.repeat_until); }

    if (sets.length === 0) return { error: "No fields to update" };

    const result = await db.query(
        `UPDATE time_blocks SET ${sets.join(", ")}
         WHERE block_id = $1 AND clinic_id = $2 AND status IN ('PENDING', 'APPROVED')
         RETURNING *`,
        [blockId, session.clinic_id, ...vals]
    );

    if (result.rows.length === 0) return { error: "Block not found or cannot be edited (rejected/cancelled)" };
    revalidatePath("/dashboard");
    return { success: true, block: result.rows[0] };
}

/** Admin approves a pending leave request */
export async function approveTimeBlock(blockId: string) {
    const session = await requireSession();
    requirePermission(session, "config:update", "appointments:update");

    const result = await db.query(
        `UPDATE time_blocks SET status = 'APPROVED', approved_by = $3, approved_at = NOW()
         WHERE block_id = $1 AND clinic_id = $2 AND status = 'PENDING'
         RETURNING *`,
        [blockId, session.clinic_id, session.user_id]
    );

    if (result.rows.length === 0) return { error: "Block not found or not pending" };
    revalidatePath("/dashboard");
    return { success: true, block: result.rows[0] };
}

/** Admin rejects a pending leave request */
export async function rejectTimeBlock(blockId: string, reason: string) {
    const session = await requireSession();
    requirePermission(session, "config:update", "appointments:update");

    const result = await db.query(
        `UPDATE time_blocks SET status = 'REJECTED', rejection_reason = $3, approved_by = $4, approved_at = NOW()
         WHERE block_id = $1 AND clinic_id = $2 AND status = 'PENDING'
         RETURNING *`,
        [blockId, session.clinic_id, reason, session.user_id]
    );

    if (result.rows.length === 0) return { error: "Block not found or not pending" };
    revalidatePath("/dashboard");
    return { success: true, block: result.rows[0] };
}

/** Cancel an approved time block (releases slots) */
export async function cancelTimeBlock(blockId: string) {
    const session = await requireSession();

    const result = await db.query(
        `UPDATE time_blocks SET status = 'CANCELLED'
         WHERE block_id = $1 AND clinic_id = $2 AND status = 'APPROVED'
         RETURNING *`,
        [blockId, session.clinic_id]
    );

    if (result.rows.length === 0) return { error: "Block not found or not approved" };
    revalidatePath("/dashboard");
    return { success: true, block: result.rows[0] };
}

/** Doctor withdraws their own pending request */
export async function withdrawTimeBlock(blockId: string) {
    const session = await requireSession();

    const result = await db.query(
        `UPDATE time_blocks SET status = 'CANCELLED'
         WHERE block_id = $1 AND clinic_id = $2 AND created_by = $3 AND status = 'PENDING'
         RETURNING *`,
        [blockId, session.clinic_id, session.user_id]
    );

    if (result.rows.length === 0) return { error: "Block not found, not pending, or not yours" };
    revalidatePath("/dashboard");
    return { success: true };
}

/** Get count of appointments affected by a date range */
export async function getImpactAnalysis(doctorId: string, startDate: string, endDate: string) {
    const session = await requireSession();

    const result = await db.query(
        `SELECT a.appointment_id, a.appointment_date, a.appointment_time,
                p.first_name || ' ' || p.last_name AS patient_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.patient_id
         WHERE a.doctor_id = $1 AND a.clinic_id = $2
           AND a.appointment_date BETWEEN $3 AND $4
           AND a.status NOT IN ('CANCELLED_BY_PATIENT', 'CANCELLED_BY_CLINIC', 'CANCELLED_BY_SYSTEM', 'COMPLETED')
         ORDER BY a.appointment_date, a.appointment_time`,
        [doctorId, session.clinic_id, startDate, endDate]
    );

    return {
        count: result.rows.length,
        appointments: result.rows,
    };
}
