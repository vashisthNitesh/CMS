import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users, Calendar, CheckCircle, TrendingUp,
    AlertTriangle, Clock, Activity, Stethoscope,
    BarChart3, ArrowUpRight, ArrowDownRight
} from "lucide-react";

export default async function AdminDashboard() {
    const session = await requireSession();
    if (session.role !== "clinic_owner" && session.role !== "super_admin") {
        redirect("/dashboard");
    }

    const today = new Date().toISOString().split("T")[0];
    const todayFormatted = new Date().toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    let s: Record<string, string>, doctors: number, patients: number, recentAppointments: Record<string, string>[];

    try {
        const stats = await db.query(
            `SELECT
                COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
                COUNT(*) FILTER (WHERE status = 'SCHEDULED') as scheduled,
                COUNT(*) FILTER (WHERE status = 'CHECKED_IN') as checked_in,
                COUNT(*) FILTER (WHERE status = 'IN_CONSULTATION') as in_consultation,
                COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_show,
                COUNT(*) FILTER (WHERE status LIKE 'CANCELLED%') as cancelled,
                COUNT(*) as total
            FROM appointments WHERE clinic_id = $1 AND appointment_date = $2`,
            [session.clinic_id, today]
        );
        s = stats.rows[0];

        const doctorsResult = await db.query(
            `SELECT COUNT(*) as cnt FROM users u JOIN roles r ON u.role_id = r.role_id
            WHERE u.clinic_id = $1 AND r.role_name = 'doctor' AND u.status = 'active'`,
            [session.clinic_id]
        );
        doctors = parseInt(doctorsResult.rows[0].cnt);

        const patientsResult = await db.query(
            "SELECT COUNT(*) as cnt FROM patients WHERE clinic_id = $1 AND status = 'ACTIVE'",
            [session.clinic_id]
        );
        patients = parseInt(patientsResult.rows[0].cnt);

        const recentResult = await db.query(
            `SELECT a.status, p.first_name || ' ' || p.last_name as patient_name,
                a.appointment_time, a.visit_type,
                u.first_name || ' ' || u.last_name as doctor_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN users u ON a.doctor_id = u.user_id
            WHERE a.clinic_id = $1 AND a.appointment_date = $2
            ORDER BY a.booked_at DESC LIMIT 8`,
            [session.clinic_id, today]
        );
        recentAppointments = recentResult.rows;
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        return (
            <div className="p-8">
                <h1 className="heading-3 text-[var(--destructive)] mb-4">Dashboard Error</h1>
                <pre className="p-4 rounded-xl bg-[var(--destructive)]/5 border border-[var(--destructive)]/20 text-sm overflow-auto">
                    {errorMessage}
                </pre>
            </div>
        );
    }

    const completionRate = parseInt(s.total) > 0
        ? Math.round((parseInt(s.completed) / parseInt(s.total)) * 100)
        : 0;

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse-ring" />
                    <span className="text-xs font-medium text-[var(--success)] uppercase tracking-wider">
                        Live Overview
                    </span>
                </div>
                <h1 className="heading-2 tracking-tight">Clinic Dashboard</h1>
                <p className="text-[var(--muted-foreground)] mt-1 text-sm">{todayFormatted}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                <KPICard
                    icon={<Calendar className="w-5 h-5" />}
                    label="Total Today"
                    value={parseInt(s.total)}
                    trend={null}
                    color="primary"
                />
                <KPICard
                    icon={<CheckCircle className="w-5 h-5" />}
                    label="Completed"
                    value={parseInt(s.completed)}
                    trend={{ value: completionRate, label: "completion rate", positive: completionRate >= 50 }}
                    color="success"
                />
                <KPICard
                    icon={<Stethoscope className="w-5 h-5" />}
                    label="Doctors"
                    value={doctors}
                    trend={null}
                    color="accent"
                />
                <KPICard
                    icon={<Users className="w-5 h-5" />}
                    label="Patients"
                    value={patients}
                    trend={null}
                    color="info"
                />
            </div>

            {/* Live Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children" style={{ animationDelay: "200ms" }}>
                <LiveStatusCard label="Waiting" value={parseInt(s.checked_in)} desc="checked in" dotColor="bg-[var(--info)]" />
                <LiveStatusCard label="In Consultation" value={parseInt(s.in_consultation)} desc="being seen" dotColor="bg-[var(--accent)]" />
                <LiveStatusCard label="Upcoming" value={parseInt(s.scheduled)} desc="scheduled" dotColor="bg-[var(--muted-foreground)]" />
            </div>

            {/* Alerts + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Alerts */}
                <div className="animate-fade-in-up lg:col-span-1" style={{ animationDelay: "400ms" }}>
                    <Card className="p-5 h-full flex flex-col bg-[var(--card)] border-[var(--border)]">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
                            <span className="text-sm font-semibold">Alerts</span>
                        </div>
                        <div className="flex-1 overflow-auto space-y-2">
                            {parseInt(s.no_show) === 0 && parseInt(s.cancelled) === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)]">
                                    <CheckCircle className="w-8 h-8 opacity-20 mb-2" />
                                    <p className="text-sm">All clear — no issues today</p>
                                </div>
                            ) : (
                                <>
                                    {parseInt(s.no_show) > 0 && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--warning)]/5 border border-[var(--warning)]/10">
                                            <AlertTriangle className="w-4 h-4 text-[var(--warning)] flex-shrink-0" />
                                            <span className="text-sm">{s.no_show} no-show(s) today</span>
                                        </div>
                                    )}
                                    {parseInt(s.cancelled) > 0 && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--destructive)]/5 border border-[var(--destructive)]/10">
                                            <AlertTriangle className="w-4 h-4 text-[var(--destructive)] flex-shrink-0" />
                                            <span className="text-sm">{s.cancelled} cancellation(s)</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="animate-fade-in-up lg:col-span-2" style={{ animationDelay: "500ms" }}>
                    <Card className="p-5 h-full flex flex-col bg-[var(--card)] border-[var(--border)]">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-4 h-4 text-[var(--primary)]" />
                            <span className="text-sm font-semibold">Recent Activity</span>
                        </div>
                        <div className="flex-1 overflow-auto">
                            {recentAppointments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)]">
                                    <BarChart3 className="w-8 h-8 opacity-20 mb-2" />
                                    <p className="text-sm">No activity yet today</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {recentAppointments.map((a, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]/20 hover:bg-[var(--muted)]/40 transition-colors border border-[var(--border)]"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{a.patient_name}</p>
                                                <p className="text-xs text-[var(--muted-foreground)] truncate">
                                                    Dr. {a.doctor_name} · {String(a.appointment_time).slice(0, 5)}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    a.status === "COMPLETED" ? "success"
                                                        : a.status === "IN_CONSULTATION" ? "info"
                                                            : "secondary"
                                                }
                                                className="ml-2 flex-shrink-0"
                                            >
                                                {a.status.replace(/_/g, " ")}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

/* ======= KPI CARD ======= */
function KPICard({
    icon, label, value, trend, color,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    trend: { value: number; label: string; positive: boolean } | null;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        primary: "bg-[var(--primary)]/10 text-[var(--primary)]",
        success: "bg-[var(--success)]/10 text-[var(--success)]",
        accent: "bg-[var(--accent)]/10 text-[var(--accent)]",
        info: "bg-[var(--info)]/10 text-[var(--info)]",
        warning: "bg-[var(--warning)]/10 text-[var(--warning)]",
    };

    return (
        <Card className="p-4 hover-lift animate-fade-in-up bg-[var(--card)] border-[var(--border)]">
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-0.5 text-xs font-medium ${trend.positive ? "text-[var(--success)]" : "text-[var(--destructive)]"}`}>
                        {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trend.value}%
                    </div>
                )}
            </div>
            <div className="mt-3">
                <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
                <p className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider font-medium mt-0.5">{label}</p>
            </div>
        </Card>
    );
}

/* ======= LIVE STATUS CARD ======= */
function LiveStatusCard({
    label, value, desc, dotColor,
}: {
    label: string; value: number; desc: string; dotColor: string;
}) {
    return (
        <Card className="p-5 hover-lift animate-fade-in-up bg-[var(--card)] border-[var(--border)]">
            <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
                <span className="text-sm font-medium">{label}</span>
            </div>
            <p className="text-3xl font-bold tabular-nums tracking-tight">{value}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">{desc}</p>
        </Card>
    );
}
