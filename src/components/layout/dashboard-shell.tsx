"use client";

import { useEffect } from "react";
import { useLayoutStore } from "@/lib/store/layout-store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { MobileMenu } from "./mobile-menu";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";

interface DashboardShellProps {
    children: React.ReactNode;
    user: SessionUser;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
    const { isSidebarOpen, setSidebarOpen } = useLayoutStore();

    useEffect(() => {
        const checkTablet = () => {
            if (window.innerWidth >= 768 && window.innerWidth < 1024) {
                setSidebarOpen(false);
            } else if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            }
        };

        // Check on initial load
        checkTablet();

        window.addEventListener("resize", checkTablet);
        return () => window.removeEventListener("resize", checkTablet);
    }, [setSidebarOpen]);

    return (
        <div className="min-h-screen bg-[var(--bg-canvas)] transition-colors duration-300">
            <Topbar user={user} />
            <Sidebar user={user} />

            <main
                className={cn(
                    "pt-[60px] min-h-screen transition-all duration-300 ease-in-out pb-[80px] md:pb-6",
                    isSidebarOpen ? "md:pl-[240px]" : "md:pl-[64px]"
                )}
            >
                <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto animate-fade-in">
                    {children}
                </div>
            </main>

            <MobileNav />
            <MobileMenu user={user} />
        </div>
    );
}
