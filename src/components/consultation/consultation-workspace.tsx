"use client";

import { useState } from "react";
import { PatientPanel } from "./patient-panel";
import { SoapPanel } from "./soap-panel";
import { ActionsPanel } from "./actions-panel";

interface ConsultationWorkspaceProps {
    appointment: any;
}

export function ConsultationWorkspace({ appointment }: ConsultationWorkspaceProps) {
    // Global state for auto-save, timer, and active sections
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

    return (
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-[var(--bg-app)]">
            {/* Left Panel: Patient context, sticky on desktop */}
            <div className="w-full lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--bg-sidebar)] lg:h-full lg:overflow-y-auto">
                <PatientPanel appointment={appointment} />
            </div>

            {/* Center Panel: Main SOAP notes, flexible */}
            <div className="flex-1 block lg:h-full lg:overflow-y-auto relative bg-[var(--bg-canvas)] min-h-[500px]">
                <div className="max-w-4xl mx-auto p-6 pb-24">
                    <SoapPanel appointment={appointment} onSave={() => {
                        setIsSaving(true);
                        setTimeout(() => {
                            setIsSaving(false);
                            setLastSavedAt(new Date());
                        }, 800);
                    }} />
                </div>

                {/* Auto-save Indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[var(--bg-popover)] border border-[var(--border)] px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    {isSaving ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            Saving...
                        </>
                    ) : lastSavedAt ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 rounded-full bg-[var(--text-muted)]" />
                            Not saved yet
                        </>
                    )}
                </div>
            </div>

            {/* Right Panel: Actions and Timer, sticky on desktop */}
            <div className="w-full lg:w-[300px] shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--border)] bg-[var(--bg-sidebar)] lg:h-full lg:overflow-y-auto">
                <ActionsPanel appointment={appointment} />
            </div>
        </div>
    );
}
