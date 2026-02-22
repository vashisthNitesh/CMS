import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StaggerGrid, StaggerItem } from "@/components/ui/stagger-grid";
import { format } from "date-fns";
import { Stethoscope, FileText, User } from "lucide-react";

export default async function EMRDashboardPage() {
    const session = await requireSession();

    // Fetch today's appointments for the doctor or clinic
    const today = new Date().toISOString().split('T')[0];

    let query = `
        SELECT a.appointment_id, a.appointment_time, a.status, a.visit_type,
               p.first_name, p.last_name, p.patient_id, p.age, p.gender
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        WHERE a.clinic_id = $1 AND a.appointment_date = $2
    `;
    const params: any[] = [session.clinic_id, today];

    if (session.role === "doctor") {
        query += ` AND a.doctor_id = $3`;
        params.push(session.user_id);
    }

    query += ` ORDER BY a.appointment_time ASC`;

    const result = await db.query(query, params);
    const appointments = result.rows;

    const inProgress = appointments.filter(a => a.status === 'IN_CONSULTATION');
    const waiting = appointments.filter(a => a.status === 'CHECKED_IN');
    const scheduled = appointments.filter(a => a.status === 'SCHEDULED');

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] relative align-middle flex items-center gap-3">
                    <Stethoscope className="w-8 h-8 text-[var(--primary)]" />
                    EMR Dashboard
                </h1>
                <p className="text-[var(--text-secondary)] mt-2">Manage your clinical workflow and active consultations.</p>
            </div>

            {inProgress.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Consultations
                    </h2>
                    <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.05}>
                        {inProgress.map(apt => (
                            <StaggerItem key={apt.appointment_id}>
                                <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex justify-between items-start">
                                            <span>{apt.first_name} {apt.last_name}</span>
                                            <span className="text-xs text-emerald-600 font-medium px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900">In Progress</span>
                                        </CardTitle>
                                        <CardDescription>
                                            Patient ID: {apt.patient_id.split('-')[0].toUpperCase()} • {apt.age} yrs • {apt.gender}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-[var(--text-secondary)] mb-4">
                                            Started at {apt.appointment_time}
                                        </div>
                                        <Link href={`/dashboard/consultations/${apt.appointment_id}`}>
                                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                                <FileText className="w-4 h-4 mr-2" />
                                                Resume Workspace
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </StaggerItem>
                        ))}
                    </StaggerGrid>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Waiting Queue */}
                <Card>
                    <CardHeader>
                        <CardTitle>Waiting Room</CardTitle>
                        <CardDescription>{waiting.length} patients checked in and waiting.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {waiting.length === 0 ? (
                            <div className="text-center py-6 text-[var(--text-muted)] text-sm border border-dashed rounded-lg border-[var(--border)]">
                                No patients currently waiting.
                            </div>
                        ) : (
                            <StaggerGrid className="space-y-4" staggerDelay={0.05}>
                                {waiting.map(apt => (
                                    <StaggerItem key={apt.appointment_id}>
                                        <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-canvas)]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-medium">
                                                    {apt.first_name[0]}{apt.last_name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-[var(--text-primary)]">{apt.first_name} {apt.last_name}</div>
                                                    <div className="text-xs text-[var(--text-secondary)]">{apt.appointment_time} • {apt.visit_type.replace('_', ' ')}</div>
                                                </div>
                                            </div>
                                            {/* Action to actually change status to IN_CONSULTATION and go to workspace */}
                                            <Link href={`/dashboard/consultations/${apt.appointment_id}`}>
                                                <Button size="sm" variant="secondary">
                                                    Start Consult
                                                </Button>
                                            </Link>
                                        </div>
                                    </StaggerItem>
                                ))}
                            </StaggerGrid>
                        )}
                    </CardContent>
                </Card>

                {/* Scheduled Later */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Today</CardTitle>
                        <CardDescription>{scheduled.length} appointments scheduled.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {scheduled.length === 0 ? (
                            <div className="text-center py-6 text-[var(--text-muted)] text-sm border border-dashed rounded-lg border-[var(--border)]">
                                No upcoming appointments today.
                            </div>
                        ) : (
                            <StaggerGrid className="space-y-4" staggerDelay={0.05}>
                                {scheduled.map(apt => (
                                    <StaggerItem key={apt.appointment_id}>
                                        <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-canvas)] opacity-80">
                                            <div>
                                                <div className="font-medium text-[var(--text-primary)]">{apt.first_name} {apt.last_name}</div>
                                                <div className="text-xs text-[var(--text-secondary)]">{apt.appointment_time}</div>
                                            </div>
                                            <div className="text-xs font-medium px-2 py-1 rounded-full bg-[var(--bg-sidebar)] border border-[var(--border)]">
                                                Scheduled
                                            </div>
                                        </div>
                                    </StaggerItem>
                                ))}
                            </StaggerGrid>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
