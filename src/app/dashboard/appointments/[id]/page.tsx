import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentActions } from "@/components/appointment-actions";
import { Calendar, User, Phone, Clock, Brain, AlertTriangle, FileText, ArrowLeft, Activity, Mail, Info, Stethoscope, Hash, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function AppointmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await requireSession();
    const { id } = await params;

    const result = await db.query(
        `SELECT a.*,
            p.first_name || ' ' || p.last_name as patient_name, p.phone as patient_phone, p.age, p.gender, p.patient_id, p.blood_group, p.email as patient_email,
            u.first_name || ' ' || u.last_name as doctor_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN users u ON a.doctor_id = u.user_id
        WHERE a.appointment_id = $1 AND a.clinic_id = $2`,
        [id, session.clinic_id]
    );
    if (result.rows.length === 0) notFound();
    const appt = result.rows[0];

    // Fetch AI context if checked in
    let context = null;
    if (["CHECKED_IN", "IN_CONSULTATION", "COMPLETED"].includes(appt.status)) {
        const ctxResult = await db.query(
            "SELECT * FROM visit_context WHERE appointment_id = $1",
            [id]
        );
        context = ctxResult.rows[0] || null;
    }

    // Fetch audit logs for this appointment
    const auditResult = await db.query(
        `SELECT al.*, u.first_name || ' ' || u.last_name as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.user_id
        WHERE al.record_id = $1
        ORDER BY al.timestamp DESC LIMIT 10`,
        [id]
    );
    const auditLogs = auditResult.rows;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fade-in-up">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-3">
                        <Link href="/dashboard/appointments" className="hover:text-[var(--primary)] transition-colors flex items-center gap-1.5 font-medium">
                            <ArrowLeft className="w-4 h-4" /> Appointments
                        </Link>
                        <span className="opacity-50">/</span>
                        <span className="font-mono text-xs bg-[var(--muted)] px-1.5 py-0.5 rounded">{appt.appointment_id.split('-')[0]}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-3">
                        Visit Details
                        <StatusBadge status={appt.status} className="scale-90 origin-left" />
                    </h1>
                </div>
                <div className="flex items-center gap-3 bg-[var(--bg-surface)] p-1.5 rounded-2xl border border-[var(--border)] shadow-sm">
                    <AppointmentActions appointment={appt} />
                </div>
            </div>

            {/* Top Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-[var(--primary)]/5 to-transparent border-[var(--primary)]/10 shadow-sm">
                    <CardContent className="p-5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Scheduled For</p>
                            <p className="font-bold text-[var(--foreground)]">{new Date(appt.appointment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                            <p className="text-sm font-medium text-[var(--primary)]">{String(appt.appointment_time).slice(0, 5)}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Provider</p>
                            <p className="font-bold text-[var(--foreground)]">Dr. {appt.doctor_name}</p>
                            <p className="text-sm text-[var(--muted-foreground)] capitalize">{appt.visit_type?.replace(/_/g, " ").toLowerCase()}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center flex-shrink-0">
                            <Info className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Visit Info</p>
                            <p className="font-bold text-[var(--foreground)] capitalize">{appt.source?.replace(/_/g, " ").toLowerCase()}</p>
                            <p className="text-sm text-[var(--muted-foreground)]">{appt.is_first_visit ? "First time patient" : "Returning patient"}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Timing Status</p>
                            {appt.check_in_time ? (
                                <>
                                    <p className="font-bold text-[var(--foreground)]">Checked in at {new Date(appt.check_in_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
                                    {appt.wait_time_minutes > 0 ? (
                                        <p className="text-sm text-amber-500 font-medium">Waited {Math.round(appt.wait_time_minutes)} mins</p>
                                    ) : (
                                        <p className="text-sm text-emerald-500 font-medium">On time</p>
                                    )}
                                </>
                            ) : (
                                <p className="font-medium text-[var(--muted-foreground)] italic mt-2">Not checked in yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Main Left Column */}
                <div className="xl:col-span-2 space-y-8">

                    {/* Patient Registration Data */}
                    <Card className="shadow-sm overflow-hidden border-[var(--border-subtle)]">
                        <CardHeader className="bg-[var(--muted)]/30 border-b border-[var(--border)]/50 pb-4">
                            <CardTitle className="text-base font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-[var(--primary)]" /> Patient Master Record
                                </span>
                                <Link href={`/dashboard/patients/${appt.patient_id}`}>
                                    <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-lg border-[var(--border)] hover:bg-[var(--primary)] hover:text-white transition-colors">
                                        Open Profile
                                    </Button>
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Avatar & Primary */}
                                <div className="flex items-center gap-5 md:w-1/3 md:border-r border-[var(--border)]/50 pr-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-[var(--primary)]/20 flex-shrink-0">
                                        {appt.patient_name?.split(" ").map((n: string) => n[0]).join("")}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[var(--foreground)] leading-tight mb-1">{appt.patient_name}</h3>
                                        <p className="text-sm text-[var(--muted-foreground)] font-mono flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />{appt.patient_id?.split("-")[0].toUpperCase()}</p>
                                    </div>
                                </div>

                                {/* Registration Details Grid */}
                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
                                    <div>
                                        <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Contact Number</p>
                                        <p className="font-medium text-[var(--foreground)] flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-blue-400" /> {appt.patient_phone || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Email Address</p>
                                        <p className="font-medium text-[var(--foreground)] flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-blue-400" /> {appt.patient_email || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Age</p>
                                        <p className="font-medium text-[var(--foreground)] flex items-center gap-2">
                                            {appt.age ? `${appt.age} Years` : "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Gender</p>
                                        <p className="font-medium text-[var(--foreground)] flex items-center gap-2 capitalize">
                                            {appt.gender?.toLowerCase() || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">Blood Group</p>
                                        <p className="font-bold text-red-500 flex items-center gap-2">
                                            <Activity className="w-3.5 h-3.5" /> {appt.blood_group || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reason For Visit */}
                    <Card className="shadow-sm border-amber-500/20 bg-amber-500/[0.02]">
                        <CardHeader className="pb-3 border-b border-amber-500/10 mb-3 bg-amber-500/[0.05]">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                                <FileText className="w-4 h-4" /> Chief Complaint / Reason
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-[var(--bg-canvas)] rounded-xl p-5 border border-[var(--border)] relative shadow-inner">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400 rounded-l-xl" />
                                <p className="text-[var(--foreground)] text-[15px] leading-relaxed pl-2 font-medium italic">
                                    "{appt.reason_for_visit || "No reason provided at time of booking."}"
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Context Widget */}
                    {context && (
                        <Card className="border-indigo-500/20 shadow-lg relative overflow-hidden bg-gradient-to-br from-[var(--bg-surface)] to-indigo-500/[0.02]">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none transform translate-x-12 -translate-y-12">
                                <Brain size={250} />
                            </div>
                            <CardHeader className="border-b border-indigo-500/10 pb-4 relative z-10 bg-indigo-500/5">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                        <Sparkles className="w-4 h-4" /> Clinical Intelligence
                                    </CardTitle>
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wider ${context.generation_status === "COMPLETED" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20" :
                                            context.generation_status === "IN_PROGRESS" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20" :
                                                "bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20"
                                        }`}>
                                        {context.generation_status === "COMPLETED" ? "ANALYSIS READY" : context.generation_status === "IN_PROGRESS" ? "ANALYZING..." : "ANALYSIS FAILED"}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 relative z-10 space-y-6">
                                {context.summary && (
                                    <div>
                                        <p className="text-[11px] font-bold text-indigo-600/70 dark:text-indigo-400/80 uppercase tracking-wider mb-2">AI Synthesized Summary</p>
                                        <p className="text-[15px] text-[var(--foreground)] leading-relaxed bg-[var(--bg-canvas)] p-4 rounded-xl border border-[var(--border-subtle)]">
                                            {context.summary}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {context.visit_prediction && (
                                        <div className="bg-[var(--bg-canvas)] p-4 rounded-xl border border-[var(--border-subtle)]">
                                            <p className="text-[11px] font-bold text-indigo-600/70 dark:text-indigo-400/80 uppercase tracking-wider mb-1.5">Predicted Intent</p>
                                            <p className="font-bold text-lg">{context.visit_prediction}</p>
                                        </div>
                                    )}
                                    {context.context_confidence && (
                                        <div className="bg-[var(--bg-canvas)] p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col justify-center gap-3">
                                            <div className="flex justify-between items-center text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                                                <span>Confidence Score</span>
                                                <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{Math.round(context.context_confidence * 100)}%</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-[var(--border)] rounded-full overflow-hidden shadow-inner flex">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"
                                                    style={{ width: `${Math.round(context.context_confidence * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {context.risk_flags && (() => {
                                    const flags = typeof context.risk_flags === "string" ? JSON.parse(context.risk_flags) : context.risk_flags;
                                    return flags.length > 0 && (
                                        <div className="pt-2">
                                            <p className="text-[11px] font-bold text-amber-600/80 dark:text-amber-500/80 uppercase tracking-wider mb-3">Detected Risks & Flags</p>
                                            <div className="space-y-3">
                                                {flags.map((flag: any, i: number) => (
                                                    <div key={i} className="flex gap-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 p-4 rounded-xl border border-amber-500/20 items-start">
                                                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                        <div>
                                                            <strong className="block mb-1 font-bold">{flag.flag}</strong>
                                                            <span className="text-sm font-medium opacity-90 leading-snug">{flag.suggestion}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column (Sidebar) */}
                <div className="space-y-8">
                    {/* Audit Timeline */}
                    <Card className="shadow-sm border-[var(--border-subtle)] sticky top-6">
                        <CardHeader className="bg-[var(--muted)]/30 border-b border-[var(--border)]/50 pb-4">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[var(--muted-foreground)]" /> Activity Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {auditLogs.length > 0 ? (
                                <div className="space-y-6">
                                    {auditLogs.map((log: any, i: number) => (
                                        <div key={i} className="flex gap-4 relative">
                                            {i !== auditLogs.length - 1 && (
                                                <div className="absolute left-[7px] top-[24px] bottom-[-24px] w-px bg-[var(--border)]" />
                                            )}
                                            <div className="w-4 h-4 rounded-full border-2 border-[var(--border)] bg-[var(--bg-canvas)] mt-1 flex-shrink-0 z-10" />
                                            <div className="flex-1 pb-1">
                                                <p className="text-sm font-bold text-[var(--foreground)] capitalize leading-none mb-1.5">
                                                    {log.action_type?.toLowerCase().replace(/_/g, " ")}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                                                    <span className="font-semibold">{log.user_name || "System"}</span>
                                                    <span>&bull;</span>
                                                    <span>
                                                        {new Date(log.timestamp).toLocaleString("en-US", {
                                                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--muted-foreground)] text-center py-4 italic">No activity recorded yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
