import { PageHeader } from "@/components/ui/page-header";
import { Calendar } from "lucide-react";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { ScheduleTabs } from "@/components/schedule/schedule-tabs";
import { getTemplates, getActiveTemplate, getDoctors } from "@/actions/schedule-templates";
import { getTimeBlocks } from "@/actions/time-blocks";
import { getOverrides } from "@/actions/slot-overrides";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function DoctorSchedulePage({ params }: Props) {
    const { id } = await params;
    const session = await requireSession();

    // Role-based access
    const isDoctor = session.role === "doctor";

    // Doctors can only view their own schedule
    const doctorId = isDoctor ? session.user_id : id;

    // Ensure doctor exists
    const doctorResult = await db.query(
        `SELECT u.user_id, u.first_name, u.last_name, u.email
         FROM users u JOIN roles r ON u.role_id = r.role_id
         WHERE u.user_id = $1 AND u.clinic_id = $2 AND r.role_name = 'doctor'`,
        [doctorId, session.clinic_id]
    );

    if (doctorResult.rows.length === 0) {
        redirect("/dashboard/doctors");
    }

    const doctor = doctorResult.rows[0];

    // Load all data in parallel
    const [templates, activeTemplate, allDoctors, timeBlocks, overrides] = await Promise.all([
        getTemplates(doctorId),
        getActiveTemplate(doctorId),
        getDoctors(),
        getTimeBlocks(doctorId, { status: ["PENDING", "APPROVED"] }),
        getOverrides(doctorId),
    ]);

    return (
        <div>
            <PageHeader
                title="Doctor Schedule"
                description={`Manage schedule & availability for Dr. ${doctor.first_name} ${doctor.last_name}`}
                icon={<Calendar className="w-6 h-6" />}
            />
            <ScheduleTabs
                doctors={allDoctors}
                initialDoctorId={doctorId}
                initialTemplates={templates}
                initialActiveTemplate={activeTemplate}
                initialTimeBlocks={timeBlocks}
                initialOverrides={overrides}
                userRole={session.role}
                userId={session.user_id}
            />
        </div>
    );
}
