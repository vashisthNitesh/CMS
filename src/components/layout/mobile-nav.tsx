"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Users, Stethoscope, Menu } from "lucide-react";
import { useLayoutStore } from "@/lib/store/layout-store";
import { cn } from "@/lib/utils";

export function MobileNav() {
    const pathname = usePathname();
    const { toggleMobileMenu } = useLayoutStore();

    const navItems = [
        { title: "Home", href: "/dashboard", icon: Home },
        { title: "Schedule", href: "/dashboard/appointments", icon: Calendar },
        { title: "Patients", href: "/dashboard/patients", icon: Users },
        { title: "Clinical", href: "/dashboard/emr", icon: Stethoscope },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-didebar)] border-t border-[var(--border-subtle)] h-[64px] z-50 flex items-center justify-around pb-safe">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1",
                            isActive ? "text-blue-600 dark:text-blue-400" : "text-[var(--text-tertiary)]"
                        )}
                    >
                        <Icon className="h-5 w-5" />
                        <span className="text-[10px] font-medium">{item.title}</span>
                    </Link>
                );
            })}

            <button
                type="button"
                onClick={toggleMobileMenu}
                className="flex flex-col items-center justify-center w-full h-full space-y-1 text-[var(--text-tertiary)]"
            >
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium">Menu</span>
            </button>
        </div>
    );
}
