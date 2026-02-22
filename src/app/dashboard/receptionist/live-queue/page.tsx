"use client";

import { useLiveQueue } from "@/hooks/use-live-queue";
import { LiveQueueStats } from "@/components/live-queue/live-queue-stats";
import { QueueTable } from "@/components/live-queue/queue-table";
import { PatientDetailPanel } from "@/components/live-queue/patient-detail";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle } from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";
import { useState } from "react";

export default function LiveQueuePage() {
    const { queue, stats, selectedPatient, setSelectedPatient, isConnected, handleStatusChange } = useLiveQueue();
    const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

    const handlePatientSelect = (patient: any) => {
        setSelectedPatient(patient);
        if (window.innerWidth < 1280) {
            setIsMobileSheetOpen(true);
        }
    };

    return (
        <div className="h-[calc(100vh-172px)] md:h-[calc(100vh-132px)] lg:h-[calc(100vh-148px)] flex flex-col gap-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="heading-2 tracking-tight">Live Queue</h1>
                    <p className="text-[var(--muted-foreground)]">Real-time patient flow monitor</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-sm">
                    <div className={cn(
                        "w-2.5 h-2.5 rounded-full transition-colors duration-500",
                        isConnected ? "bg-emerald-500" : "bg-amber-500"
                    )}>
                        {isConnected && <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                    </div>
                    <span className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    )}>
                        {isConnected ? "Live Sync" : "Reconnecting..."}
                    </span>
                    {!isConnected && <Activity className="w-3 h-3 text-amber-500 animate-spin" />}
                </div>
            </div>

            {/* Stats Bar */}
            <div className="shrink-0">
                <LiveQueueStats stats={stats} />
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
                {/* Left Panel: Queue Table */}
                <div className="flex-[7] min-w-0 flex flex-col h-full">
                    <QueueTable
                        queue={queue}
                        selectedId={selectedPatient?.appointment_id}
                        onSelect={handlePatientSelect}
                        onStatusChange={handleStatusChange}
                    />
                </div>

                {/* Right Panel: Detail View (Desktop) */}
                <div className="flex-[3] min-w-[320px] hidden xl:flex flex-col h-full rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm bg-[var(--card)]">
                    <PatientDetailPanel patient={selectedPatient} />
                </div>
            </div>

            {/* Mobile/Tablet Detail Sheet */}
            <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                <SheetContent side="right" className="w-[100vw] sm:w-[450px] p-0 flex flex-col border-none sm:border-l">
                    <VisuallyHidden><DialogTitle>Patient Details</DialogTitle></VisuallyHidden>
                    <div className="flex-1 overflow-hidden bg-[var(--card)]">
                        <PatientDetailPanel patient={selectedPatient} />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
