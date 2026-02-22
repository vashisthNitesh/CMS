"use client";

import { useLayoutStore } from "@/lib/store/layout-store";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Calendar,
    Users,
    FileText,
    Pill,
    Stethoscope,
    Settings,
    ListOrdered,
    Briefcase,
    UserPlus
} from "lucide-react";
import type { SessionUser } from "@/lib/types";

interface MobileMenuProps {
    user: SessionUser;
}

export function MobileMenu({ user }: MobileMenuProps) {
    const { isMobileMenuOpen, setMobileMenuOpen } = useLayoutStore();
    const pathname = usePathname();

    const navGroups = [
        {
            label: "Overview",
            items: [
                { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            ],
        },
        {
            label: "Appointments",
            items: [
                { title: "Calendar", href: "/dashboard/appointments", icon: Calendar },
                { title: "Queue", href: "/dashboard/receptionist/live-queue", icon: ListOrdered },
            ],
        },
        {
            label: "Patients",
            items: [
                { title: "All Patients", href: "/dashboard/patients", icon: Users },
                { title: "Add Patient", href: "/dashboard/patients/new", icon: UserPlus, roles: ["doctor", "receptionist", "clinic_owner"] },
            ],
        },
        {
            label: "Clinical",
            items: [
                { title: "EMR", href: "/dashboard/emr", icon: FileText, roles: ["doctor", "nurse", "clinic_owner"] },
                { title: "Prescriptions", href: "/dashboard/prescriptions", icon: Pill, roles: ["doctor", "clinic_owner"] },
            ],
        },
        {
            label: "Management",
            items: [
                { title: "Doctors", href: "/dashboard/doctors", icon: Stethoscope, roles: ["clinic_owner", "receptionist"] },
                { title: "Services", href: "/dashboard/services", icon: Briefcase, roles: ["clinic_owner"] },
                { title: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["clinic_owner", "super_admin"] },
            ],
        },
    ];

    const filterNavItems = (items: any[]) => {
        return items.filter((item) => !item.roles || item.roles.includes(user.role));
    };

    return (
        <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="w-[85vw] max-w-sm p-0 flex flex-col pt-12 pb-24 border-r-0">
                <VisuallyHidden>
                    <SheetTitle>Mobile Navigation Menu</SheetTitle>
                </VisuallyHidden>

                <div className="flex-1 overflow-y-auto w-full">
                    <div className="px-4 py-4 space-y-6">
                        {navGroups.map((group) => {
                            const visibleItems = filterNavItems(group.items);
                            if (visibleItems.length === 0) return null;

                            return (
                                <div key={group.label} className="space-y-2">
                                    <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-2">
                                        {group.label}
                                    </h4>
                                    <div className="space-y-1">
                                        {visibleItems.map((item) => {
                                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                            const Icon = item.icon;

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 w-full text-left touch-target",
                                                        isActive
                                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                                                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-sunken)] hover:text-[var(--text-primary)]"
                                                    )}
                                                >
                                                    <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400")} />
                                                    <span className="text-[15px]">{item.title}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
