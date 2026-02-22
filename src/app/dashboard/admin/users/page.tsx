import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, User, Shield, Mail, Phone } from "lucide-react";

export default async function UsersPage() {
    const session = await requireSession();

    const users = await db.query(
        `SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, u.status, u.created_at, r.role_name
         FROM users u
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.clinic_id = $1
         ORDER BY u.created_at DESC`,
        [session.clinic_id]
    );

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-[var(--muted-foreground)] mt-1">Manage clinic staff and their access roles.</p>
                </div>
                <Button className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4" />
                    New User
                </Button>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                {/* Toolbar */}
                <div className="p-4 border-b border-[var(--border)] flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-9 pr-4 py-2 bg-[var(--input)] border border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all placeholder:text-[var(--muted-foreground)]"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-[var(--muted)]/50 text-[var(--muted-foreground)] sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-4 font-medium">Create Date</th>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Contact</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {users.rows.map((user: any, i: number) => (
                                <tr
                                    key={user.user_id}
                                    className="group hover:bg-white/[0.02] transition-colors"
                                    style={{ animationDelay: `${i * 50}ms` }}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-[var(--muted-foreground)]">
                                        {new Date(user.created_at).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-bold text-xs">
                                                {user.first_name[0]}{user.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium">{user.first_name} {user.last_name}</p>
                                                <p className="text-xs text-[var(--muted-foreground)]">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className="capitalize gap-1.5 pl-1.5">
                                            {user.role_name === 'clinic_owner' ? <Shield className="w-3 h-3 text-amber-500" /> : <User className="w-3 h-3 text-blue-500" />}
                                            {user.role_name.replace(/_/g, " ")}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-[var(--muted-foreground)]">
                                        {user.phone ? (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3" />
                                                {user.phone}
                                            </div>
                                        ) : (
                                            <span className="opacity-50">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                                            {user.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
