import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import type { Appointment } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AppointmentActions } from "@/components/appointment-actions";
import { Stethoscope, Users, Brain, AlertTriangle, Clock, Activity } from "lucide-react";

async function getDoctorData(doctorId: string, clinicId: string) {
    const today = new Date().toISOString().split("T")[0];

    const current = await db.query(
        `SELECT a.*, p.first_name || ' ' || p.last_name as patient_name, p.phone as patient_phone, p.age, p.gender
     FROM appointments a JOIN patients p ON a.patient_id = p.patient_id
     WHERE a.doctor_id = $1 AND a.clinic_id = $2 AND a.appointment_date = $3 AND a.status = 'IN_CONSULTATION'
     LIMIT 1`,
        [doctorId, clinicId, today]
    );

    const waiting = await db.query(
        `SELECT a.*, p.first_name || ' ' || p.last_name as patient_name, p.age, p.gender,
       EXTRACT(EPOCH FROM (NOW() - a.check_in_time)) / 60 as wait_minutes
     FROM appointments a JOIN patients p ON a.patient_id = p.patient_id
     WHERE a.doctor_id = $1 AND a.clinic_id = $2 AND a.appointment_date = $3 AND a.status = 'CHECKED_IN'
     ORDER BY a.check_in_time ASC`,
        [doctorId, clinicId, today]
    );

    const context = current.rows[0]
        ? await db.query(
            "SELECT * FROM visit_context WHERE appointment_id = $1 AND generation_status = 'COMPLETED'",
            [current.rows[0].appointment_id]
        )
        : { rows: [] };

    const stats = await db.query(
        `SELECT
       COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
       COUNT(*) FILTER (WHERE status = 'CHECKED_IN') as waiting,
       COUNT(*) FILTER (WHERE status = 'SCHEDULED') as upcoming,
       COUNT(*) as total
     FROM appointments WHERE doctor_id = $1 AND clinic_id = $2 AND appointment_date = $3`,
        [doctorId, clinicId, today]
    );

    return {
        current: current.rows[0] || null,
        waiting: waiting.rows,
        context: context.rows[0] || null,
        stats: stats.rows[0],
    };
}

export default async function DoctorDashboard() {
    const session = await requireSession();
    if (session.role !== "doctor") {
        redirect("/dashboard");
    }

    const data = await getDoctorData(session.user_id, session.clinic_id);
    const today = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse-ring" />
                    <span className="text-xs font-medium text-[var(--success)] uppercase tracking-wider">Live</span>
                </div>
                <h1 className="heading-2 tracking-tight">Dr. {session.last_name}&apos;s Queue</h1>
                <p className="text-[var(--muted-foreground)] mt-1 text-sm">
                    {today} — <span className="text-[var(--success)] font-medium">{parseInt(data.stats.completed)} seen</span>, {parseInt(data.stats.waiting)} waiting, {parseInt(data.stats.upcoming)} upcoming
                </p>
            </div>

            {/* Current Patient */}
            {data.current ? (
                <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                    <Card className="border-[var(--accent)]/20 bg-[var(--accent)]/[0.03] glow-primary overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
                                Current Patient
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center text-lg font-bold text-[var(--primary)]">
                                        {data.current.patient_name?.split(" ").map((n: string) => n[0]).join("")}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg">{data.current.patient_name}</p>
                                        <p className="text-sm text-[var(--muted-foreground)]">
                                            {data.current.age && `${data.current.age}y`} {data.current.gender && `· ${data.current.gender}`} · {data.current.visit_type.replace(/_/g, " ")}
                                        </p>
                                        {data.current.reason_for_visit && (
                                            <p className="text-sm text-[var(--muted-foreground)] mt-0.5 italic">&ldquo;{data.current.reason_for_visit}&rdquo;</p>
                                        )}
                                    </div>
                                </div>
                                <AppointmentActions appointment={data.current} />
                            </div>

                            {/* AI Context */}
                            {data.context && (
                                <div className="p-4 rounded-2xl bg-[var(--background)]/60 border border-[var(--border)] glass-subtle">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                                            <Brain className="w-4 h-4 text-[var(--primary)]" />
                                        </div>
                                        <span className="text-sm font-semibold">AI Visit Context</span>
                                        <Badge variant="info">{Math.round((data.context.context_confidence || 0) * 100)}% confidence</Badge>
                                    </div>
                                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{data.context.summary}</p>

                                    {data.context.risk_flags && (() => {
                                        const flags = typeof data.context.risk_flags === "string"
                                            ? JSON.parse(data.context.risk_flags)
                                            : data.context.risk_flags;
                                        return flags.length > 0 ? (
                                            <div className="mt-3 space-y-1.5">
                                                {flags.map((flag: { flag: string; suggestion: string }, i: number) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-amber-500/[0.05] border border-amber-500/10">
                                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                                                        <span><strong className="text-amber-400">{flag.flag}:</strong> {flag.suggestion}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                    <Card className="p-10 text-center">
                        <Stethoscope className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3 opacity-20" />
                        <p className="text-[var(--muted-foreground)] font-medium">No active consultation</p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1 opacity-60">
                            {data.waiting.length > 0 ? `${data.waiting.length} patient(s) waiting to be seen` : "Queue is empty"}
                        </p>
                    </Card>
                </div>
            )}

            {/* Waiting List */}
            <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="w-5 h-5 text-blue-400" />
                            Waiting Queue
                            <span className="ml-auto text-sm font-normal text-[var(--muted-foreground)]">{data.waiting.length} patient(s)</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.waiting.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-[var(--muted-foreground)]">
                                <Users className="w-8 h-8 opacity-20 mb-3" />
                                <p className="text-sm">No patients waiting</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.waiting.map((appt: Appointment & { wait_minutes?: number }, i: number) => {
                                    const waitMin = appt.wait_minutes ? Math.round(appt.wait_minutes) : 0;
                                    return (
                                        <div key={appt.appointment_id} className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--muted)]/20 hover:bg-[var(--muted)]/40 border border-transparent hover:border-[var(--border)] transition-all duration-200">
                                            <div className="flex items-center gap-4">
                                                <span className="text-lg font-bold text-[var(--muted-foreground)] w-7 text-center tabular-nums">{i + 1}</span>
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                                                    {appt.patient_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{appt.patient_name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mt-0.5">
                                                        {appt.age && <span>{appt.age}y</span>}
                                                        {appt.gender && <span>· {appt.gender}</span>}
                                                        <span className={`flex items-center gap-1 ${waitMin > 30 ? "text-[var(--warning)]" : "text-[var(--info)]"}`}>
                                                            <Clock className="w-3 h-3" /> {waitMin}m
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <AppointmentActions appointment={appt} />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
