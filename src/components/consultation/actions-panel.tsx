"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pill, FlaskConical, FileUp, CheckCircle2, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActionsPanel({ appointment }: { appointment: any }) {
    // Timer Logic
    // In a real app we would use appointment.consultation_start, but for demo we start from 0
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const expectedMinutes = appointment.slot_duration_min || 15;
    const expectedSeconds = expectedMinutes * 60;

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isWarning = elapsedSeconds >= expectedSeconds * 0.8 && elapsedSeconds < expectedSeconds;
    const isCritical = elapsedSeconds >= expectedSeconds;

    return (
        <div className="flex flex-col h-full bg-[var(--bg-sidebar)]">
            {/* Timer Header */}
            <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-card)]">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Elapsed Time
                    </h2>
                    <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        isCritical ? "bg-red-500/10 text-red-600 border border-red-500/20" :
                            isWarning ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                                "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    )}>
                        {expectedMinutes}m Slot
                    </span>
                </div>
                <div className={cn(
                    "text-4xl font-light tracking-tight mt-2 font-mono tabular-nums transition-colors duration-500",
                    isCritical ? "text-red-500" :
                        isWarning ? "text-amber-500" :
                            "text-[var(--text-primary)]"
                )}>
                    {formatTime(elapsedSeconds)}
                </div>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                {/* Actions */}
                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Quick Actions</h3>
                <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-left h-11 bg-[var(--bg-canvas)] border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                        <Pill className="w-4 h-4 mr-2" />
                        Add Prescription
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-left h-11 bg-[var(--bg-canvas)] border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                        <FlaskConical className="w-4 h-4 mr-2" />
                        Order Lab Test
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-left h-11 bg-[var(--bg-canvas)] border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                        <FileUp className="w-4 h-4 mr-2" />
                        Upload Document
                    </Button>
                </div>

                {/* Prescriptions */}
                <div className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Prescriptions</h3>
                        <button className="text-[var(--primary)] hover:text-[var(--primary)]/80 focus:outline-none">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Mock Prescriptions for this visit */}
                    <div className="space-y-2">
                        <div className="p-3 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-lg text-sm relative group cursor-pointer hover:border-[var(--primary)]/50 transition-colors">
                            <div className="font-medium text-[var(--text-primary)]">Lisinopril 10mg</div>
                            <div className="text-[var(--text-secondary)] text-xs mt-0.5">1 tab PO daily</div>
                            <div className="text-[var(--text-muted)] text-[10px] mt-1">Disp: 30 • Refills: 3</div>
                        </div>
                        <div className="p-3 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-lg text-sm relative group cursor-pointer hover:border-[var(--primary)]/50 transition-colors">
                            <div className="font-medium text-[var(--text-primary)]">Atorvastatin 20mg</div>
                            <div className="text-[var(--text-secondary)] text-xs mt-0.5">1 tab PO at bedtime</div>
                            <div className="text-[var(--text-muted)] text-[10px] mt-1">Disp: 30 • Refills: 3</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Complete CTA */}
            <div className="p-5 border-t border-[var(--border)] bg-[var(--bg-card)]">
                <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-base rounded-xl transition-all hover:shadow-lg">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Complete Consultation
                </Button>
            </div>
        </div>
    );
}
