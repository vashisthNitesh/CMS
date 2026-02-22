"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireSession, requirePermission } from "@/lib/session";

export async function bookAppointment(data: {
    patient_id: string;
    doctor_id: string;
    slot_id: string;
    visit_type: string;
    reason_for_visit?: string;
    source?: string;
}) {
    const session = await requireSession();
    requirePermission(session, "appointments:create");

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        // Verify and lock slot
        const slotResult = await client.query(
            "SELECT * FROM appointment_slots WHERE slot_id = $1 AND clinic_id = $2 FOR UPDATE",
            [data.slot_id, session.clinic_id]
        );
        if (slotResult.rows.length === 0) throw new Error("Slot not found");
        if (slotResult.rows[0].status !== "AVAILABLE") throw new Error("Slot not available");

        const slot = slotResult.rows[0];

        // Check first visit
        const visitCount = await client.query(
            "SELECT COUNT(*) as cnt FROM appointments WHERE patient_id = $1 AND clinic_id = $2 AND status = 'COMPLETED'",
            [data.patient_id, session.clinic_id]
        );
        const isFirstVisit = parseInt(visitCount.rows[0].cnt) === 0;

        // Create appointment
        const result = await client.query(
            `INSERT INTO appointments (
        clinic_id, patient_id, doctor_id, slot_id,
        appointment_date, appointment_time, estimated_end_time,
        visit_type, reason_for_visit, source, is_first_visit,
        status, booked_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'SCHEDULED',$12)
      RETURNING *`,
            [
                session.clinic_id, data.patient_id, data.doctor_id, data.slot_id,
                slot.slot_date, slot.slot_start_time, slot.slot_end_time,
                data.visit_type, data.reason_for_visit, data.source || "WALK_IN",
                isFirstVisit, session.user_id,
            ]
        );

        await client.query("UPDATE appointment_slots SET status = 'BOOKED' WHERE slot_id = $1", [data.slot_id]);
        await client.query("COMMIT");

        revalidatePath("/dashboard");
        return { success: true, appointment: result.rows[0] };
    } catch (error) {
        await client.query("ROLLBACK");
        return { error: (error as Error).message };
    } finally {
        client.release();
    }
}

export async function checkInPatient(appointmentId: string) {
    const session = await requireSession();
    requirePermission(session, "appointments:update");

    const result = await db.query(
        `UPDATE appointments SET status = 'CHECKED_IN', check_in_time = NOW()
     WHERE appointment_id = $1 AND clinic_id = $2 AND status = 'SCHEDULED'
     RETURNING *`,
        [appointmentId, session.clinic_id]
    );

    if (result.rows.length === 0) return { error: "Cannot check in" };

    // Trigger visit context generation
    generateVisitContext(appointmentId, result.rows[0].patient_id).catch(console.error);

    revalidatePath("/dashboard");
    return { success: true, appointment: result.rows[0] };
}

export async function startConsultation(appointmentId: string) {
    const session = await requireSession();
    requirePermission(session, "visits:create");

    const result = await db.query(
        `UPDATE appointments
     SET status = 'IN_CONSULTATION', consultation_start = NOW(), actual_start_time = NOW()::TIME,
         wait_time_minutes = EXTRACT(EPOCH FROM (NOW() - check_in_time)) / 60
     WHERE appointment_id = $1 AND clinic_id = $2 AND status = 'CHECKED_IN'
     RETURNING *`,
        [appointmentId, session.clinic_id]
    );

    if (result.rows.length === 0) return { error: "Patient not checked in" };
    revalidatePath("/dashboard");
    return { success: true, appointment: result.rows[0] };
}

export async function completeAppointment(appointmentId: string) {
    const session = await requireSession();
    requirePermission(session, "visits:update");

    const result = await db.query(
        `UPDATE appointments
     SET status = 'COMPLETED', consultation_end = NOW(), actual_end_time = NOW()::TIME
     WHERE appointment_id = $1 AND clinic_id = $2 AND status = 'IN_CONSULTATION'
     RETURNING *`,
        [appointmentId, session.clinic_id]
    );

    if (result.rows.length === 0) return { error: "Not in consultation" };
    await db.query("UPDATE appointment_slots SET status = 'COMPLETED' WHERE slot_id = $1", [result.rows[0].slot_id]);

    revalidatePath("/dashboard");
    return { success: true, appointment: result.rows[0] };
}

