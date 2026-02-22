import { requireSession } from "@/lib/session";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Building2, Users, Shield, FileText, Bell, CreditCard } from "lucide-react";

const settingsCards = [
    {
        title: "Clinic Configuration",
        description: "Manage your clinic's name, address, contact details, and regional settings.",
        icon: <Building2 className="w-5 h-5" />,
        href: "/dashboard/settings/clinic",
        color: "bg-blue-500/10 text-blue-400",
    },
    {
        title: "User Management",
        description: "Add, edit, or deactivate clinic staff and manage their roles.",
        icon: <Users className="w-5 h-5" />,
        href: "/dashboard/settings/users",
        color: "bg-violet-500/10 text-violet-400",
    },
    {
        title: "Audit Logs",
        description: "View a read-only timeline of all actions performed in the system.",
        icon: <FileText className="w-5 h-5" />,
        href: "/dashboard/settings/audit",
        color: "bg-amber-500/10 text-amber-400",
    },
    {
        title: "Notifications",
        description: "Configure email and SMS notification preferences.",
        icon: <Bell className="w-5 h-5" />,
        href: "#",
        color: "bg-emerald-500/10 text-emerald-400",
        soon: true,
    },
    {
        title: "Billing & Subscription",
        description: "Manage your subscription plan and billing details.",
        icon: <CreditCard className="w-5 h-5" />,
        href: "#",
        color: "bg-indigo-500/10 text-indigo-400",
        soon: true,
    },
    {
        title: "Roles & Permissions",
        description: "Configure custom roles and their associated permissions.",
        icon: <Shield className="w-5 h-5" />,
        href: "#",
        color: "bg-red-500/10 text-red-400",
        soon: true,
    },
];

export default async function SettingsPage() {
    await requireSession();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings"
                description="Manage your clinic configuration, staff, and system preferences."
                icon={<Settings className="w-5 h-5 text-[var(--primary)]" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {settingsCards.map((card) => (
                    <Link
                        key={card.title}
                        href={card.href}
                        className={`block group ${card.soon ? "pointer-events-none opacity-50" : ""}`}
                    >
                        <Card className="h-full hover-lift transition-all duration-300">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
                                        {card.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm group-hover:text-[var(--primary)] transition-colors flex items-center gap-2">
                                            {card.title}
                                            {card.soon && (
                                                <span className="text-[10px] bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full font-medium">
                                                    Coming Soon
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                                            {card.description}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
