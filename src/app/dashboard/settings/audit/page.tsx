import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, ArrowLeft, Search, User, Clock } from "lucide-react";

export default async function AuditLogsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    const session = await requireSession();
    const params = await searchParams;
    const searchQuery = params.q || "";
    const page = parseInt(params.page || "1");
    const pageSize = 30;
    const offset = (page - 1) * pageSize;

    let logs: Record<string, string>[] = [];
    let total = 0;

    try {
        let query = `
            SELECT al.*, u.first_name || ' ' || u.last_name as user_name, u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON al.performed_by = u.user_id
            WHERE al.clinic_id = $1
        `;
        const queryParams: (string | number)[] = [session.clinic_id];
        let paramIndex = 2;

        if (searchQuery) {
            query += ` AND (al.action_type ILIKE $${paramIndex} OR al.table_name ILIKE $${paramIndex})`;
            queryParams.push(`%${searchQuery}%`);
            paramIndex++;
        }

        query += ` ORDER BY al.performed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(pageSize, offset);

        const result = await db.query(query, queryParams);
        logs = result.rows;

        const countResult = await db.query(
            `SELECT COUNT(*) as total FROM audit_logs WHERE clinic_id = $1`,
            [session.clinic_id]
        );
        total = parseInt(countResult.rows[0].total);
    } catch {
        // audit_logs table may not exist yet
    }
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const actionColors: Record<string, string> = {
        CREATE: "bg-emerald-500/10 text-emerald-400",
        UPDATE: "bg-blue-500/10 text-blue-400",
        DELETE: "bg-red-500/10 text-red-400",
        STATUS_CHANGE: "bg-amber-500/10 text-amber-400",
        CHECK_IN: "bg-violet-500/10 text-violet-400",
        CONSULTATION_START: "bg-violet-500/10 text-violet-400",
        CONSULTATION_COMPLETE: "bg-emerald-500/10 text-emerald-400",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 animate-fade-in-up">
                <Link href="/dashboard/settings">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <PageHeader
                    title="Audit Logs"
                    description={`${total} total log entries`}
                    icon={<FileText className="w-5 h-5 text-[var(--primary)]" />}
                />
            </div>

            <form className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                    <Input name="q" defaultValue={searchQuery} placeholder="Search by action or table..." className="pl-9" />
                </div>
            </form>

            <Card className="overflow-hidden animate-fade-in-up" style={{ animationDelay: "160ms" }}>
                {logs.length === 0 ? (
                    <EmptyState
                        icon={<FileText className="w-8 h-8" />}
                        title="No audit logs"
                        description="System activity will appear here."
                    />
                ) : (
                    <div className="overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-[var(--muted)]/50 text-[var(--muted-foreground)] sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-5 py-3.5 font-medium">Timestamp</th>
                                    <th className="px-5 py-3.5 font-medium">Action</th>
                                    <th className="px-5 py-3.5 font-medium">Table</th>
                                    <th className="px-5 py-3.5 font-medium">User</th>
                                    <th className="px-5 py-3.5 font-medium">Record ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log: Record<string, string>, i: number) => (
                                    <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                                                <Clock className="w-3 h-3" />
                                                <span className="tabular-nums text-xs">
                                                    {new Date(log.performed_at).toLocaleString("en-IN", {
                                                        day: "2-digit", month: "short",
                                                        hour: "2-digit", minute: "2-digit", second: "2-digit"
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${actionColors[log.action_type] || "bg-slate-500/10 text-slate-400"
                                                }`}>
                                                {log.action_type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-mono bg-[var(--muted)]/50 px-2 py-0.5 rounded">
                                                {log.table_name}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3 text-[var(--muted-foreground)]" />
                                                <span className="text-sm">{log.user_name || "System"}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs font-mono text-[var(--muted-foreground)]">
                                                {log.record_id?.slice(0, 8)}...
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                        <span>Page {page} of {totalPages}</span>
                        <div className="flex gap-1">
                            {page > 1 && (
                                <Link href={`/dashboard/settings/audit?q=${searchQuery}&page=${page - 1}`} className="px-3 py-1.5 rounded-lg hover:bg-white/[0.04]">← Prev</Link>
                            )}
                            {page < totalPages && (
                                <Link href={`/dashboard/settings/audit?q=${searchQuery}&page=${page + 1}`} className="px-3 py-1.5 rounded-lg hover:bg-white/[0.04]">Next →</Link>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
