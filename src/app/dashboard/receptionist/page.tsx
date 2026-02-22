import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import type { Appointment } from "@/lib/types";
import { Badge, getStatusVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AppointmentActions } from "@/components/appointment-actions";
import { Users, Clock, CheckCircle, XCircle, AlertTriangle, Calendar, Activity } from "lucide-react";

async function getDoctorQueue(clinicId: string) {
    const today = new Date().toISOString().split("T")[0];

    const inConsultation = await db.query(
        `SELECT a.*, p.first_name || ' ' || p.last_name as patient_name, p.phone as patient_phone, p.age, p.gender
     FROM appointments a JOIN patients p ON a.patient_id = p.patient_id
     WHERE a.clinic_id = $1 AND a.appointment_date = $2 AND a.status = 'IN_CONSULTATION'
     LIMIT 1`,
        [clinicId, today]
    );

    const waiting = await db.query(
        `SELECT a.*, p.first_name || ' ' || p.last_name as patient_name, p.phone as patient_phone, p.age, p.gender,
       EXTRACT(EPOCH FROM (NOW() - a.check_in_time)) / 60 as wait_minutes
     FROM appointments a JOIN patients p ON a.patient_id = p.patient_id
     WHERE a.clinic_id = $1 AND a.appointment_date = $2 AND a.status = 'CHECKED_IN'
     ORDER BY a.check_in_time ASC`,
        [clinicId, today]
    );

    const upcoming = await db.query(
        `SELECT a.*, p.first_name || ' ' || p.last_name as patient_name, p.phone as patient_phone, p.age, p.gender
     FROM appointments a JOIN patients p ON a.patient_id = p.patient_id
     WHERE a.clinic_id = $1 AND a.appointment_date = $2 AND a.status = 'SCHEDULED'
     ORDER BY a.appointment_time ASC`,
        [clinicId, today]
    );

    const summary = await db.query(
        `SELECT
       COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
       COUNT(*) FILTER (WHERE status = 'CANCELLED_BY_PATIENT' OR status = 'CANCELLED_BY_CLINIC') as cancelled,
       COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_show,
       COUNT(*) FILTER (WHERE status = 'CHECKED_IN') as waiting,
       COUNT(*) FILTER (WHERE status = 'SCHEDULED') as upcoming,
       COUNT(*) as total
     FROM appointments WHERE clinic_id = $1 AND appointment_date = $2`,
        [clinicId, today]
    );

    return {
        in_consultation: inConsultation.rows[0] || null,
        waiting: waiting.rows,
        upcoming: upcoming.rows,
        summary: {
            completed: parseInt(summary.rows[0].completed || "0"),
            cancelled: parseInt(summary.rows[0].cancelled || "0"),
            no_show: parseInt(summary.rows[0].no_show || "0"),
            total_waiting: parseInt(summary.rows[0].waiting || "0"),
            total_upcoming: parseInt(summary.rows[0].upcoming || "0"),
            total: parseInt(summary.rows[0].total || "0"),
        },
    };
}

