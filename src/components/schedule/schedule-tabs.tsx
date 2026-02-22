"use client";

import { useState, useCallback } from "react";
import { Calendar, Clock, Shield, Eye, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DoctorSelector } from "./doctor-selector";
import { WeeklyScheduleTab } from "./weekly-schedule-tab";
import { TimeBlocksTab } from "./time-blocks-tab";
import { SlotOverridesTab } from "./slot-overrides-tab";
import { SchedulePreviewTab } from "./schedule-preview-tab";
import { Button } from "@/components/ui/button";
import type {
    ScheduleTemplate,
    TimeBlock,
    SlotOverride,
} from "@/lib/types";

interface Doctor {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface ScheduleTabsProps {
    doctors: Doctor[];
    initialDoctorId: string;
    initialTemplates: ScheduleTemplate[];
    initialActiveTemplate: ScheduleTemplate | null;
    initialTimeBlocks: TimeBlock[];
    initialOverrides: SlotOverride[];
    userRole: string;
    userId: string;
}

const TABS = [
    { id: "weekly", label: "Weekly Schedule", icon: Calendar, description: "Define standard work pattern" },
    { id: "blocks", label: "Time Blocks", icon: Shield, description: "Manage leaves & availability" },
    { id: "overrides", label: "Slot Overrides", icon: Clock, description: "Custom day schedules" },
    { id: "preview", label: "Schedule Preview", icon: Eye, description: "Calendar view" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ScheduleTabs({
    doctors,
    initialDoctorId,
    initialTemplates,
    initialActiveTemplate,
    initialTimeBlocks,
    initialOverrides,
    userRole,
    userId,
}: ScheduleTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>("weekly");
    const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
    const [templates, setTemplates] = useState(initialTemplates);
    const [activeTemplate, setActiveTemplate] = useState(initialActiveTemplate);
    const [timeBlocks, setTimeBlocks] = useState(initialTimeBlocks);
    const [overrides, setOverrides] = useState(initialOverrides);
    const [showBlockForm, setShowBlockForm] = useState(false);

    const isDoctor = userRole === "doctor";
    const isAdmin = userRole === "clinic_owner" || userRole === "super_admin";
    const isReadOnly = !isAdmin;

    const handleDoctorChange = useCallback(async (doctorId: string) => {
        setSelectedDoctorId(doctorId);
        // Reload data for this doctor via server actions
        try {
            const { getTemplates, getActiveTemplate } = await import("@/actions/schedule-templates");
            const { getTimeBlocks } = await import("@/actions/time-blocks");
            const { getOverrides } = await import("@/actions/slot-overrides");

            const [tpls, activeTpl, blocks, ovrs] = await Promise.all([
                getTemplates(doctorId),
                getActiveTemplate(doctorId),
                getTimeBlocks(doctorId, { status: ["PENDING", "APPROVED"] }),
                getOverrides(doctorId),
            ]);
            setTemplates(tpls);
            setActiveTemplate(activeTpl);
            setTimeBlocks(blocks);
            setOverrides(ovrs);
        } catch (error) {
            console.error("Failed to load doctor schedule:", error);
        }
    }, []);

    const refreshData = useCallback(async () => {
        await handleDoctorChange(selectedDoctorId);
    }, [handleDoctorChange, selectedDoctorId]);

    return (
        <div className="space-y-6">
            {/* ─── Page Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
                <div className="flex items-center gap-4">
                    <DoctorSelector
                        doctors={doctors}
                        selectedId={selectedDoctorId}
                        onSelect={handleDoctorChange}
                        locked={isDoctor}
                    />
                </div>
                <div className="flex items-center gap-2">
                    {(isAdmin || isDoctor) && (
                        <Button
                            onClick={() => { setActiveTab("blocks"); setShowBlockForm(true); }}
                            className="gap-2 shadow-lg shadow-[var(--primary)]/20"
                        >
                            <Plus className="w-4 h-4" />
                            Add Time Block
                        </Button>
                    )}
                </div>
            </div>

            {/* ─── Tab Bar ─── */}
            <div className="flex gap-1 p-1 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] overflow-x-auto">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1",
                                isActive
                                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm border border-[var(--border)]"
                                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                            )}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* ─── Tab Content ─── */}
            <div className="animate-fade-in-up">
                {activeTab === "weekly" && (
                    <WeeklyScheduleTab
                        templates={templates}
                        activeTemplate={activeTemplate}
                        doctorId={selectedDoctorId}
                        isReadOnly={isReadOnly}
                        onRefresh={refreshData}
                    />
                )}
                {activeTab === "blocks" && (
                    <TimeBlocksTab
                        timeBlocks={timeBlocks}
                        doctorId={selectedDoctorId}
                        isAdmin={isAdmin}
                        isDoctor={isDoctor}
                        userId={userId}
                        showCreateForm={showBlockForm}
                        onShowCreateForm={setShowBlockForm}
                        onRefresh={refreshData}
                    />
                )}
                {activeTab === "overrides" && (
                    <SlotOverridesTab
                        overrides={overrides}
                        doctorId={selectedDoctorId}
                        isAdmin={isAdmin}
                        onRefresh={refreshData}
                    />
                )}
                {activeTab === "preview" && (
                    <SchedulePreviewTab
                        activeTemplate={activeTemplate}
                        timeBlocks={timeBlocks}
                        overrides={overrides}
                        doctorId={selectedDoctorId}
                    />
                )}
            </div>
        </div>
    );
}
