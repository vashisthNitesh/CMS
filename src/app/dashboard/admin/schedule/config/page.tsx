"use client";

import { useState } from "react";
import { ScheduleLayout } from "@/components/schedule/schedule-layout";
import { WeeklyScheduleTab } from "@/components/schedule/weekly-schedule-tab";
import { TimeBlocksTab } from "@/components/schedule/time-blocks-tab";
import { SlotOverridesTab } from "@/components/schedule/slot-overrides-tab";
import { PreviewCalendarTab } from "@/components/schedule/preview-calendar-tab";

export default function ScheduleConfigPage() {
    const [activeTab, setActiveTab] = useState("weekly");

    // Mock doctors data (replace with DB fetch)
    const doctors = [
        { id: "1", name: "Dr. Sarah Smith" },
        { id: "2", name: "Dr. James Wilson" },
        { id: "3", name: "Dr. Emily Chen" },
    ];

    return (
        <ScheduleLayout
            doctors={doctors}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            {activeTab === "weekly" && <WeeklyScheduleTab />}
            {activeTab === "blocks" && <TimeBlocksTab />}
            {activeTab === "overrides" && <SlotOverridesTab />}
            {activeTab === "preview" && <PreviewCalendarTab />}
        </ScheduleLayout>
    );
}
