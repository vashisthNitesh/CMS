"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLayoutStore } from "@/lib/store/layout-store";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Calendar,
    Users,
    FileText,
    Pill,
    Stethoscope,
    Settings,
    ChevronLeft,
    ChevronRight,
    ListOrdered,
    Briefcase,
    UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
    user: SessionUser;
}

type NavItem = {
    title: string;
    href: string;
    icon: React.ElementType;
    roles?: string[]; // Roles that can see this
};

type NavGroup = {
    label: string;
    items: NavItem[];
};

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const { isSidebarOpen, toggleSidebar } = useLayoutStore();

    const navGroups: NavGroup[] = [
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

    const filterNavItems = (items: NavItem[]) => {
        return items.filter((item) => !item.roles || item.roles.includes(user.role));
    };

    return (
        <motion.aside
            className={cn(
                "fixed left-0 top-0 bottom-0 z-40 flex flex-col pt-[60px] bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] transition-all duration-300 ease-in-out hidden md:flex",
                isSidebarOpen ? "w-[240px]" : "w-[64px]"
            )}
            initial={false}
            animate={{ width: isSidebarOpen ? 240 : 64 }}
        >
            {/* Navigation Groups */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                {navGroups.map((group) => {
                    const visibleItems = filterNavItems(group.items);
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.label} className="px-3">
                            <AnimatePresence>
                                {isSidebarOpen && (
                                    <motion.h3
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-2 px-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider"
                                    >
                                        {group.label}
                                    </motion.h3>
                                )}
                            </AnimatePresence>
                            <div className="space-y-1">
                                {visibleItems.map((item, itemIndex) => {
                                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                    const Icon = item.icon;

                                    return (
                                        <Tooltip key={item.href} delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group relative",
                                                        isActive
                                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-sunken)] hover:text-[var(--text-primary)]",
                                                        !isSidebarOpen && "justify-center px-2"
                                                    )}
                                                >
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="activeNav"
                                                            className="absolute left-0 top-1 bottom-1 w-1 bg-blue-600 rounded-r-full"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                        />
                                                    )}
                                                    <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-blue-600 dark:text-blue-400")} />

                                                    <AnimatePresence>
                                                        {isSidebarOpen && (
                                                            <motion.span
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0, x: -10 }}
                                                                transition={{ delay: 0.05 * itemIndex }} // Staggered effect
                                                                className="font-medium text-sm whitespace-nowrap overflow-hidden"
                                                            >
                                                                {item.title}
                                                            </motion.span>
                                                        )}
                                                    </AnimatePresence>
                                                </Link>
                                            </TooltipTrigger>
                                            {!isSidebarOpen && (
                                                <TooltipContent side="right" className="flex items-center gap-2 bg-[var(--bg-topbar)] text-white border-none shadow-xl">
                                                    {item.title}
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer: User Profile & Collapse */}
            <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-sunken)]/50 mt-auto">
                <div className={cn("flex items-center gap-2", !isSidebarOpen ? "flex-col" : "justify-between")}>

                    {isSidebarOpen ? (
                        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm flex-1 min-w-0">
                            <Avatar className="h-8 w-8 rounded-md shrink-0">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name} ${user.last_name}`} />
                                <AvatarFallback className="rounded-md">{user.first_name?.[0]}{user.last_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden min-w-0">
                                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.first_name} {user.last_name}</span>
                                <span className="text-[10px] text-[var(--text-tertiary)] capitalize truncate">{user.role.replace('_', ' ')}</span>
                            </div>
                        </div>
                    ) : (
                        <Avatar className="h-8 w-8 rounded-md shrink-0 mb-2">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name} ${user.last_name}`} />
                            <AvatarFallback className="rounded-md">{user.first_name?.[0]}{user.last_name?.[0]}</AvatarFallback>
                        </Avatar>
                    )}

                    {/* Collapse Toggle */}
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleSidebar}
                                className={cn(
                                    "h-8 w-8 rounded-full shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)]",
                                )}
                            >
                                {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-[var(--bg-topbar)] text-white border-none shadow-xl">
                            {isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                        </TooltipContent>
                    </Tooltip>

                </div>
            </div>
        </motion.aside>
    );
}
