import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentActions } from "@/components/appointment-actions";
import { Users, Clock, CheckCircle, AlertTriangle, Activity, Stethoscope } from "lucide-react";
import type { Appointment } from "@/lib/types";

export default async function QueuePage() {
    const session = await requireSession();
    const today = new Date().toISOString().split("T")[0];

    // Stats
    const statsResult = await db.query(
        `SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'CHECKED_IN') as checked_in,
            COUNT(*) FILTER (WHERE status = 'IN_CONSULTATION') as in_consultation,
            COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
            COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_show
        FROM appointments WHERE clinic_id = $1 AND appointment_date = $2`,
        [session.clinic_id, today]
    );
    const stats = statsResult.rows[0];

    // In consultation
    const inConsultation = await db.query(
        `SELECT a.*, p.first_name || ' ' || p.last_name as patient_name, p.phone as patient_phone, p.age, p.gender,
            u.first_name || ' ' || u.last_name as doctor_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN users u ON a.doctor_id = u.user_id
        WHERE a.clinic_id = $1 AND a.appointment_date = $2 AND a.status = 'IN_CONSULTATION'`,
        [session.clinic_id, today]
    );

    // Waiting
    const waiting = await db.query(
        `SELECT a.*, p.first_name || ' ' || p.last_name as patient_name, p.phone as patient_phone, p.age, p.gender,
            u.first_name || ' ' || u.last_name as doctor_name,
            EXTRACT(EPOCH FROM (NOW() - a.check_in_time)) / 60 as wait_minutes
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN users u ON a.doctor_id = u.user_id
        WHERE a.clinic_id = $1 AND a.appointment_date = $2 AND a.status = 'CHECKED_IN'
        ORDER BY a.check_in_time ASC`,
        [session.clinic_id, today]
    );

    // Upcoming
    const upcoming = await db.query(
        `SELECT a.*, p.first_name || ' ' || p.last_name as patient_name, p.phone as patient_phone, p.age, p.gender,
            u.first_name || ' ' || u.last_name as doctor_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN users u ON a.doctor_id = u.user_id
        WHERE a.clinic_id = $1 AND a.appointment_date = $2 AND a.status = 'SCHEDULED'
        ORDER BY a.appointment_time ASC`,
        [session.clinic_id, today]
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Live Queue"
                description={`Today — ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`}
                icon={<Activity className="w-5 h-5 text-[var(--primary)]" />}
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 stagger-children">
                <StatsCard icon={<Users className="w-5 h-5" />} label="Total Today" value={parseInt(stats.total)} color="blue" />
                <StatsCard icon={<Clock className="w-5 h-5" />} label="Checked In" value={parseInt(stats.checked_in)} color="amber" />
                <StatsCard icon={<Stethoscope className="w-5 h-5" />} label="In Consult" value={parseInt(stats.in_consultation)} color="violet" />
                <StatsCard icon={<CheckCircle className="w-5 h-5" />} label="Completed" value={parseInt(stats.completed)} color="emerald" />
                <StatsCard icon={<AlertTriangle className="w-5 h-5" />} label="No Shows" value={parseInt(stats.no_show)} color="slate" />
            </div>

            {/* In Consultation */}
            {inConsultation.rows.length > 0 && (
                <Card className="border-violet-500/20 bg-violet-500/[0.03] animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
                            In Consultation ({inConsultation.rows.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {inConsultation.rows.map((appt: Appointment & { doctor_name?: string }) => (
                            <QueueRow key={appt.appointment_id} appointment={appt} />
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Waiting Queue */}
            <Card className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-400" />
                        Waiting Queue
                        <span className="ml-auto text-sm font-normal text-[var(--muted-foreground)]">{waiting.rows.length} patient(s)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {waiting.rows.length === 0 ? (
                        <EmptyState
                            icon={<Users className="w-8 h-8" />}
                            title="No patients waiting"
                            description="Patients will appear here after checking in."
                        />
                    ) : (
                        <div className="space-y-2">
                            {waiting.rows.map((appt: Appointment & { wait_minutes?: number; doctor_name?: string }, i: number) => (
                                <QueueRow key={appt.appointment_id} appointment={appt} index={i + 1} showWait />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upcoming */}
            <Card className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-5 h-5 text-[var(--muted-foreground)]" />
                        Scheduled
                        <span className="ml-auto text-sm font-normal text-[var(--muted-foreground)]">{upcoming.rows.length} upcoming</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {upcoming.rows.length === 0 ? (
                        <EmptyState
                            icon={<Users className="w-8 h-8" />}
                            title="No upcoming appointments"
                        />
                    ) : (
                        <div className="space-y-2">
                            {upcoming.rows.map((appt: Appointment & { doctor_name?: string }) => (
                                <QueueRow key={appt.appointment_id} appointment={appt} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function QueueRow({
    appointment,
    index,
    showWait,
}: {
    appointment: Appointment & { wait_minutes?: number; doctor_name?: string };
    index?: number;
    showWait?: boolean;
}) {
    const waitMin = appointment.wait_minutes ? Math.round(appointment.wait_minutes) : 0;
    const initials = appointment.patient_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase();

    return (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.04] transition-all duration-200">
            <div className="flex items-center gap-4">
                {index !== undefined && (
                    <span className="text-lg font-bold text-[var(--muted-foreground)] w-7 text-center tabular-nums">{index}</span>
                )}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                    {initials}
                </div>
                <div>
                    <p className="font-medium text-sm">{appointment.patient_name}</p>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mt-0.5">
                        {appointment.age && <span>{appointment.age}y</span>}
                        {appointment.gender && <span>· {appointment.gender}</span>}
                        {appointment.appointment_time && <span>· {String(appointment.appointment_time).slice(0, 5)}</span>}
                        {appointment.doctor_name && <span>· Dr. {appointment.doctor_name.split(" ").pop()}</span>}
                        {showWait && waitMin > 0 && (
                            <span className={`flex items-center gap-1 ${waitMin > 30 ? "text-amber-400" : "text-blue-400"}`}>
                                <Clock className="w-3 h-3" /> {waitMin}m
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <StatusBadge status={appointment.status} />
                <AppointmentActions appointment={appointment} />
            </div>
        </div>
    );
}
