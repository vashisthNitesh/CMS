import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";

/**
 * /dashboard/doctors/schedule — redirects to the first doctor's schedule page.
 * For doctors, redirects to their own schedule.
 * For admins, redirects to the first doctor in the clinic.
 */
export default async function ScheduleRedirectPage() {
    const session = await requireSession();

    if (session.role === "doctor") {
        redirect(`/dashboard/doctors/${session.user_id}/schedule`);
    }

    // Admin — find first doctor
    const result = await db.query(
        `SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id
         WHERE u.clinic_id = $1 AND r.role_name = 'doctor' AND u.status = 'active'
         ORDER BY u.first_name LIMIT 1`,
        [session.clinic_id]
    );

    if (result.rows.length > 0) {
        redirect(`/dashboard/doctors/${result.rows[0].user_id}/schedule`);
    }

    redirect("/dashboard/doctors");
}
