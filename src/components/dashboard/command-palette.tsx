"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    LayoutDashboard,
    Calendar,
    Users,
    UserPlus,
    UserRound,
    UserCog,
    CreditCard,
    Stethoscope,
    FileText,
    Settings,
    TrendingUp,
    BarChart,
    Search,
} from "lucide-react";

const navigationItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navigation" },
    { label: "Appointments", href: "/dashboard/appointments", icon: Calendar, group: "Navigation" },
    { label: "Live Queue", href: "/dashboard/appointments/queue", icon: Users, group: "Navigation" },
    { label: "All Patients", href: "/dashboard/patients", icon: UserRound, group: "Navigation" },
    { label: "Register Patient", href: "/dashboard/patients/new", icon: UserPlus, group: "Quick Actions" },
    { label: "Book Appointment", href: "/dashboard/appointments/new", icon: Calendar, group: "Quick Actions" },
    { label: "Consultations", href: "/dashboard/consultations", icon: Stethoscope, group: "Clinical" },
    { label: "Prescriptions", href: "/dashboard/prescriptions", icon: FileText, group: "Clinical" },
    { label: "Billing", href: "/dashboard/billing", icon: CreditCard, group: "Billing" },
    { label: "Doctors", href: "/dashboard/doctors", icon: UserCog, group: "Management" },
    { label: "Reports", href: "/dashboard/reports", icon: TrendingUp, group: "Management" },
    { label: "Appointment Reports", href: "/dashboard/appointments/reports", icon: BarChart, group: "Management" },
    { label: "Settings", href: "/dashboard/settings", icon: Settings, group: "Management" },
];

export function CommandPalette({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const router = useRouter();

    // Group items
    const groups = React.useMemo(() => {
        const map = new Map<string, typeof navigationItems>();
        navigationItems.forEach((item) => {
            const existing = map.get(item.group) || [];
            existing.push(item);
            map.set(item.group, existing);
        });
        return map;
    }, []);

    const runCommand = React.useCallback(
        (href: string) => {
            onOpenChange(false);
            router.push(href);
        },
        [router, onOpenChange]
    );

    // Global keyboard shortcut
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
                if (
                    (e.target instanceof HTMLElement && e.target.isContentEditable) ||
                    e.target instanceof HTMLInputElement ||
                    e.target instanceof HTMLTextAreaElement ||
                    e.target instanceof HTMLSelectElement
                ) {
                    return;
                }
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [open, onOpenChange]);

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>
                    <div className="flex flex-col items-center gap-2 py-6">
                        <Search className="w-8 h-8 text-[var(--muted-foreground)]/40" />
                        <p className="text-sm text-[var(--muted-foreground)]">No results found.</p>
                    </div>
                </CommandEmpty>

                {Array.from(groups.entries()).map(([group, items], i) => (
                    <React.Fragment key={group}>
                        {i > 0 && <CommandSeparator />}
                        <CommandGroup heading={group}>
                            {items.map((item) => (
                                <CommandItem
                                    key={item.href}
                                    value={item.label}
                                    onSelect={() => runCommand(item.href)}
                                    className="gap-3 cursor-pointer"
                                >
                                    <item.icon className="w-4 h-4 text-[var(--muted-foreground)]" />
                                    <span>{item.label}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </React.Fragment>
                ))}
            </CommandList>
        </CommandDialog>
    );
}