export async function cancelAppointment(appointmentId: string, reason?: string) {
    const session = await requireSession();
    requirePermission(session, "appointments:delete", "appointments:cancel");

    const result = await db.query(
        `UPDATE appointments
     SET status = 'CANCELLED_BY_CLINIC', cancelled_at = NOW(), cancelled_by = $3,
         cancellation_reason = $4, cancellation_type = 'CANCELLED_BY_CLINIC'
     WHERE appointment_id = $1 AND clinic_id = $2
       AND status NOT IN ('COMPLETED','CANCELLED_BY_PATIENT','CANCELLED_BY_CLINIC','CANCELLED_BY_SYSTEM')
     RETURNING *`,
        [appointmentId, session.clinic_id, session.user_id, reason]
    );

    if (result.rows.length === 0) return { error: "Cannot cancel" };
    await db.query("UPDATE appointment_slots SET status = 'AVAILABLE' WHERE slot_id = $1", [result.rows[0].slot_id]);

    revalidatePath("/dashboard");
    return { success: true };
}

export async function markNoShow(appointmentId: string) {
    const session = await requireSession();
    const result = await db.query(
        `UPDATE appointments SET status = 'NO_SHOW'
     WHERE appointment_id = $1 AND clinic_id = $2 AND status IN ('SCHEDULED','CHECKED_IN')
     RETURNING *`,
        [appointmentId, session.clinic_id]
    );
    if (result.rows.length === 0) return { error: "Cannot mark as no-show" };
    await db.query("UPDATE appointment_slots SET status = 'NO_SHOW' WHERE slot_id = $1", [result.rows[0].slot_id]);
    revalidatePath("/dashboard");
    return { success: true };
}

async function generateVisitContext(appointmentId: string, patientId: string) {
    try {
        await db.query(
            `INSERT INTO visit_context (appointment_id, patient_id, generation_status, generation_started_at)
       VALUES ($1, $2, 'IN_PROGRESS', NOW())
       ON CONFLICT (appointment_id) DO UPDATE SET generation_status = 'IN_PROGRESS', generation_started_at = NOW()`,
            [appointmentId, patientId]
        );

        const patient = await db.query("SELECT * FROM patients WHERE patient_id = $1", [patientId]);
        if (patient.rows.length === 0) throw new Error("Patient not found");
        const p = patient.rows[0];

        const pastVisits = await db.query(
            `SELECT a.*, u.first_name || ' ' || u.last_name as doctor_name
       FROM appointments a JOIN users u ON a.doctor_id = u.user_id
       WHERE a.patient_id = $1 AND a.status = 'COMPLETED'
       ORDER BY a.appointment_date DESC LIMIT 5`,
            [patientId]
        );

        const count = pastVisits.rows.length;
        const isNew = count === 0;
        let summary: string, prediction: string, confidence: number;
        const riskFlags: { flag: string; suggestion: string; confidence: number }[] = [];

        if (isNew) {
            summary = `New patient: ${p.first_name} ${p.last_name}, ${p.age || "age unknown"}, ${p.gender || "gender unknown"}. First visit — collect history, medications, allergies.`;
            prediction = "Initial assessment";
            confidence = 0.4;
        } else {
            const last = pastVisits.rows[0];
            summary = `Returning patient (${count} visits). Last visit: ${last.appointment_date} with ${last.doctor_name}.${last.reason_for_visit ? ` Reason: ${last.reason_for_visit}.` : ""}`;
            prediction = last.visit_type === "FOLLOW_UP" ? `Follow-up on: ${last.reason_for_visit || "previous visit"}` : "Returning patient visit";
            confidence = Math.min(0.6 + count * 0.05, 0.95);
        }

        await db.query(
            `UPDATE visit_context
       SET summary=$3, visit_prediction=$4, risk_flags=$5, context_confidence=$6,
           ai_model_version='stub-v1.0', generation_status='COMPLETED', generated_at=NOW()
       WHERE appointment_id=$1 AND patient_id=$2`,
            [appointmentId, patientId, summary, prediction, JSON.stringify(riskFlags), confidence]
        );
    } catch (error) {
        await db.query(
            "UPDATE visit_context SET generation_status='FAILED', generation_error=$3 WHERE appointment_id=$1 AND patient_id=$2",
            [appointmentId, patientId, (error as Error).message]
        );
    }
}
