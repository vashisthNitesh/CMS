import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { ConsultationWorkspace } from "@/components/consultation/consultation-workspace";

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await requireSession();
    const { id } = await params;

    // Fetch the appointment and patient details
    const appointmentResult = await db.query(
        `SELECT a.*, p.first_name, p.last_name, p.date_of_birth, p.gender, p.blood_group, p.avatar_url
         FROM appointments a
         JOIN patients p ON a.patient_id = p.patient_id
         WHERE a.appointment_id = $1 AND a.clinic_id = $2`,
        [id, session.clinic_id]
    );

    if (appointmentResult.rows.length === 0) {
        notFound();
    }

    const appointment = appointmentResult.rows[0];

    if (session.role === "doctor" && appointment.doctor_id !== session.user_id) {
        redirect("/dashboard");
    }

    // Usually, you can't enter consultation unless it's checked_in or in_consultation
    // We'll pass the data to the client component to handle UI states

    return (
        <div className="h-full flex flex-col pt-16">
            <ConsultationWorkspace appointment={appointment} />
        </div>
    );
}
