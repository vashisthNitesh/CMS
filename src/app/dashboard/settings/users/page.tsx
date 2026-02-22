import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, ArrowLeft, Shield } from "lucide-react";

export default async function UsersSettingsPage() {
    const session = await requireSession();

    const result = await db.query(
        `SELECT u.*, r.role_name, u.created_at
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.clinic_id = $1
        ORDER BY u.created_at DESC`,
        [session.clinic_id]
    );
    const users = result.rows;

    const roleBadge = (role: string) => {
        const colors: Record<string, string> = {
            clinic_owner: "bg-violet-500/10 text-violet-400 border-violet-500/20",
            doctor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            receptionist: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            nurse: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            super_admin: "bg-red-500/10 text-red-400 border-red-500/20",
        };
        return `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${colors[role] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`;
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
                    title="User Management"
                    description={`${users.length} staff member${users.length !== 1 ? "s" : ""}`}
                    icon={<Users className="w-5 h-5 text-[var(--primary)]" />}
                    actions={
                        <Button className="gap-2 shadow-lg shadow-primary/20">
                            <UserPlus className="w-4 h-4" /> Invite User
                        </Button>
                    }
                />
            </div>

            <Card className="overflow-hidden animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                {users.length === 0 ? (
                    <EmptyState
                        icon={<Users className="w-8 h-8" />}
                        title="No users found"
                    />
                ) : (
                    <div className="overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-[var(--muted)]/50 text-[var(--muted-foreground)] sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-5 py-3.5 font-medium">User</th>
                                    <th className="px-5 py-3.5 font-medium">Role</th>
                                    <th className="px-5 py-3.5 font-medium">Status</th>
                                    <th className="px-5 py-3.5 font-medium">Last Login</th>
                                    <th className="px-5 py-3.5 font-medium">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u: Record<string, string>) => (
                                    <tr key={u.user_id} className="border-b border-[var(--border)]/50 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                                                    {u.first_name?.[0]}{u.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{u.first_name} {u.last_name}</p>
                                                    <p className="text-xs text-[var(--muted-foreground)]">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={roleBadge(u.role_name)}>
                                                <Shield className="w-3 h-3 mr-1" />
                                                {u.role_name.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StatusBadge status={u.status || "active"} />
                                        </td>
                                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                                            {u.last_login_at
                                                ? new Date(u.last_login_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                                                : "Never"}
                                        </td>
                                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                                            {new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
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
