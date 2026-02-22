import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    UserRound, Phone, Mail, Calendar, Droplets, MapPin,
    ArrowLeft, CalendarPlus, Clock, FileText, Activity
} from "lucide-react";

export default async function PatientProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await requireSession();
    const { id } = await params;

    const result = await db.query(
        `SELECT p.*, COUNT(a.appointment_id) as total_visits
        FROM patients p
        LEFT JOIN appointments a ON p.patient_id = a.patient_id
        WHERE p.patient_id = $1 AND p.clinic_id = $2
        GROUP BY p.patient_id`,
        [id, session.clinic_id]
    );
    if (result.rows.length === 0) notFound();
    const patient = result.rows[0];

    // Visits
    const visitsResult = await db.query(
        `SELECT a.*, u.first_name || ' ' || u.last_name as doctor_name
        FROM appointments a
        JOIN users u ON a.doctor_id = u.user_id
        WHERE a.patient_id = $1
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
        LIMIT 20`,
        [id]
    );
    const visits = visitsResult.rows;

    const initials = `${patient.first_name?.[0] || ""}${patient.last_name?.[0] || ""}`.toUpperCase();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 animate-fade-in-up">
                <Link href="/dashboard/patients">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <PageHeader
                    title={`${patient.first_name} ${patient.last_name}`}
                    description={`Patient ID: ${patient.patient_id.slice(0, 8)}...`}
                    icon={<UserRound className="w-5 h-5 text-[var(--primary)]" />}
                    actions={
                        <Link href="/dashboard/appointments/new">
                            <Button className="gap-2 shadow-lg shadow-primary/20" size="sm">
                                <CalendarPlus className="w-4 h-4" /> Book Appointment
                            </Button>
                        </Link>
                    }
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Profile Info */}
                <div className="space-y-5">
                    {/* Avatar + Basic Info */}
                    <Card className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-primary/20 mb-4">
                                    {initials}
                                </div>
                                <h2 className="text-lg font-bold">{patient.first_name} {patient.last_name}</h2>
                                <StatusBadge status={patient.status || "active"} className="mt-2" />
                            </div>

                            <div className="mt-6 space-y-3">
                                {patient.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="w-4 h-4 text-[var(--muted-foreground)]" />
                                        <span>{patient.phone}</span>
                                    </div>
                                )}
                                {patient.email && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="w-4 h-4 text-[var(--muted-foreground)]" />
                                        <span>{patient.email}</span>
                                    </div>
                                )}
                                {patient.address && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="w-4 h-4 text-[var(--muted-foreground)]" />
                                        <span>{patient.address}</span>
                                    </div>
                                )}
                                {patient.created_at && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
                                        <span>Registered {new Date(patient.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Medical Info */}
                    <Card className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[var(--primary)]" /> Medical Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-[var(--muted-foreground)]">Age</dt>
                                    <dd className="font-medium">{patient.age ? `${patient.age} years` : "—"}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-[var(--muted-foreground)]">Gender</dt>
                                    <dd className="font-medium">{patient.gender || "—"}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-[var(--muted-foreground)]">Blood Group</dt>
                                    <dd>
                                        {patient.blood_group ? (
                                            <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                                                <Droplets className="w-3 h-3" /> {patient.blood_group}
                                            </span>
                                        ) : "—"}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-[var(--muted-foreground)]">Total Visits</dt>
                                    <dd className="font-medium tabular-nums">{parseInt(patient.total_visits)}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Visit History */}
                <div className="lg:col-span-2">
                    <Card className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[var(--primary)]" /> Visit History
                                <span className="ml-auto text-sm font-normal text-[var(--muted-foreground)]">
                                    {visits.length} visit{visits.length !== 1 ? "s" : ""}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {visits.length === 0 ? (
                                <EmptyState
                                    icon={<FileText className="w-8 h-8" />}
                                    title="No visits yet"
                                    description="This patient hasn't had any appointments."
                                    actionLabel="Book Appointment"
                                    actionHref="/dashboard/appointments/new"
                                />
                            ) : (
                                <div className="space-y-2.5">
                                    {visits.map((visit: Record<string, string>) => (
                                        <Link
                                            key={visit.appointment_id}
                                            href={`/dashboard/appointments/${visit.appointment_id}`}
                                            className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.04] transition-all duration-200 group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--muted)]/50 flex items-center justify-center flex-shrink-0">
                                                    <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium group-hover:text-[var(--primary)] transition-colors">
                                                        {new Date(visit.appointment_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                                        {visit.appointment_time && ` at ${String(visit.appointment_time).slice(0, 5)}`}
                                                    </p>
                                                    <p className="text-xs text-[var(--muted-foreground)]">
                                                        Dr. {visit.doctor_name}
                                                        {visit.visit_type && ` · ${visit.visit_type.replace(/_/g, " ").toLowerCase()}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <StatusBadge status={visit.status} />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