export default async function ReceptionistDashboard() {
    const session = await requireSession();
    if (session.role !== "receptionist" && session.role !== "clinic_owner" && session.role !== "super_admin") {
        redirect("/dashboard");
    }

    const queue = await getDoctorQueue(session.clinic_id);
    const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse-ring" />
                    <span className="text-xs font-medium text-[var(--success)] uppercase tracking-wider">Live</span>
                </div>
                <h1 className="heading-2 tracking-tight">Today&apos;s Queue</h1>
                <p className="text-[var(--muted-foreground)] mt-1 text-sm">{today}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 stagger-children">
                <StatCard icon={<Users className="w-5 h-5" />} label="Waiting" value={queue.summary.total_waiting} color="blue" />
                <StatCard icon={<Clock className="w-5 h-5" />} label="Upcoming" value={queue.summary.total_upcoming} color="violet" />
                <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Completed" value={queue.summary.completed} color="emerald" />
                <StatCard icon={<XCircle className="w-5 h-5" />} label="Cancelled" value={queue.summary.cancelled} color="red" />
                <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="No Show" value={queue.summary.no_show} color="amber" />
            </div>

            {/* In Consultation */}
            {queue.in_consultation && (
                <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                    <Card className="border-[var(--accent)]/20 bg-[var(--accent)]/[0.03] glow-primary">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
                                In Consultation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PatientRow appointment={queue.in_consultation} showActions />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Waiting Queue */}
            <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="w-5 h-5 text-[var(--info)]" />
                            Waiting Queue
                            <span className="ml-auto text-sm font-normal text-[var(--muted-foreground)]">{queue.waiting.length} patient(s)</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {queue.waiting.length === 0 ? (
                            <EmptyState text="No patients waiting" icon={<Users className="w-8 h-8" />} />
                        ) : (
                            <div className="space-y-2">
                                {queue.waiting.map((appt: Appointment & { wait_minutes?: number }) => (
                                    <PatientRow key={appt.appointment_id} appointment={appt} showActions />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming */}
            <div className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Calendar className="w-5 h-5 text-[var(--muted-foreground)]" />
                            Upcoming
                            <span className="ml-auto text-sm font-normal text-[var(--muted-foreground)]">{queue.upcoming.length} appointment(s)</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {queue.upcoming.length === 0 ? (
                            <EmptyState text="No upcoming appointments" icon={<Calendar className="w-8 h-8" />} />
                        ) : (
                            <div className="space-y-2">
                                {queue.upcoming.map((appt: Appointment) => (
                                    <PatientRow key={appt.appointment_id} appointment={appt} showActions />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    const colors: Record<string, { bg: string; text: string; glow: string }> = {
        blue: { bg: "bg-blue-500/10", text: "text-blue-400", glow: "" },
        violet: { bg: "bg-violet-500/10", text: "text-violet-400", glow: "" },
        emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "" },
        red: { bg: "bg-red-500/10", text: "text-red-400", glow: "" },
        amber: { bg: "bg-amber-500/10", text: "text-amber-400", glow: "" },
    };
    const c = colors[color] || colors.blue;

    return (
        <Card className="p-4 hover-lift animate-fade-in-up">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center ${c.text}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold tabular-nums">{value}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider font-medium">{label}</p>
                </div>
            </div>
        </Card>
    );
}

function PatientRow({ appointment, showActions }: { appointment: Appointment & { wait_minutes?: number }; showActions?: boolean }) {
    const waitMin = appointment.wait_minutes ? Math.round(appointment.wait_minutes) : null;
    const initials = appointment.patient_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase();

    return (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--muted)]/20 hover:bg-[var(--muted)]/40 border border-transparent hover:border-[var(--border)] transition-all duration-200">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                    {initials}
                </div>
                <div>
                    <p className="font-medium text-sm">{appointment.patient_name}</p>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mt-0.5">
                        {appointment.age && <span>{appointment.age}y</span>}
                        {appointment.gender && <span>· {appointment.gender}</span>}
                        {appointment.appointment_time && <span>· {String(appointment.appointment_time).slice(0, 5)}</span>}
                        {waitMin !== null && waitMin > 0 && (
                            <span className={`flex items-center gap-1 ${waitMin > 30 ? "text-[var(--warning)]" : "text-[var(--info)]"}`}>
                                <Clock className="w-3 h-3" /> {waitMin}m
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(appointment.status)}>
                    {appointment.status.replace(/_/g, " ")}
                </Badge>
                {showActions && <AppointmentActions appointment={appointment} />}
            </div>
        </div>
    );
}

function EmptyState({ text, icon }: { text: string; icon: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-[var(--muted-foreground)]">
            <div className="opacity-20 mb-3">{icon}</div>
            <p className="text-sm">{text}</p>
        </div>
    );
}
