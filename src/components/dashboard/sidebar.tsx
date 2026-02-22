"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { logoutAction } from "@/actions/auth";
import {
    Stethoscope,
    LogOut,
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    UserRound,
    UserPlus,
    CreditCard,
    Receipt,
    Banknote,
    UserCog,
    TrendingUp,
    FileText,
    BarChart,
    ChevronsLeft,
    ChevronsRight,
    Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";

interface NavGroup {
    label: string;
    items: NavItem[];
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    roles: string[];
    indent?: boolean;
}

const navGroups: NavGroup[] = [
    {
        label: "OVERVIEW",
        items: [
            { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, roles: ["*"] },
        ],
    },
    {
        label: "APPOINTMENTS",
        items: [
            { label: "Appointments", href: "/dashboard/appointments", icon: <Calendar className="w-4 h-4" />, roles: ["*"] },
            { label: "Live Queue", href: "/dashboard/appointments/queue", icon: <Users className="w-4 h-4" />, roles: ["receptionist", "doctor", "clinic_owner", "super_admin"] },
            { label: "Reports", href: "/dashboard/appointments/reports", icon: <BarChart className="w-4 h-4" />, roles: ["clinic_owner", "super_admin"], indent: true },
        ],
    },
    {
        label: "PATIENTS",
        items: [
            { label: "All Patients", href: "/dashboard/patients", icon: <UserRound className="w-4 h-4" />, roles: ["*"] },
            { label: "Register Patient", href: "/dashboard/patients/new", icon: <UserPlus className="w-4 h-4" />, roles: ["receptionist", "clinic_owner", "super_admin"], indent: true },
        ],
    },
    {
        label: "CLINICAL",
        items: [
            { label: "Consultations", href: "/dashboard/consultations", icon: <Stethoscope className="w-4 h-4" />, roles: ["doctor", "clinic_owner", "super_admin"] },
            { label: "Prescriptions", href: "/dashboard/prescriptions", icon: <FileText className="w-4 h-4" />, roles: ["doctor", "clinic_owner", "super_admin"] },
        ],
    },
    {
        label: "BILLING",
        items: [
            { label: "Billing", href: "/dashboard/billing", icon: <CreditCard className="w-4 h-4" />, roles: ["receptionist", "clinic_owner", "super_admin"] },
            { label: "Invoices", href: "/dashboard/billing/invoices", icon: <Receipt className="w-4 h-4" />, roles: ["receptionist", "clinic_owner", "super_admin"], indent: true },
            { label: "Payments", href: "/dashboard/billing/payments", icon: <Banknote className="w-4 h-4" />, roles: ["receptionist", "clinic_owner", "super_admin"], indent: true },
        ],
    },
    {
        label: "MANAGEMENT",
        items: [
            { label: "Doctors", href: "/dashboard/doctors", icon: <UserCog className="w-4 h-4" />, roles: ["clinic_owner", "super_admin"] },
            { label: "Schedule", href: "/dashboard/doctors/schedule", icon: <Calendar className="w-4 h-4" />, roles: ["clinic_owner", "super_admin", "doctor"], indent: true },
            { label: "Reports", href: "/dashboard/reports", icon: <TrendingUp className="w-4 h-4" />, roles: ["clinic_owner", "super_admin"] },
            { label: "Settings", href: "/dashboard/settings", icon: <Settings className="w-4 h-4" />, roles: ["clinic_owner", "super_admin"] },
        ],
    },
];

function isVisible(item: NavItem, role: string): boolean {
    return item.roles.includes("*") || item.roles.includes(role);
}

/* ======= SIDEBAR NAV CONTENT (shared between desktop + mobile) ======= */
function SidebarNav({
    session,
    collapsed,
}: {
    session: SessionUser;
    collapsed: boolean;
}) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/dashboard")
            return pathname === "/dashboard" || pathname === "/dashboard/admin" || pathname === "/dashboard/doctor" || pathname === "/dashboard/receptionist";
        return pathname.startsWith(href);
    };

    return (
        <ScrollArea className="flex-1 py-2">
            <nav className="px-2 space-y-1">
                {navGroups.map((group) => {
                    const visibleItems = group.items.filter((item) => isVisible(item, session.role));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.label} className="mb-1">
                            {/* Group label — hidden when collapsed */}
                            {!collapsed && (
                                <p className="text-[10px] font-semibold text-[var(--muted-foreground)]/50 uppercase tracking-widest px-3 py-2 mt-3 first:mt-0 select-none">
                                    {group.label}
                                </p>
                            )}
                            {collapsed && <Separator className="my-2 opacity-40" />}

                            {visibleItems.map((item) => {
                                const active = isActive(item.href);
                                const link = (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg text-sm transition-all duration-150 group relative overflow-hidden",
                                            collapsed ? "justify-center px-2 py-2.5 mx-auto" : "px-3 py-2",
                                            item.indent && !collapsed && "ml-3 text-[13px]",
                                            active
                                                ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                                                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/60"
                                        )}
                                    >
                                        {active && !collapsed && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--primary)] rounded-r-full" />
                                        )}
                                        <span className={cn(
                                            "transition-colors flex-shrink-0",
                                            active ? "text-[var(--primary)]" : "group-hover:text-[var(--primary)]"
                                        )}>
                                            {item.icon}
                                        </span>
                                        {!collapsed && <span className="truncate">{item.label}</span>}
                                    </Link>
                                );

                                if (collapsed) {
                                    return (
                                        <Tooltip key={item.href} delayDuration={0}>
                                            <TooltipTrigger asChild>{link}</TooltipTrigger>
                                            <TooltipContent side="right" className="font-medium">
                                                {item.label}
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                }

                                return link;
                            })}
                        </div>
                    );
                })}
            </nav>
        </ScrollArea>
    );
}

