import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { UserCog, Phone, Mail, Calendar } from "lucide-react";
import Link from "next/link";

export default async function DoctorsPage() {
    await requireSession();
    const session = await requireSession();

    const result = await db.query(
        `SELECT u.*, r.role_name FROM users u
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.clinic_id = $1 AND r.role_name = 'doctor'
         ORDER BY u.first_name`,
        [session.clinic_id]
    );
    const doctors = result.rows;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Doctors"
                description={`${doctors.length} doctor${doctors.length !== 1 ? "s" : ""} in your clinic.`}
                icon={<UserCog className="w-5 h-5 text-[var(--primary)]" />}
            />

            <Card className="overflow-hidden">
                {doctors.length === 0 ? (
                    <EmptyState
                        icon={<UserCog className="w-8 h-8" />}
                        title="No doctors found"
                        description="Add doctors from User Management in Settings."
                    />
                ) : (
                    <div className="overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-[var(--muted)]/50 text-[var(--muted-foreground)]">
                                <tr>
                                    <th className="px-5 py-3.5 font-medium">Doctor</th>
                                    <th className="px-5 py-3.5 font-medium">Contact</th>
                                    <th className="px-5 py-3.5 font-medium">Status</th>
                                    <th className="px-5 py-3.5 font-medium">Joined</th>
                                    <th className="px-5 py-3.5 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctors.map((d: Record<string, string>) => (
                                    <tr key={d.user_id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                                                    {d.first_name?.[0]}{d.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium">Dr. {d.first_name} {d.last_name}</p>
                                                    {d.specialization && <p className="text-xs text-[var(--muted-foreground)]">{d.specialization}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                                            <div className="space-y-0.5">
                                                {d.phone && <p className="flex items-center gap-1.5 text-xs"><Phone className="w-3 h-3" />{d.phone}</p>}
                                                {d.email && <p className="flex items-center gap-1.5 text-xs"><Mail className="w-3 h-3" />{d.email}</p>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StatusBadge status={d.status || "active"} />
                                        </td>
                                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                                            {new Date(d.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <Link href={`/dashboard/doctors/${d.user_id}/schedule`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors">
                                                <Calendar className="w-3 h-3" />
                                                Schedule
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
