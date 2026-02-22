import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRound, UserPlus, Search, Phone, Calendar } from "lucide-react";

export default async function PatientsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    const session = await requireSession();
    const params = await searchParams;
    const searchQuery = params.q || "";
    const page = parseInt(params.page || "1");
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    let query = `
        SELECT p.*,
            COUNT(a.appointment_id) as total_visits,
            MAX(a.appointment_date) as last_visit
        FROM patients p
        LEFT JOIN appointments a ON p.patient_id = a.patient_id
        WHERE p.clinic_id = $1
    `;
    const queryParams: (string | number)[] = [session.clinic_id];
    let paramIndex = 2;

    if (searchQuery) {
        query += ` AND (
            p.first_name ILIKE $${paramIndex} OR 
            p.last_name ILIKE $${paramIndex} OR 
            p.phone ILIKE $${paramIndex} OR
            CONCAT(p.first_name, ' ', p.last_name) ILIKE $${paramIndex}
        )`;
        queryParams.push(`%${searchQuery}%`);
        paramIndex++;
    }

    query += ` GROUP BY p.patient_id ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pageSize, offset);

    const result = await db.query(query, queryParams);
    const patients = result.rows;

    // Count
    let countQuery = `SELECT COUNT(*) as total FROM patients WHERE clinic_id = $1`;
    const countParams: string[] = [session.clinic_id];
    if (searchQuery) {
        countQuery += ` AND (first_name ILIKE $2 OR last_name ILIKE $2 OR phone ILIKE $2 OR CONCAT(first_name, ' ', last_name) ILIKE $2)`;
        countParams.push(`%${searchQuery}%`);
    }
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="space-y-6">
            <PageHeader
                title="Patients"
                description={`${total} registered patient${total !== 1 ? "s" : ""}`}
                icon={<UserRound className="w-5 h-5 text-[var(--primary)]" />}
                actions={
                    <Link href="/dashboard/patients/new">
                        <Button className="gap-2 shadow-lg shadow-primary/20">
                            <UserPlus className="w-4 h-4" /> Register Patient
                        </Button>
                    </Link>
                }
            />

            {/* Search */}
            <form className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                    <Input
                        name="q"
                        defaultValue={searchQuery}
                        placeholder="Search by name or phone..."
                        className="pl-9"
                    />
                </div>
            </form>

            {/* Patients List */}
            <Card className="overflow-hidden animate-fade-in-up" style={{ animationDelay: "160ms" }}>
                {patients.length === 0 ? (
                    <EmptyState
                        icon={<UserRound className="w-8 h-8" />}
                        title={searchQuery ? "No patients found" : "No patients registered"}
                        description={searchQuery ? "Try a different search term." : "Register your first patient to get started."}
                        actionLabel="Register Patient"
                        actionHref="/dashboard/patients/new"
                    />
                ) : (
                    <div className="overflow-auto">
                        <table className="hidden md:table w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-[var(--muted)]/50 text-[var(--muted-foreground)] sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-5 py-3.5 font-medium">Patient</th>
                                    <th className="px-5 py-3.5 font-medium">Phone</th>
                                    <th className="px-5 py-3.5 font-medium">Age / Gender</th>
                                    <th className="px-5 py-3.5 font-medium">Blood</th>
                                    <th className="px-5 py-3.5 font-medium">Visits</th>
                                    <th className="px-5 py-3.5 font-medium">Last Visit</th>
                                    <th className="px-5 py-3.5 font-medium">Status</th>
                                    <th className="px-5 py-3.5 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map((p: Record<string, string>) => (
                                    <tr key={p.patient_id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-3.5">
                                            <Link href={`/dashboard/patients/${p.patient_id}`} className="flex items-center gap-3 group">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                                                    {p.first_name?.[0]}{p.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium group-hover:text-[var(--primary)] transition-colors">
                                                        {p.first_name} {p.last_name}
                                                    </p>
                                                    {p.email && <p className="text-xs text-[var(--muted-foreground)]">{p.email}</p>}
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                                                <Phone className="w-3 h-3" /> {p.phone || "—"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                                            {p.age ? `${p.age}y` : "—"} {p.gender ? `· ${p.gender}` : ""}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {p.blood_group ? (
                                                <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-md font-medium">
                                                    {p.blood_group}
                                                </span>
                                            ) : "—"}
                                        </td>
                                        <td className="px-5 py-3.5 tabular-nums font-medium">
                                            {parseInt(p.total_visits)}
                                        </td>
                                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                                            {p.last_visit ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(p.last_visit).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                                                </span>
                                            ) : "—"}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StatusBadge status={p.status || "active"} />
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    href={`/dashboard/patients/${p.patient_id}`}
                                                    className="text-xs text-[var(--primary)] hover:underline font-medium"
                                                >
                                                    View
                                                </Link>
                                                <span className="text-[var(--muted-foreground)]">·</span>
                                                <Link
                                                    href={`/dashboard/appointments/new?patient=${p.patient_id}`}
                                                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:underline"
                                                >
                                                    Book
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="md:hidden flex flex-col divide-y divide-[var(--border)]">
                            {patients.map((p: Record<string, string>) => (
                                <div key={`mobile-${p.patient_id}`} className="p-4 space-y-4 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-start justify-between">
                                        <Link href={`/dashboard/patients/${p.patient_id}`} className="flex items-center gap-3 group block flex-1">
                                            <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center text-sm font-bold text-[var(--primary)]">
                                                {p.first_name?.[0]}{p.last_name?.[0]}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-semibold text-base group-hover:text-[var(--primary)] transition-colors truncate">
                                                    {p.first_name} {p.last_name}
                                                </p>
                                                {p.email && <p className="text-xs text-[var(--muted-foreground)] truncate">{p.email}</p>}
                                            </div>
                                        </Link>
                                        <StatusBadge status={p.status || "active"} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                                            <Phone className="w-3.5 h-3.5" />
                                            <span className="truncate">{p.phone || "—"}</span>
                                        </div>
                                        <div className="flex justify-end gap-1 text-[var(--muted-foreground)] text-xs">
                                            {p.age ? `${p.age}y` : "—"} {p.gender ? `· ${p.gender.charAt(0).toUpperCase()}` : ""}
                                        </div>
                                        <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-xs">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="truncate">{p.last_visit ? new Date(p.last_visit).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "No visits"}</span>
                                        </div>
                                        <div className="flex justify-end items-center gap-2 pt-1 font-medium">
                                            <Link href={`/dashboard/appointments/new?patient=${p.patient_id}`}>
                                                <Button size="sm" variant="outline" className="h-7 text-xs px-3">Book</Button>
                                            </Link>
                                            <Link href={`/dashboard/patients/${p.patient_id}`}>
                                                <Button size="sm" className="h-7 text-xs px-3">View</Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                        <span>Page {page} of {totalPages} ({total} patients)</span>
                        <div className="flex gap-1">
                            {page > 1 && (
                                <Link
                                    href={`/dashboard/patients?q=${searchQuery}&page=${page - 1}`}
                                    className="px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                                >
                                    ← Prev
                                </Link>
                            )}
                            {page < totalPages && (
                                <Link
                                    href={`/dashboard/patients?q=${searchQuery}&page=${page + 1}`}
                                    className="px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                                >
                                    Next →
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