/* ======= MAIN SIDEBAR EXPORT ======= */
export function Sidebar({ session }: { session: SessionUser }) {
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("sidebar-collapsed") === "true";
        }
        return false;
    });
    const roleLabel = session.role.replace(/_/g, " ");
    const initials = `${session.first_name[0]}${session.last_name[0]}`.toUpperCase();

    const toggle = () => {
        setCollapsed((prev) => {
            localStorage.setItem("sidebar-collapsed", String(!prev));
            return !prev;
        });
    };

    return (
        <aside
            className={cn(
                "border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] flex flex-col relative z-20 transition-all duration-300 ease-in-out sticky top-0 h-screen hidden md:flex",
                collapsed ? "w-[60px]" : "w-[260px]"
            )}
        >
            {/* Logo */}
            <div className={cn("border-b border-[var(--sidebar-border)] flex items-center", collapsed ? "px-2 py-4 justify-center" : "p-4")}>
                {collapsed ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center glow-primary cursor-default">
                                <Stethoscope className="w-5 h-5 text-[var(--primary)]" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">ClinicOS</TooltipContent>
                    </Tooltip>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center glow-primary">
                            <Stethoscope className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm tracking-tight">ClinicOS</h2>
                            <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-medium">
                                {roleLabel}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <SidebarNav session={session} collapsed={collapsed} />

            {/* Collapse toggle */}
            <div className="px-2 py-2 border-t border-[var(--sidebar-border)]">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggle}
                    className={cn(
                        "w-full flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg",
                        collapsed && "justify-center px-0"
                    )}
                >
                    {collapsed ? <ChevronsRight className="w-4 h-4" /> : <><ChevronsLeft className="w-4 h-4" /><span>Collapse</span></>}
                </Button>
            </div>

            {/* User Card */}
            <div className={cn("border-t border-[var(--sidebar-border)]", collapsed ? "p-2" : "p-3")}>
                {collapsed ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <div className="w-9 h-9 mx-auto rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-xs font-bold text-white ring-2 ring-[var(--sidebar)] cursor-default">
                                {initials}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            {session.first_name} {session.last_name}
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <div className="flex items-center gap-3 p-2 rounded-lg">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-2 ring-[var(--sidebar)]">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                                {session.first_name} {session.last_name}
                            </p>
                            <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                                {session.email}
                            </p>
                        </div>
                        <form action={logoutAction}>
                            <Button
                                variant="ghost"
                                size="icon"
                                type="submit"
                                className="flex-shrink-0 opacity-50 hover:opacity-100 hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition h-8 w-8"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </aside>
    );
}

/* ======= MOBILE SIDEBAR (Sheet drawer) ======= */
export function MobileSidebar({ session }: { session: SessionUser }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    // Close sheet on navigation
    useEffect(() => {
        if (open) setOpen(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                    <Menu className="w-5 h-5" />
                    <span className="sr-only">Toggle navigation</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-[var(--sidebar)]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                {/* Logo */}
                <div className="p-4 border-b border-[var(--sidebar-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center glow-primary">
                            <Stethoscope className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm tracking-tight">ClinicOS</h2>
                            <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-medium">
                                {session.role.replace(/_/g, " ")}
                            </p>
                        </div>
                    </div>
                </div>

                <SidebarNav session={session} collapsed={false} />

                {/* User card */}
                <div className="p-3 border-t border-[var(--sidebar-border)]">
                    <div className="flex items-center gap-3 p-2 rounded-lg">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {`${session.first_name[0]}${session.last_name[0]}`.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{session.first_name} {session.last_name}</p>
                            <p className="text-[11px] text-[var(--muted-foreground)] truncate">{session.email}</p>
                        </div>
                        <form action={logoutAction}>
                            <Button variant="ghost" size="icon" type="submit" className="flex-shrink-0 opacity-50 hover:opacity-100 hover:text-[var(--destructive)] h-8 w-8">
                                <LogOut className="w-3.5 h-3.5" />
                            </Button>
                        </form>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
