"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireSession, requirePermission } from "@/lib/session";

export async function createPatient(data: {
    first_name: string;
    last_name: string;
    phone: string;
    age?: number;
    gender?: string;
    email?: string;
    date_of_birth?: string;
}) {
    const session = await requireSession();
    requirePermission(session, "patients:create");

    // Check duplicate by phone
    const existing = await db.query(
        "SELECT patient_id, first_name, last_name, phone FROM patients WHERE clinic_id = $1 AND phone = $2 AND status = 'ACTIVE'",
        [session.clinic_id, data.phone]
    );
    if (existing.rows.length > 0) {
        return { error: "Patient with this phone exists", existing_patient: existing.rows[0] };
    }

    const result = await db.query(
        `INSERT INTO patients (clinic_id, first_name, last_name, phone, date_of_birth, age, gender, email, profile_complete, created_via, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,'APPOINTMENT_BOOKING',$9)
     RETURNING *`,
        [session.clinic_id, data.first_name, data.last_name, data.phone, data.date_of_birth, data.age, data.gender, data.email, session.user_id]
    );

    revalidatePath("/dashboard");
    return { success: true, patient: result.rows[0] };
}

export async function searchPatients(searchTerm: string) {
    const session = await requireSession();
    requirePermission(session, "patients:read");

    if (!searchTerm || searchTerm.length < 2) return { patients: [] };

    const result = await db.query(
        `SELECT patient_id, first_name, last_name, phone, age, gender, profile_complete
     FROM patients
     WHERE clinic_id = $1 AND status = 'ACTIVE'
       AND (first_name ILIKE $2 OR last_name ILIKE $2 OR phone LIKE $3 OR (first_name || ' ' || last_name) ILIKE $2)
     ORDER BY first_name, last_name LIMIT 20`,
        [session.clinic_id, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    return { patients: result.rows };
}
