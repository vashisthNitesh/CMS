"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Trash2, AlertCircle, ArrowLeftRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SlotOverride } from "@/lib/types";

interface SlotOverridesTabProps {
    overrides: SlotOverride[];
    doctorId: string;
    isAdmin: boolean;
    onRefresh: () => Promise<void>;
}

export function SlotOverridesTab({
    overrides,
    doctorId,
    isAdmin,
    onRefresh,
}: SlotOverridesTabProps) {
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formDate, setFormDate] = useState("");
    const [formReason, setFormReason] = useState("");
    const [formBehavior, setFormBehavior] = useState<"REPLACE" | "ADD">("REPLACE");
    const [formSlots, setFormSlots] = useState([
        { start_time: "09:00", end_time: "13:00", slot_type: "CONSULTATION", slot_duration_min: 15 },
    ]);

    const handleCreate = async () => {
        if (!formDate || formSlots.length === 0) return;
        startTransition(async () => {
            const { createOverride } = await import("@/actions/slot-overrides");
            const result = await createOverride({
                doctor_id: doctorId,
                override_date: formDate,
                reason: formReason || undefined,
                override_behavior: formBehavior,
                time_slots: formSlots,
            });
            if (result.success) {
                resetForm();
                setShowForm(false);
                await onRefresh();
            }
        });
    };

    const handleDelete = async (overrideId: string) => {
        startTransition(async () => {
            const { deleteOverride } = await import("@/actions/slot-overrides");
            await deleteOverride(overrideId);
            await onRefresh();
        });
    };

    const addSlot = () => {
        setFormSlots([
            ...formSlots,
            { start_time: "14:00", end_time: "18:00", slot_type: "CONSULTATION", slot_duration_min: 15 },
        ]);
    };

    const removeSlot = (idx: number) => {
        setFormSlots(formSlots.filter((_, i) => i !== idx));
    };

    const updateSlot = (idx: number, field: string, value: string | number) => {
        setFormSlots(formSlots.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
    };

    const resetForm = () => {
        setFormDate("");
        setFormReason("");
        setFormBehavior("REPLACE");
        setFormSlots([{ start_time: "09:00", end_time: "13:00", slot_type: "CONSULTATION", slot_duration_min: 15 }]);
    };

    const formatDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    const isPastDate = (d: string) => new Date(d) < new Date(new Date().toISOString().split("T")[0]);

    if (!isAdmin) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--info)]/10 border border-[var(--info)]/20">
                    <AlertCircle className="w-5 h-5 text-[var(--info)] flex-shrink-0" />
                    <p className="text-sm text-[var(--info)]">
                        Only clinic admins can create and manage slot overrides. Below are the overrides that affect your schedule.
                    </p>
                </div>
                {overrides.length === 0 ? (
                    <Card className="p-8 text-center bg-[var(--card)]/40">
                        <Layers className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]" />
                        <h3 className="text-sm font-semibold">No Overrides</h3>
                        <p className="text-xs text-[var(--muted-foreground)]">No custom schedules have been applied.</p>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {overrides.map((o) => (
                            <OverrideCard key={o.override_id} override={o} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted-foreground)]">
                    Override the weekly schedule on specific dates with custom hours.
                </p>
                <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    New Override
                </Button>
            </div>

            {/* Create Form */}
            {showForm && (
                <Card className="p-5 bg-[var(--card)]/40 space-y-4 animate-fade-in-up">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[var(--primary)]" />
                        New Slot Override
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Override Date</label>
                            <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)] outline-none focus:border-[var(--primary)]" />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Reason (optional)</label>
                            <input type="text" value={formReason} onChange={(e) => setFormReason(e.target.value)} placeholder="e.g. Extended hours for camp"
                                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)]" />
                        </div>
                    </div>

                    {/* Behavior Toggle */}
                    <div>
                        <label className="text-xs text-[var(--muted-foreground)] mb-2 block">Override Behavior</label>
                        <div className="flex gap-2">
                            {(["REPLACE", "ADD"] as const).map((b) => (
                                <button key={b} onClick={() => setFormBehavior(b)}
                                    className={cn(
                                        "flex-1 p-3 rounded-lg border text-left transition-all",
                                        formBehavior === b
                                            ? "border-[var(--primary)] bg-[var(--primary)]/5"
                                            : "border-[var(--border)] hover:bg-[var(--muted)]/30"
                                    )}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {b === "REPLACE" ? <ArrowLeftRight className="w-3.5 h-3.5 text-[var(--primary)]" /> : <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />}
                                        <span className="text-xs font-semibold">{b === "REPLACE" ? "Replace" : "Add"}</span>
                                    </div>
                                    <p className="text-[10px] text-[var(--muted-foreground)]">
                                        {b === "REPLACE" ? "Replace the weekly schedule for this date" : "Add extra slots on top of the weekly schedule"}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-2">
                        <label className="text-xs text-[var(--muted-foreground)] block">Time Slots</label>
                        {formSlots.map((slot, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--muted)]/20 border border-[var(--border)]">
                                <input type="time" value={slot.start_time} onChange={(e) => updateSlot(idx, "start_time", e.target.value)}
                                    className="px-2 py-1 text-sm rounded bg-[var(--background)] border border-[var(--border)] w-28" />
                                <span className="text-xs text-[var(--muted-foreground)]">to</span>
                                <input type="time" value={slot.end_time} onChange={(e) => updateSlot(idx, "end_time", e.target.value)}
                                    className="px-2 py-1 text-sm rounded bg-[var(--background)] border border-[var(--border)] w-28" />
                                <select value={slot.slot_type} onChange={(e) => updateSlot(idx, "slot_type", e.target.value)}
                                    className="px-2 py-1 text-xs rounded bg-[var(--background)] border border-[var(--border)]">
                                    <option value="CONSULTATION">Consultation</option>
                                    <option value="PROCEDURE">Procedure</option>
                                    <option value="EMERGENCY">Emergency</option>
                                </select>
                                <select value={slot.slot_duration_min} onChange={(e) => updateSlot(idx, "slot_duration_min", Number(e.target.value))}
                                    className="px-2 py-1 text-xs rounded bg-[var(--background)] border border-[var(--border)]">
                                    {[10, 15, 20, 30, 45, 60].map((d) => <option key={d} value={d}>{d}min</option>)}
                                </select>
                                {formSlots.length > 1 && (
                                    <button onClick={() => removeSlot(idx)} className="p-1 text-red-400 hover:bg-red-500/10 rounded">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button onClick={addSlot}
                            className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
                            <Plus className="w-3 h-3" /> Add another slot
                        </button>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button onClick={handleCreate} disabled={isPending || !formDate} className="flex-1">
                            {isPending ? "Creating..." : "Create Override"}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
                    </div>
                </Card>
            )}

            {/* Override List */}
            {overrides.length === 0 && !showForm ? (
                <Card className="p-8 text-center bg-[var(--card)]/40">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]" />
                    <h3 className="text-sm font-semibold mb-1">No Overrides</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">Create an override to customize the schedule on a specific date.</p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {overrides.map((o, i) => (
                        <Card key={o.override_id}
                            className={cn("p-4 bg-[var(--card)]/40 animate-fade-in-up", isPastDate(o.override_date) && "opacity-50")}
                            style={{ animationDelay: `${i * 30}ms` }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-sm">{formatDate(o.override_date)}</h4>
                                        <Badge variant={o.override_behavior === "REPLACE" ? "default" : "secondary"} className="text-[10px] h-4">
                                            {o.override_behavior}
                                        </Badge>
                                        {isPastDate(o.override_date) && <Badge variant="outline" className="text-[10px] h-4">Past</Badge>}
                                    </div>
                                    {o.reason && <p className="text-xs text-[var(--muted-foreground)] mb-2">{o.reason}</p>}
                                    <div className="flex flex-wrap gap-2">
                                        {o.time_slots?.map((ts, idx) => (
                                            <span key={idx} className="flex items-center gap-1 text-xs bg-[var(--primary)]/5 border border-[var(--primary)]/10 px-2 py-0.5 rounded-md">
                                                <Clock className="w-3 h-3 text-[var(--primary)]" />
                                                {ts.start_time.slice(0, 5)} – {ts.end_time.slice(0, 5)}
                                                <span className="text-[10px] text-[var(--muted-foreground)]">({ts.slot_duration_min}min)</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {isAdmin && !isPastDate(o.override_date) && (
                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(o.override_id)}
                                        disabled={isPending} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function OverrideCard({ override }: { override: SlotOverride }) {
    const formatDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    return (
        <Card className="p-3 bg-[var(--card)]/40">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{formatDate(override.override_date)}</span>
                <Badge variant="outline" className="text-[10px] h-4">{override.override_behavior}</Badge>
            </div>
            {override.reason && <p className="text-xs text-[var(--muted-foreground)]">{override.reason}</p>}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
                {override.time_slots?.map((ts, i) => (
                    <span key={i} className="text-[10px] bg-[var(--muted)]/40 px-1.5 py-0.5 rounded">
                        {ts.start_time.slice(0, 5)}–{ts.end_time.slice(0, 5)}
                    </span>
                ))}
            </div>
        </Card>
    );
}
