"use client";

import { useState } from "react";
import { TopBar } from "@/components/dashboard/topbar";
import { CommandPalette } from "@/components/dashboard/command-palette";
import type { SessionUser } from "@/lib/types";

export function DashboardShell({
    session,
    children,
}: {
    session: SessionUser;
    children: React.ReactNode;
}) {
    const [commandOpen, setCommandOpen] = useState(false);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar
                session={session}
                onSearchOpen={() => setCommandOpen(true)}
            />
            <main className="flex-1 overflow-auto relative z-10 dot-grid">
                <div className="p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
            <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        </div>
    );
}
