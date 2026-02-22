import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Clock } from "lucide-react";

export default async function AppointmentsPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string; status?: string }>;
}) {
    const session = await requireSession();
    const params = await searchParams;
    const selectedDate = params.date || new Date().toISOString().split("T")[0];
    const statusFilter = params.status || "";

    let query = `
        SELECT a.*, 
            p.first_name || ' ' || p.last_name as patient_name, p.phone as patient_phone, p.age, p.gender,
            u.first_name || ' ' || u.last_name as doctor_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN users u ON a.doctor_id = u.user_id
        WHERE a.clinic_id = $1 AND a.appointment_date = $2
    `;
    const queryParams: (string | undefined)[] = [session.clinic_id, selectedDate];

    if (statusFilter) {
        query += ` AND a.status = $3`;
        queryParams.push(statusFilter);
    }
    query += ` ORDER BY a.appointment_time ASC`;

    const result = await db.query(query, queryParams);
    const appointments = result.rows;

    const statsResult = await db.query(
        `SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'SCHEDULED') as scheduled,
            COUNT(*) FILTER (WHERE status = 'CHECKED_IN') as checked_in,
            COUNT(*) FILTER (WHERE status = 'IN_CONSULTATION') as in_consultation,
            COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
            COUNT(*) FILTER (WHERE status IN ('CANCELLED_BY_CLINIC','CANCELLED_BY_PATIENT')) as cancelled,
            COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_show
        FROM appointments WHERE clinic_id = $1 AND appointment_date = $2`,
        [session.clinic_id, selectedDate]
    );
    const stats = statsResult.rows[0];

    const statuses = [
        { key: "", label: "All", count: stats.total },
        { key: "SCHEDULED", label: "Scheduled", count: stats.scheduled, color: "text-blue-400" },
        { key: "CHECKED_IN", label: "Checked In", count: stats.checked_in, color: "text-amber-400" },
        { key: "IN_CONSULTATION", label: "In Consult", count: stats.in_consultation, color: "text-violet-400" },
        { key: "COMPLETED", label: "Completed", count: stats.completed, color: "text-emerald-400" },
        { key: "NO_SHOW", label: "No Show", count: stats.no_show, color: "text-slate-400" },
    ];

    const dateDisplay = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Appointments"
                description={dateDisplay}
                icon={<Calendar className="w-5 h-5 text-[var(--primary)]" />}
                actions={
                    <Link href="/dashboard/appointments/new">
                        <Button className="gap-2 shadow-lg shadow-primary/20">
                            <Plus className="w-4 h-4" /> Book Appointment
                        </Button>
                    </Link>
                }
            />

            {/* Date Picker + Status Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
                <form className="flex items-center gap-2">
                    <input
                        type="date"
                        name="date"
                        defaultValue={selectedDate}
                        className="h-9 px-3 rounded-xl border border-[var(--border)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/50"
                        suppressHydrationWarning
                    />
                    <Button type="submit" variant="outline" size="sm">Go</Button>
                </form>

                <div className="flex items-center gap-1.5 flex-wrap">
                    {statuses.map((s) => (
                        <Link
                            key={s.key}
                            href={`/dashboard/appointments?date=${selectedDate}${s.key ? `&status=${s.key}` : ""}`}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${statusFilter === s.key
                                ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20"
                                : "bg-transparent text-[var(--muted-foreground)] border-transparent hover:bg-white/[0.04] hover:border-[var(--border)]"
                                }`}
                        >
                            <span className={s.color}>{parseInt(s.count)}</span> {s.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Appointment List */}
            <Card className="overflow-hidden animate-fade-in-up" style={{ animationDelay: "160ms" }}>
                {appointments.length === 0 ? (
                    <EmptyState
                        icon={<Calendar className="w-8 h-8" />}
                        title="No appointments found"
                        description={statusFilter ? "Try a different filter." : "No appointments scheduled for this date."}
                        actionLabel="Book Appointment"
                        actionHref="/dashboard/appointments/new"
                    />
                ) : (
                    <div className="overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-[var(--muted)]/50 text-[var(--muted-foreground)] sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-5 py-3.5 font-medium">Time</th>
                                    <th className="px-5 py-3.5 font-medium">Patient</th>
                                    <th className="px-5 py-3.5 font-medium">Doctor</th>
                                    <th className="px-5 py-3.5 font-medium">Type</th>
                                    <th className="px-5 py-3.5 font-medium">Status</th>
                                    <th className="px-5 py-3.5 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((appt: Record<string, string>) => (
                                    <tr key={appt.appointment_id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                                                <span className="font-medium tabular-nums">
                                                    {String(appt.appointment_time).slice(0, 5)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                                                    {appt.patient_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{appt.patient_name}</p>
                                                    <p className="text-xs text-[var(--muted-foreground)]">
                                                        {appt.age && `${appt.age}y`} {appt.gender && `· ${appt.gender}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                                            Dr. {appt.doctor_name?.split(" ").pop()}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs bg-[var(--muted)]/50 px-2 py-1 rounded-md capitalize">
                                                {appt.visit_type?.replace(/_/g, " ").toLowerCase()}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StatusBadge status={appt.status} />
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <Link
                                                href={`/dashboard/appointments/${appt.appointment_id}`}
                                                className="text-xs text-[var(--primary)] hover:underline font-medium"
                                            >
                                                View Details →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
