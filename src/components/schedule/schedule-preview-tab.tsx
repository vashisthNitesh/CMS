"use client";

import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeToMin, computeSlotCount } from "@/lib/schedule-utils";
import type { ScheduleTemplate, TimeBlock, SlotOverride } from "@/lib/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface SchedulePreviewTabProps {
    activeTemplate: ScheduleTemplate | null;
    timeBlocks: TimeBlock[];
    overrides: SlotOverride[];
    doctorId: string;
}

type ViewMode = "month" | "week" | "day";

interface DayInfo {
    date: Date;
    dateStr: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    status: "working" | "off" | "leave" | "override" | "partial";
    slotCount: number;
    blockTitle?: string;
    overrideReason?: string;
}

export function SchedulePreviewTab({
    activeTemplate,
    timeBlocks,
    overrides,
}: SchedulePreviewTabProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("month");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const approvedBlocks = useMemo(
        () => timeBlocks.filter((b) => b.status === "APPROVED"),
        [timeBlocks]
    );

    // ─── Helper: get info for a single date ───
    const getDayInfo = useCallback((date: Date, isCurrentMonth: boolean): DayInfo => {
        const dateStr = date.toISOString().split("T")[0];
        const dayOfWeek = DAY_CODES[date.getDay()];
        const today = new Date();
        const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();

        // Check for time block
        const block = approvedBlocks.find((b) => dateStr >= b.start_date && dateStr <= b.end_date);
        if (block && block.is_full_day) {
            return { date, dateStr, isCurrentMonth, isToday, status: "leave", slotCount: 0, blockTitle: block.title };
        }

        // Check for override
        const override = overrides.find((o) => o.override_date === dateStr);
        if (override) {
            let count = 0;
            if (override.time_slots) {
                for (const ts of override.time_slots) {
                    count += computeSlotCount(
                        timeToMin(ts.start_time), timeToMin(ts.end_time),
                        ts.slot_duration_min, 0, []
                    );
                }
            }
            return { date, dateStr, isCurrentMonth, isToday, status: "override", slotCount: count, overrideReason: override.reason || undefined };
        }

        // Check template
        if (!activeTemplate?.days) {
            return { date, dateStr, isCurrentMonth, isToday, status: "off", slotCount: 0 };
        }

        const day = activeTemplate.days.find((d) => d.day_of_week === dayOfWeek);
        if (!day || !day.is_working_day) {
            return { date, dateStr, isCurrentMonth, isToday, status: "off", slotCount: 0 };
        }

        // Compute slots
        const dur = day.slot_duration_override || activeTemplate.slot_duration_min;
        const buf = day.buffer_time_override || activeTemplate.buffer_time_min;
        let count = 0;
        for (const ts of day.time_slots || []) {
            const breaks = (day.breaks || [])
                .filter((b) => b.time_slot_id === ts.time_slot_id)
                .map((b) => ({ startMin: timeToMin(b.start_time), endMin: timeToMin(b.end_time) }));
            count += computeSlotCount(timeToMin(ts.start_time), timeToMin(ts.end_time), ts.slot_duration_override || dur, buf, breaks);
        }

        // Check for partial block
        if (block && !block.is_full_day) {
            return { date, dateStr, isCurrentMonth, isToday, status: "partial", slotCount: Math.max(0, count - 3), blockTitle: block.title };
        }

        return { date, dateStr, isCurrentMonth, isToday, status: "working", slotCount: count };
    }, [approvedBlocks, overrides, activeTemplate]);

    // ─── Calendar Generation ───
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: DayInfo[] = [];

        // Fill from start of week
        const startPad = firstDay.getDay();
        for (let i = startPad - 1; i >= 0; i--) {
            const d = new Date(year, month, -i);
            days.push(getDayInfo(d, false));
        }

        // Days in month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(year, month, i);
            days.push(getDayInfo(d, true));
        }

        // Fill to end of week
        const remaining = 7 - (days.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) {
                const d = new Date(year, month + 1, i);
                days.push(getDayInfo(d, false));
            }
        }

        return days;
    }, [currentDate, getDayInfo]);

    // ─── Week View Days ───
    const weekDays = useMemo(() => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
        const days: DayInfo[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(d);
            date.setDate(d.getDate() + i);
            days.push(getDayInfo(date, true));
        }
        return days;
    }, [currentDate, getDayInfo]);

    // ─── Selected Day Detail ───
    const selectedDayInfo = useMemo(() => {
        if (!selectedDate) return null;
        const d = new Date(selectedDate + "T00:00:00");
        return getDayInfo(d, true);
    }, [selectedDate, getDayInfo]);

    const navigate = (delta: number) => {
        const d = new Date(currentDate);
        if (viewMode === "month") d.setMonth(d.getMonth() + delta);
        else if (viewMode === "week") d.setDate(d.getDate() + delta * 7);
        else d.setDate(d.getDate() + delta);
        setCurrentDate(d);
    };

    const goToday = () => setCurrentDate(new Date());

    const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "working": return "bg-emerald-500/20 border-emerald-500/30 text-emerald-400";
            case "off": return "bg-[var(--muted)]/30 border-[var(--border)] text-[var(--muted-foreground)]";
            case "leave": return "bg-red-500/15 border-red-500/20 text-red-400";
            case "override": return "bg-amber-500/15 border-amber-500/20 text-amber-400";
            case "partial": return "bg-blue-500/15 border-blue-500/20 text-blue-400";
            default: return "";
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case "working": return "bg-emerald-400";
            case "off": return "bg-gray-500";
            case "leave": return "bg-red-400";
            case "override": return "bg-amber-400";
            case "partial": return "bg-blue-400";
            default: return "bg-gray-400";
        }
    };

    return (
        <div className="space-y-4">
            {/* View Mode + Navigation */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--muted)]/30 border border-[var(--border)]">
                        {(["month", "week", "day"] as const).map((m) => (
                            <button key={m} onClick={() => setViewMode(m)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
                                    viewMode === m
                                        ? "bg-[var(--card)] shadow-sm text-[var(--foreground)]"
                                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                )}>
                                {m}
                            </button>
                        ))}
                    </div>
                    <Button size="sm" variant="outline" onClick={goToday} className="h-8 text-xs">Today</Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => navigate(-1)} className="h-8 w-8 p-0">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h3 className="font-semibold text-sm min-w-[140px] text-center">{monthLabel}</h3>
                    <Button size="sm" variant="ghost" onClick={() => navigate(1)} className="h-8 w-8 p-0">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap text-[10px]">
                {[
                    { label: "Available", dot: "bg-emerald-400" },
                    { label: "Not Working", dot: "bg-gray-500" },
                    { label: "Leave/Block", dot: "bg-red-400" },
                    { label: "Override", dot: "bg-amber-400" },
                    { label: "Partial", dot: "bg-blue-400" },
                ].map((l) => (
                    <span key={l.label} className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                        <span className={cn("w-2 h-2 rounded-full", l.dot)} /> {l.label}
                    </span>
                ))}
            </div>

            {/* ─── Month View ─── */}
            {viewMode === "month" && (
                <Card className="bg-[var(--card)]/40 overflow-hidden">
                    <div className="grid grid-cols-7">
                        {DAY_LABELS.map((d) => (
                            <div key={d} className="px-2 py-2.5 text-center text-[10px] font-semibold text-[var(--muted-foreground)] uppercase border-b border-[var(--border)]">
                                {d}
                            </div>
                        ))}
                        {calendarDays.map((day, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(day.dateStr)}
                                className={cn(
                                    "relative p-1.5 min-h-[70px] border-b border-r border-[var(--border)] text-left transition-colors hover:bg-[var(--muted)]/20",
                                    !day.isCurrentMonth && "opacity-40",
                                    selectedDate === day.dateStr && "ring-2 ring-[var(--primary)] ring-inset"
                                )}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={cn(
                                        "text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full",
                                        day.isToday && "bg-[var(--primary)] text-white"
                                    )}>
                                        {day.date.getDate()}
                                    </span>
                                    <span className={cn("w-1.5 h-1.5 rounded-full", getStatusDot(day.status))} />
                                </div>
                                {day.slotCount > 0 && (
                                    <p className="text-[9px] text-emerald-400 font-medium">{day.slotCount} slots</p>
                                )}
                                {day.status === "leave" && (
                                    <p className="text-[9px] text-red-400 truncate">{day.blockTitle}</p>
                                )}
                                {day.status === "override" && (
                                    <p className="text-[9px] text-amber-400 truncate">{day.overrideReason || "Override"}</p>
                                )}
                            </button>
                        ))}
                    </div>
                </Card>
            )}

            {/* ─── Week View ─── */}
            {viewMode === "week" && (
                <Card className="bg-[var(--card)]/40 overflow-hidden">
                    <div className="grid grid-cols-7 divide-x divide-[var(--border)]">
                        {weekDays.map((day, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(day.dateStr)}
                                className={cn(
                                    "p-3 text-center transition-colors hover:bg-[var(--muted)]/20 min-h-[180px] flex flex-col",
                                    selectedDate === day.dateStr && "ring-2 ring-[var(--primary)] ring-inset"
                                )}
                            >
                                <p className="text-[10px] uppercase text-[var(--muted-foreground)] font-semibold mb-1">
                                    {DAY_LABELS[day.date.getDay()]}
                                </p>
                                <p className={cn(
                                    "text-lg font-bold mb-2 w-8 h-8 flex items-center justify-center rounded-full mx-auto",
                                    day.isToday && "bg-[var(--primary)] text-white"
                                )}>
                                    {day.date.getDate()}
                                </p>
                                <div className={cn("flex-1 rounded-lg border p-2", getStatusColor(day.status))}>
                                    {day.slotCount > 0 && (
                                        <p className="text-xs font-semibold">{day.slotCount}</p>
                                    )}
                                    <p className="text-[10px] mt-0.5">
                                        {day.status === "working" ? "slots" :
                                            day.status === "leave" ? (day.blockTitle || "Leave") :
                                                day.status === "override" ? (day.overrideReason || "Override") :
                                                    day.status === "partial" ? "Partial" : "Off"}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>
            )}

            {/* ─── Day View ─── */}
            {viewMode === "day" && (
                <DayDetail dayInfo={getDayInfo(currentDate, true)} template={activeTemplate} overrides={overrides} timeBlocks={approvedBlocks} />
            )}

            {/* ─── Selected Date Detail Panel ─── */}
            {selectedDayInfo && viewMode !== "day" && (
                <Card className="p-4 bg-[var(--card)]/40 animate-fade-in-up">
                    <div className="flex items-center gap-2 mb-3">
                        <Eye className="w-4 h-4 text-[var(--primary)]" />
                        <h4 className="font-semibold text-sm">
                            {selectedDayInfo.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                        </h4>
                        <span className={cn("w-2 h-2 rounded-full", getStatusDot(selectedDayInfo.status))} />
                        <Badge variant="outline" className="text-[10px] capitalize">{selectedDayInfo.status}</Badge>
                    </div>
                    <DayDetail dayInfo={selectedDayInfo} template={activeTemplate} overrides={overrides} timeBlocks={approvedBlocks} />
                </Card>
            )}
        </div>
    );
}

// ─── Day Detail Component ───
function DayDetail({
    dayInfo,
    template,
    overrides,
    timeBlocks,
}: {
    dayInfo: DayInfo;
    template: ScheduleTemplate | null;
    overrides: SlotOverride[];
    timeBlocks: TimeBlock[];
}) {
    const dayCode = DAY_CODES[dayInfo.date.getDay()];
    const override = overrides.find((o) => o.override_date === dayInfo.dateStr);
    const block = timeBlocks.find((b) => dayInfo.dateStr >= b.start_date && dayInfo.dateStr <= b.end_date);
    const templateDay = template?.days?.find((d) => d.day_of_week === dayCode);

    if (dayInfo.status === "leave" && block) {
        return (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/10">
                <Calendar className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-red-400">{block.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{block.block_type} · Full Day</p>
                    {block.reason && <p className="text-xs text-[var(--muted-foreground)] mt-1">{block.reason}</p>}
                </div>
            </div>
        );
    }

    if (dayInfo.status === "off") {
        return (
            <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                Not a working day
            </div>
        );
    }

    // Get time slots to display (from override or template)
    const slotsToShow = override
        ? (override.time_slots || []).map((ts) => ({
            label: `${ts.start_time.slice(0, 5)} – ${ts.end_time.slice(0, 5)}`,
            type: ts.slot_type,
            duration: ts.slot_duration_min,
            count: computeSlotCount(timeToMin(ts.start_time), timeToMin(ts.end_time), ts.slot_duration_min, 0, []),
        }))
        : (templateDay?.time_slots || []).map((ts) => {
            const dur = ts.slot_duration_override || templateDay?.slot_duration_override || template?.slot_duration_min || 15;
            const buf = templateDay?.buffer_time_override || template?.buffer_time_min || 0;
            const breaks = (templateDay?.breaks || [])
                .filter((b) => b.time_slot_id === ts.time_slot_id)
                .map((b) => ({ startMin: timeToMin(b.start_time), endMin: timeToMin(b.end_time) }));
            return {
                label: `${ts.start_time.slice(0, 5)} – ${ts.end_time.slice(0, 5)}`,
                type: ts.slot_type,
                duration: dur,
                count: computeSlotCount(timeToMin(ts.start_time), timeToMin(ts.end_time), dur, buf, breaks),
            };
        });

    return (
        <div className="space-y-2">
            {override && (
                <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">Override: {override.override_behavior}</Badge>
                    {override.reason && <span>{override.reason}</span>}
                </div>
            )}
            {slotsToShow.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No time slots configured</p>
            ) : (
                slotsToShow.map((slot, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <div className="w-1 h-8 rounded-full bg-emerald-400" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">{slot.label}</p>
                            <p className="text-[10px] text-[var(--muted-foreground)]">
                                {slot.type} · {slot.duration}min slots · {slot.count} total
                            </p>
                        </div>
                        <span className="text-lg font-bold text-emerald-400">{slot.count}</span>
                    </div>
                ))
            )}
            {block && !block.is_full_day && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs">
                    <span className="w-1 h-6 rounded-full bg-blue-400" />
                    <span className="text-blue-400">Partial block: {block.title} ({block.start_time?.slice(0, 5)} – {block.end_time?.slice(0, 5)})</span>
                </div>
            )}
        </div>
    );
}
