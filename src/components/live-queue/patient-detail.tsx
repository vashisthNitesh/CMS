"use client";

import {
    User,
    Phone,
    Brain,
    Pill,
    AlertTriangle,
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { QueueItem } from "@/hooks/use-live-queue";
import { cn } from "@/lib/utils";

interface PatientDetailProps {
    patient: QueueItem | null;
}

export function PatientDetailPanel({ patient }: PatientDetailProps) {
    if (!patient) {
        return (
            <div className="h-full flex items-center justify-center text-[var(--muted-foreground)] border-l border-[var(--border)] bg-[var(--muted)]/10">
                <div className="text-center">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Select a patient to view details</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full border-l border-[var(--border)] bg-[var(--card)] flex flex-col min-h-0">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border)]">
                <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 border-2 border-[var(--primary)]/20">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.patient_id}`} />
                        <AvatarFallback>{(patient.patient_name || "Guest")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold truncate">{patient.patient_name || "Unknown Patient"}</h2>
                        <div className="flex flex-wrap gap-2 text-sm text-[var(--muted-foreground)] mt-1">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> 28y • Male</span>
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +1 234...</span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <Button className="flex-1" size="sm">Open File</Button>
                    <Button variant="outline" size="sm">History</Button>
                </div>
            </div>

            <div className="flex-1 relative min-h-0">
                <ScrollArea className="h-full w-full">
                    <div className="p-6 space-y-6">
                        {/* AI Summary Card */}
                        <div className="relative overflow-hidden rounded-xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--accent)]/5 p-4">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Brain className="w-24 h-24" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-sm font-bold text-[var(--primary)] flex items-center gap-2 mb-2">
                                    <Brain className="w-4 h-4" /> AI Visit Context
                                </h3>
                                <p className="text-sm leading-relaxed text-[var(--foreground)]/80">
                                    Patient complains of recurring migraines. History of hypertension.
                                    Last visited 2 months ago for regular checkup. Vitals stable but BP slightly elevated.
                                </p>
                            </div>
                        </div>

                        {/* Vitals Snapshot */}
                        <div>
                            <h4 className="text-xs font-semibold uppercase text-[var(--muted-foreground)] tracking-wider mb-3">Vitals (Last Visit)</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)]">
                                    <span className="text-xs text-[var(--muted-foreground)] block">BP</span>
                                    <span className="font-mono font-bold text-lg">120/80</span>
                                </div>
                                <div className="p-3 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)]">
                                    <span className="text-xs text-[var(--muted-foreground)] block">Heart Rate</span>
                                    <span className="font-mono font-bold text-lg">72 <span className="text-xs font-normal">bpm</span></span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Quick Info */}
                        <div className="space-y-4">
                            <InfoSection
                                icon={Pill}
                                title="Current Medications"
                                items={["Lisinopril 10mg", "Ibuprofen 400mg (warn)"]}
                                alert
                            />
                            <InfoSection
                                icon={AlertTriangle}
                                title="Allergies"
                                items={["Penicillin (Severe)", "Peanuts"]}
                                danger
                            />
                            <InfoSection
                                icon={FileText}
                                title="Pending Reports"
                                items={["Blood Work (CBC)", "Lipid Profile"]}
                            />
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}

interface InfoSectionProps {
    icon: React.ElementType;
    title: string;
    items: string[];
    alert?: boolean;
    danger?: boolean;
}

function InfoSection({ icon: Icon, title, items, alert, danger }: InfoSectionProps) {
    return (
        <div>
            <h4 className="text-xs font-semibold uppercase text-[var(--muted-foreground)] tracking-wider mb-2 flex items-center gap-2">
                <Icon className={cn("w-4 h-4", danger ? "text-red-500" : "text-[var(--primary)]")} />
                {title}
            </h4>
            <ul className="space-y-1">
                {items.map((item, i) => (
                    <li key={i} className={cn(
                        "text-sm px-2 py-1 rounded",
                        danger ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                            alert ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                                "text-[var(--foreground)]"
                    )}>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}
