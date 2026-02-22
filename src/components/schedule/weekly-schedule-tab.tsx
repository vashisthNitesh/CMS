"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus, Trash2, Copy, Clock,
    Coffee, AlertCircle, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { computeSlotCount, timeToMin } from "@/lib/schedule-utils";
import type { ScheduleTemplate, TemplateDay } from "@/lib/types";

const DAYS = [
    { code: "MON", label: "Monday", short: "Mon" },
    { code: "TUE", label: "Tuesday", short: "Tue" },
    { code: "WED", label: "Wednesday", short: "Wed" },
    { code: "THU", label: "Thursday", short: "Thu" },
    { code: "FRI", label: "Friday", short: "Fri" },
    { code: "SAT", label: "Saturday", short: "Sat" },
    { code: "SUN", label: "Sunday", short: "Sun" },
] as const;


interface WeeklyScheduleTabProps {
    templates: ScheduleTemplate[];
    activeTemplate: ScheduleTemplate | null;
    doctorId: string;
    isReadOnly: boolean;
    onRefresh: () => Promise<void>;
}

export function WeeklyScheduleTab({
    templates,
    activeTemplate,
    doctorId,
    isReadOnly,
    onRefresh,
}: WeeklyScheduleTabProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showSlotForm, setShowSlotForm] = useState<string | null>(null); // day_id
    const [showBreakForm, setShowBreakForm] = useState<string | null>(null); // time_slot_id
    const [isPending, startTransition] = useTransition();

    // Form states
    const [newTemplateName, setNewTemplateName] = useState("");
    const [newSlotDuration, setNewSlotDuration] = useState(15);
    const [newBufferTime, setNewBufferTime] = useState(0);
    const [newEffectiveFrom, setNewEffectiveFrom] = useState(
        new Date().toISOString().split("T")[0]
    );

    const template = activeTemplate;

    // Slot form state
    const [slotStart, setSlotStart] = useState("09:00");
    const [slotEnd, setSlotEnd] = useState("13:00");
    const [slotType, setSlotType] = useState("CONSULTATION");

    // Break form state
    const [breakStart, setBreakStart] = useState("13:00");
    const [breakEnd, setBreakEnd] = useState("14:00");
    const [breakType, setBreakType] = useState("LUNCH");
    const [breakLabel, setBreakLabel] = useState("");


    const handleCreateTemplate = async () => {
        if (!newTemplateName.trim()) return;
        startTransition(async () => {
            const { createTemplate, activateTemplate } = await import(
                "@/actions/schedule-templates"
            );
            const result = await createTemplate({
                doctor_id: doctorId,
                template_name: newTemplateName,
                slot_duration_min: newSlotDuration,
                buffer_time_min: newBufferTime,
                effective_from: newEffectiveFrom,
            });
            if (result.success && result.template) {
                await activateTemplate(result.template.template_id);
            }
            setShowCreateForm(false);
            setNewTemplateName("");
            await onRefresh();
        });
    };

    const handleActivate = async (templateId: string) => {
        startTransition(async () => {
            const { activateTemplate } = await import("@/actions/schedule-templates");
            await activateTemplate(templateId);
            await onRefresh();
        });
    };

    const handleDuplicateTemplate = async () => {
        if (!template) return;
        startTransition(async () => {
            const { createTemplate } = await import("@/actions/schedule-templates");
            await createTemplate({
                doctor_id: doctorId,
                template_name: `${template.template_name} (Copy)`,
                slot_duration_min: template.slot_duration_min,
                buffer_time_min: template.buffer_time_min,
                effective_from: new Date().toISOString().split("T")[0],
                copy_from_template_id: template.template_id,
            });
            await onRefresh();
        });
    };

    const handleToggleDay = async (day: TemplateDay) => {
        startTransition(async () => {
            const { saveTemplateDay } = await import("@/actions/schedule-templates");
            await saveTemplateDay({
                day_id: day.day_id,
                is_working_day: !day.is_working_day,
                slot_duration_override: day.slot_duration_override,
                buffer_time_override: day.buffer_time_override,
                time_slots: (day.time_slots || []).map((s) => ({
                    start_time: s.start_time,
                    end_time: s.end_time,
                    slot_type: s.slot_type,
                    slot_duration_override: s.slot_duration_override,
                    sort_order: s.sort_order,
                    breaks: (day.breaks || [])
                        .filter((b) => b.time_slot_id === s.time_slot_id)
                        .map((b) => ({
                            break_type: b.break_type,
                            start_time: b.start_time,
                            end_time: b.end_time,
                            label: b.label,
                        })),
                })),
            });
            await onRefresh();
        });
    };

    const handleAddSlot = async (dayId: string) => {
        const day = template?.days?.find((d) => d.day_id === dayId);
        if (!day) return;

        const existingSlots = day.time_slots || [];
        if (existingSlots.length >= 3) return;

        startTransition(async () => {
            const { saveTemplateDay } = await import("@/actions/schedule-templates");
            const newSlots = [
                ...existingSlots.map((s) => ({
                    start_time: s.start_time,
                    end_time: s.end_time,
                    slot_type: s.slot_type,
                    slot_duration_override: s.slot_duration_override,
                    sort_order: s.sort_order,
                    breaks: (day.breaks || [])
                        .filter((b) => b.time_slot_id === s.time_slot_id)
                        .map((b) => ({
                            break_type: b.break_type,
                            start_time: b.start_time,
                            end_time: b.end_time,
                            label: b.label,
                        })),
                })),
                {
                    start_time: slotStart,
                    end_time: slotEnd,
                    slot_type: slotType,
                    slot_duration_override: null,
                    sort_order: existingSlots.length,
                    breaks: [] as { break_type: string; start_time: string; end_time: string; label?: string }[],
                },
            ];

            await saveTemplateDay({
                day_id: dayId,
                is_working_day: true,
                slot_duration_override: day.slot_duration_override,
                buffer_time_override: day.buffer_time_override,
                time_slots: newSlots,
            });

            setShowSlotForm(null);
            setSlotStart("09:00");
            setSlotEnd("13:00");
            setSlotType("CONSULTATION");
            await onRefresh();
        });
    };

    const handleRemoveSlot = async (day: TemplateDay, slotId: string) => {
        startTransition(async () => {
            const { saveTemplateDay } = await import("@/actions/schedule-templates");
            const remaining = (day.time_slots || []).filter((s) => s.time_slot_id !== slotId);
            await saveTemplateDay({
                day_id: day.day_id,
                is_working_day: remaining.length > 0,
                slot_duration_override: day.slot_duration_override,
                buffer_time_override: day.buffer_time_override,
                time_slots: remaining.map((s, i) => ({
                    start_time: s.start_time,
                    end_time: s.end_time,
                    slot_type: s.slot_type,
                    slot_duration_override: s.slot_duration_override,
                    sort_order: i,
                    breaks: (day.breaks || [])
                        .filter((b) => b.time_slot_id === s.time_slot_id)
                        .map((b) => ({
                            break_type: b.break_type,
                            start_time: b.start_time,
                            end_time: b.end_time,
                            label: b.label,
                        })),
                })),
            });
            await onRefresh();
        });
    };

    const handleAddBreak = async (dayId: string, timeSlotId: string) => {
        const day = template?.days?.find((d) => d.day_id === dayId);
        if (!day) return;

        const totalBreaks = (day.breaks || []).length;
        if (totalBreaks >= 2) return;

        startTransition(async () => {
            const { saveTemplateDay } = await import("@/actions/schedule-templates");
            await saveTemplateDay({
                day_id: dayId,
                is_working_day: true,
                slot_duration_override: day.slot_duration_override,
                buffer_time_override: day.buffer_time_override,
                time_slots: (day.time_slots || []).map((s) => ({
                    start_time: s.start_time,
                    end_time: s.end_time,
                    slot_type: s.slot_type,
                    slot_duration_override: s.slot_duration_override,
                    sort_order: s.sort_order,
                    breaks: [
                        ...(day.breaks || [])
                            .filter((b) => b.time_slot_id === s.time_slot_id)
                            .map((b) => ({
                                break_type: b.break_type,
                                start_time: b.start_time,
                                end_time: b.end_time,
                                label: b.label,
                            })),
                        ...(s.time_slot_id === timeSlotId
                            ? [{ break_type: breakType, start_time: breakStart, end_time: breakEnd, label: breakLabel || undefined }]
                            : []),
                    ],
                })),
            });
            setShowBreakForm(null);
            setBreakStart("13:00");
            setBreakEnd("14:00");
            setBreakType("LUNCH");
            setBreakLabel("");
            await onRefresh();
        });
    };

    const getDaySlotCount = (day: TemplateDay): number => {
        if (!day.is_working_day || !day.time_slots?.length) return 0;
        const dur = day.slot_duration_override || template?.slot_duration_min || 15;
        const buf = day.buffer_time_override || template?.buffer_time_min || 0;
        let total = 0;
        for (const slot of day.time_slots) {
            const breaks = (day.breaks || [])
                .filter((b) => b.time_slot_id === slot.time_slot_id)
                .map((b) => ({ startMin: timeToMin(b.start_time), endMin: timeToMin(b.end_time) }));
            total += computeSlotCount(
                timeToMin(slot.start_time),
                timeToMin(slot.end_time),
                slot.slot_duration_override || dur,
                buf,
                breaks
            );
        }
        return total;
    };

    // ─── Read-Only Banner ───
    if (isReadOnly && template) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--info)]/10 border border-[var(--info)]/20">
                    <Info className="w-5 h-5 text-[var(--info)] flex-shrink-0" />
                    <p className="text-sm text-[var(--info)]">
                        This is a read-only view of the weekly schedule. To request changes, contact your clinic admin.
                    </p>
                </div>
                {/* Read-only day cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                    {DAYS.map((d) => {
                        const day = template.days?.find((td) => td.day_of_week === d.code);
                        const slotCount = day ? getDaySlotCount(day) : 0;
                        return (
                            <Card key={d.code} className="p-3 bg-[var(--card)]/40">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold">{d.short}</span>
                                    <Badge variant={day?.is_working_day ? "default" : "secondary"} className="text-[10px]">
                                        {day?.is_working_day ? "Working" : "Off"}
                                    </Badge>
                                </div>
                                {day?.is_working_day && day.time_slots?.map((slot) => (
                                    <div key={slot.time_slot_id} className="text-xs text-[var(--muted-foreground)] mb-1">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                                    </div>
                                ))}
                                {day?.is_working_day && (
                                    <p className="text-[10px] text-[var(--primary)] mt-2 font-medium">{slotCount} slots</p>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ─── Empty State ───
    if (!template) {
        return (
            <div className="space-y-4">
                <Card className="p-8 text-center bg-[var(--card)]/40">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[var(--muted-foreground)]" />
                    <h3 className="text-lg font-semibold mb-2">No Active Schedule Template</h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
                        Create a schedule template to define working hours and enable appointment bookings for this doctor.
                    </p>
                    {!showCreateForm ? (
                        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Template
                        </Button>
                    ) : (
                        <CreateTemplateForm
                            name={newTemplateName}
                            setName={setNewTemplateName}
                            duration={newSlotDuration}
                            setDuration={setNewSlotDuration}
                            buffer={newBufferTime}
                            setBuffer={setNewBufferTime}
                            effectiveFrom={newEffectiveFrom}
                            setEffectiveFrom={setNewEffectiveFrom}
                            onSubmit={handleCreateTemplate}
                            onCancel={() => setShowCreateForm(false)}
                            isPending={isPending}
                        />
                    )}
                </Card>
                {templates.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm text-[var(--muted-foreground)]">Or activate an existing template:</p>
                        {templates.map((t) => (
                            <Card key={t.template_id} className="p-3 flex items-center justify-between bg-[var(--card)]/40">
                                <div>
                                    <p className="font-medium text-sm">{t.template_name}</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">{t.slot_duration_min}min slots</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleActivate(t.template_id)}>
                                    Activate
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ─── Main Template View ───
    return (
        <div className="space-y-4">
            {/* Template management strip */}
            <Card className="p-4 bg-[var(--card)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{template.template_name}</h3>
                            <Badge variant="default" className="text-[10px]">Active</Badge>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            {template.slot_duration_min}min slots · {template.buffer_time_min}min buffer
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" onClick={handleDuplicateTemplate} disabled={isPending} title="Duplicate">
                        <Copy className="w-3.5 h-3.5" />
                    </Button>
                    {!showCreateForm ? (
                        <Button size="sm" variant="outline" onClick={() => setShowCreateForm(true)} className="gap-1.5">
                            <Plus className="w-3.5 h-3.5" />
                            New Template
                        </Button>
                    ) : null}
                </div>
            </Card>

            {showCreateForm && (
                <Card className="p-4 bg-[var(--card)]/40">
                    <CreateTemplateForm
                        name={newTemplateName}
                        setName={setNewTemplateName}
                        duration={newSlotDuration}
                        setDuration={setNewSlotDuration}
                        buffer={newBufferTime}
                        setBuffer={setNewBufferTime}
                        effectiveFrom={newEffectiveFrom}
                        setEffectiveFrom={setNewEffectiveFrom}
                        onSubmit={handleCreateTemplate}
                        onCancel={() => setShowCreateForm(false)}
                        isPending={isPending}
                    />
                </Card>
            )}

            {/* Global Slot Settings */}
            <div className="flex items-center gap-4 px-1">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Slot Duration:</label>
                    <span className="text-sm font-semibold">{template.slot_duration_min} min</span>
                </div>
                <div className="w-px h-4 bg-[var(--border)]" />
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Buffer:</label>
                    <span className="text-sm font-semibold">{template.buffer_time_min} min</span>
                </div>
            </div>

            {/* Day Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {DAYS.map((d, i) => {
                    const day = template.days?.find((td) => td.day_of_week === d.code);
                    if (!day) return null;
                    const slotCount = getDaySlotCount(day);

                    return (
                        <Card
                            key={d.code}
                            className={cn(
                                "flex flex-col bg-[var(--card)]/40 hover:bg-[var(--card)]/60 transition-all animate-fade-in-up overflow-hidden",
                                day.is_working_day ? "border-[var(--primary)]/20" : "opacity-60"
                            )}
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            {/* Day Header */}
                            <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
                                <span className="font-semibold text-sm">{d.short}</span>
                                <button
                                    onClick={() => handleToggleDay(day)}
                                    disabled={isPending}
                                    className={cn(
                                        "w-9 h-5 rounded-full relative transition-colors",
                                        day.is_working_day ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
                                    )}
                                >
                                    <span className={cn(
                                        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                                        day.is_working_day ? "translate-x-4" : "translate-x-0.5"
                                    )} />
                                </button>
                            </div>

                            {/* Day Body */}
                            <div className="flex-1 p-2.5 space-y-1.5 min-h-[80px]">
                                {!day.is_working_day ? (
                                    <p className="text-xs text-[var(--muted-foreground)] text-center py-4">Not Working</p>
                                ) : (
                                    <>
                                        {(day.time_slots || []).map((slot) => {
                                            const slotBreaks = (day.breaks || []).filter(
                                                (b) => b.time_slot_id === slot.time_slot_id
                                            );
                                            return (
                                                <div key={slot.time_slot_id} className="space-y-1">
                                                    {/* Time Slot Block */}
                                                    <div className="group p-2 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/10 relative">
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <Clock className="w-3 h-3 text-[var(--primary)]" />
                                                            <span className="font-medium">
                                                                {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                                                            </span>
                                                        </div>
                                                        <Badge variant="outline" className="text-[8px] h-4 px-1 mt-1">
                                                            {slot.slot_type}
                                                        </Badge>
                                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                                                            <button
                                                                onClick={() => handleRemoveSlot(day, slot.time_slot_id)}
                                                                className="p-0.5 rounded hover:bg-red-500/10 text-red-400"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Break Blocks */}
                                                    {slotBreaks.map((brk) => (
                                                        <div
                                                            key={brk.break_id}
                                                            className="group p-1.5 rounded-lg bg-[var(--warning)]/5 border border-[var(--warning)]/10 ml-2 relative"
                                                        >
                                                            <div className="flex items-center gap-1 text-[10px] text-[var(--warning)]">
                                                                <Coffee className="w-2.5 h-2.5" />
                                                                <span>{brk.label || brk.break_type}</span>
                                                            </div>
                                                            <p className="text-[10px] text-[var(--muted-foreground)] ml-3.5">
                                                                {brk.start_time.slice(0, 5)} – {brk.end_time.slice(0, 5)}
                                                            </p>
                                                        </div>
                                                    ))}

                                                    {/* Add Break button (within a time slot) */}
                                                    {(day.breaks || []).length < 2 && (
                                                        <>
                                                            {showBreakForm === slot.time_slot_id ? (
                                                                <div className="p-2 rounded-lg bg-[var(--muted)]/30 border border-[var(--border)] space-y-1.5 ml-2">
                                                                    <select
                                                                        value={breakType}
                                                                        onChange={(e) => setBreakType(e.target.value)}
                                                                        className="w-full text-[10px] px-1.5 py-1 rounded bg-[var(--background)] border border-[var(--border)]"
                                                                    >
                                                                        <option value="LUNCH">Lunch</option>
                                                                        <option value="TEA">Tea</option>
                                                                        <option value="MEETING">Meeting</option>
                                                                        <option value="OTHER">Other</option>
                                                                    </select>
                                                                    <div className="flex gap-1">
                                                                        <input type="time" value={breakStart} onChange={(e) => setBreakStart(e.target.value)}
                                                                            className="flex-1 text-[10px] px-1 py-0.5 rounded bg-[var(--background)] border border-[var(--border)]" />
                                                                        <input type="time" value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)}
                                                                            className="flex-1 text-[10px] px-1 py-0.5 rounded bg-[var(--background)] border border-[var(--border)]" />
                                                                    </div>
                                                                    <input type="text" value={breakLabel} onChange={(e) => setBreakLabel(e.target.value)} placeholder="Label (optional)"
                                                                        className="w-full text-[10px] px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--border)]" />
                                                                    <div className="flex gap-1">
                                                                        <Button size="sm" className="h-5 text-[10px] px-2 flex-1" disabled={isPending}
                                                                            onClick={() => handleAddBreak(day.day_id, slot.time_slot_id)}>Add</Button>
                                                                        <Button size="sm" variant="ghost" className="h-5 text-[10px] px-2"
                                                                            onClick={() => setShowBreakForm(null)}>×</Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setShowBreakForm(slot.time_slot_id)}
                                                                    className="ml-2 flex items-center gap-1 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--warning)] transition-colors"
                                                                >
                                                                    <Coffee className="w-2.5 h-2.5" />
                                                                    Add Break
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Add Time Slot */}
                                        {(day.time_slots || []).length < 3 && (
                                            <>
                                                {showSlotForm === day.day_id ? (
                                                    <div className="p-2 rounded-lg bg-[var(--muted)]/30 border border-[var(--border)] space-y-1.5">
                                                        <div className="flex gap-1">
                                                            <input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)}
                                                                className="flex-1 text-[10px] px-1 py-0.5 rounded bg-[var(--background)] border border-[var(--border)]" />
                                                            <input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)}
                                                                className="flex-1 text-[10px] px-1 py-0.5 rounded bg-[var(--background)] border border-[var(--border)]" />
                                                        </div>
                                                        <select value={slotType} onChange={(e) => setSlotType(e.target.value)}
                                                            className="w-full text-[10px] px-1.5 py-1 rounded bg-[var(--background)] border border-[var(--border)]">
                                                            <option value="CONSULTATION">Consultation</option>
                                                            <option value="PROCEDURE">Procedure</option>
                                                            <option value="EMERGENCY">Emergency</option>
                                                        </select>
                                                        <div className="flex gap-1">
                                                            <Button size="sm" className="h-5 text-[10px] px-2 flex-1" disabled={isPending}
                                                                onClick={() => handleAddSlot(day.day_id)}>Add</Button>
                                                            <Button size="sm" variant="ghost" className="h-5 text-[10px] px-2"
                                                                onClick={() => setShowSlotForm(null)}>×</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowSlotForm(day.day_id)}
                                                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-[var(--border)] text-[10px] text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Add Time Slot
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Slot Count Footer */}
                            {day.is_working_day && (
                                <div className="px-2.5 py-2 border-t border-[var(--border)] bg-[var(--primary)]/5">
                                    <p className="text-[10px] font-medium text-[var(--primary)]">
                                        {slotCount} appointment slot{slotCount !== 1 ? "s" : ""}
                                    </p>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Create Template Inline Form ───
function CreateTemplateForm({
    name, setName, duration, setDuration, buffer, setBuffer,
    effectiveFrom, setEffectiveFrom, onSubmit, onCancel, isPending,
}: {
    name: string; setName: (v: string) => void;
    duration: number; setDuration: (v: number) => void;
    buffer: number; setBuffer: (v: number) => void;
    effectiveFrom: string; setEffectiveFrom: (v: string) => void;
    onSubmit: () => void; onCancel: () => void; isPending: boolean;
}) {
    return (
        <div className="space-y-3 max-w-md mx-auto">
            <h4 className="font-semibold text-sm">New Schedule Template</h4>
            <div>
                <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Template Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Regular Hours"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)] outline-none focus:border-[var(--primary)]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Slot Duration</label>
                    <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)]">
                        {[10, 15, 20, 30, 45, 60].map((d) => <option key={d} value={d}>{d} min</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Buffer Time</label>
                    <select value={buffer} onChange={(e) => setBuffer(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)]">
                        {[0, 5, 10, 15, 20, 30].map((d) => <option key={d} value={d}>{d} min</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Effective From</label>
                <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)]" />
            </div>
            <div className="flex gap-2">
                <Button onClick={onSubmit} disabled={isPending || !name.trim()} className="flex-1">
                    {isPending ? "Creating..." : "Create & Activate"}
                </Button>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
        </div>
    );
}
