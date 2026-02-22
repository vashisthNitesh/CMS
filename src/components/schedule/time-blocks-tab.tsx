"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus, Calendar, Clock, AlertTriangle, CheckCircle2,
    XCircle, Ban, Palmtree, Users, Siren, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeBlock } from "@/lib/types";

const BLOCK_TYPE_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    LEAVE: { icon: Palmtree, color: "text-green-400", label: "Leave" },
    HOLIDAY: { icon: Calendar, color: "text-blue-400", label: "Holiday" },
    MEETING: { icon: Users, color: "text-purple-400", label: "Meeting" },
    EMERGENCY: { icon: Siren, color: "text-red-400", label: "Emergency" },
    PERSONAL: { icon: User, color: "text-amber-400", label: "Personal" },
};

const STATUS_META: Record<string, { color: string; label: string }> = {
    PENDING: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Pending" },
    APPROVED: { color: "bg-green-500/20 text-green-400 border-green-500/30", label: "Approved" },
    REJECTED: { color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Rejected" },
    CANCELLED: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", label: "Cancelled" },
};

interface TimeBlocksTabProps {
    timeBlocks: TimeBlock[];
    doctorId: string;
    isAdmin: boolean;
    isDoctor: boolean;
    userId: string;
    showCreateForm: boolean;
    onShowCreateForm: (v: boolean) => void;
    onRefresh: () => Promise<void>;
}

export function TimeBlocksTab({
    timeBlocks,
    doctorId,
    isAdmin,
    isDoctor,
    userId,
    showCreateForm,
    onShowCreateForm,
    onRefresh,
}: TimeBlocksTabProps) {
    const [isPending, startTransition] = useTransition();
    const [filter, setFilter] = useState<string>("ALL");

    // Form state
    const [formTitle, setFormTitle] = useState("");
    const [formType, setFormType] = useState("LEAVE");
    const [formReason, setFormReason] = useState("");
    const [formIsFullDay, setFormIsFullDay] = useState(true);
    const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [formEndDate, setFormEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [formStartTime, setFormStartTime] = useState("09:00");
    const [formEndTime, setFormEndTime] = useState("13:00");
    const [rejectBlockId, setRejectBlockId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const filtered = filter === "ALL"
        ? timeBlocks
        : timeBlocks.filter((b) => b.status === filter);

    const handleCreate = async () => {
        if (!formTitle.trim()) return;
        startTransition(async () => {
            const { createTimeBlock } = await import("@/actions/time-blocks");
            await createTimeBlock({
                doctor_id: doctorId,
                block_type: formType,
                title: formTitle,
                reason: formReason || undefined,
                is_full_day: formIsFullDay,
                start_date: formStartDate,
                end_date: formEndDate,
                start_time: !formIsFullDay ? formStartTime : undefined,
                end_time: !formIsFullDay ? formEndTime : undefined,
            });
            resetForm();
            onShowCreateForm(false);
            await onRefresh();
        });
    };

    const handleApprove = async (blockId: string) => {
        startTransition(async () => {
            const { approveTimeBlock } = await import("@/actions/time-blocks");
            await approveTimeBlock(blockId);
            await onRefresh();
        });
    };

    const handleReject = async () => {
        if (!rejectBlockId || !rejectReason.trim()) return;
        startTransition(async () => {
            const { rejectTimeBlock } = await import("@/actions/time-blocks");
            await rejectTimeBlock(rejectBlockId, rejectReason);
            setRejectBlockId(null);
            setRejectReason("");
            await onRefresh();
        });
    };

    const handleCancel = async (blockId: string) => {
        startTransition(async () => {
            const { cancelTimeBlock } = await import("@/actions/time-blocks");
            await cancelTimeBlock(blockId);
            await onRefresh();
        });
    };

    const handleWithdraw = async (blockId: string) => {
        startTransition(async () => {
            const { withdrawTimeBlock } = await import("@/actions/time-blocks");
            await withdrawTimeBlock(blockId);
            await onRefresh();
        });
    };

    const resetForm = () => {
        setFormTitle("");
        setFormType("LEAVE");
        setFormReason("");
        setFormIsFullDay(true);
        setFormStartDate(new Date().toISOString().split("T")[0]);
        setFormEndDate(new Date().toISOString().split("T")[0]);
        setFormStartTime("09:00");
        setFormEndTime("13:00");
    };

    const formatDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div className="space-y-4">
            {/* Filter + Create */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-[var(--muted)]/30 border border-[var(--border)]">
                    {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                filter === f
                                    ? "bg-[var(--card)] shadow-sm text-[var(--foreground)]"
                                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            )}
                        >
                            {f === "ALL" ? "All" : STATUS_META[f]?.label}
                        </button>
                    ))}
                </div>
                {(isAdmin || isDoctor) && (
                    <Button size="sm" onClick={() => onShowCreateForm(true)} className="gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        New Block
                    </Button>
                )}
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <Card className="p-5 bg-[var(--card)]/40 space-y-4 animate-fade-in-up">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[var(--primary)]" />
                        New Time Block
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Title</label>
                            <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Annual Leave"
                                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)] outline-none focus:border-[var(--primary)]" />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Block Type</label>
                            <select value={formType} onChange={(e) => setFormType(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)]">
                                <option value="LEAVE">Leave</option>
                                <option value="HOLIDAY">Holiday</option>
                                <option value="MEETING">Meeting</option>
                                <option value="EMERGENCY">Emergency</option>
                                <option value="PERSONAL">Personal</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Reason (optional)</label>
                        <textarea value={formReason} onChange={(e) => setFormReason(e.target.value)} placeholder="Reason for the block..."
                            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)] outline-none resize-none h-16" />
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-xs text-[var(--muted-foreground)]">Full Day</label>
                        <button onClick={() => setFormIsFullDay(!formIsFullDay)}
                            className={cn("w-9 h-5 rounded-full relative transition-colors", formIsFullDay ? "bg-[var(--primary)]" : "bg-[var(--muted)]")}>
                            <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform", formIsFullDay ? "translate-x-4" : "translate-x-0.5")} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Start Date</label>
                            <input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)]" />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted-foreground)] mb-1 block">End Date</label>
                            <input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)]" />
                        </div>
                    </div>

                    {!formIsFullDay && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Start Time</label>
                                <input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)]" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted-foreground)] mb-1 block">End Time</label>
                                <input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)]" />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button onClick={handleCreate} disabled={isPending || !formTitle.trim()} className="flex-1">
                            {isPending ? "Creating..." : "Create Block"}
                        </Button>
                        <Button variant="outline" onClick={() => { onShowCreateForm(false); resetForm(); }}>Cancel</Button>
                    </div>
                </Card>
            )}

            {/* Block List */}
            {filtered.length === 0 ? (
                <Card className="p-8 text-center bg-[var(--card)]/40">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]" />
                    <h3 className="text-sm font-semibold mb-1">No Time Blocks</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                        {filter === "ALL" ? "No blocks have been created yet." : `No ${filter.toLowerCase()} blocks.`}
                    </p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filtered.map((block, i) => {
                        const meta = BLOCK_TYPE_META[block.block_type] || BLOCK_TYPE_META.PERSONAL;
                        const statusMeta = STATUS_META[block.status] || STATUS_META.PENDING;
                        const Icon = meta.icon;

                        return (
                            <Card
                                key={block.block_id}
                                className="p-4 bg-[var(--card)]/40 hover:bg-[var(--card)]/60 transition-all animate-fade-in-up"
                                style={{ animationDelay: `${i * 30}ms` }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn("p-2 rounded-lg bg-[var(--muted)]/50 mt-0.5", meta.color)}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-sm truncate">{block.title}</h4>
                                            <span className={cn("px-2 py-0.5 text-[10px] font-medium rounded-full border", statusMeta.color)}>
                                                {statusMeta.label}
                                            </span>
                                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">{meta.label}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(block.start_date)}
                                                {block.start_date !== block.end_date && ` – ${formatDate(block.end_date)}`}
                                            </span>
                                            {!block.is_full_day && block.start_time && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {block.start_time.slice(0, 5)} – {block.end_time?.slice(0, 5)}
                                                </span>
                                            )}
                                            {block.is_full_day && <span>Full Day</span>}
                                        </div>
                                        {block.reason && (
                                            <p className="text-xs text-[var(--muted-foreground)] mt-1.5 truncate max-w-md">{block.reason}</p>
                                        )}
                                        {block.status === "REJECTED" && block.rejection_reason && (
                                            <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                {block.rejection_reason}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {isAdmin && block.status === "PENDING" && (
                                            <>
                                                <Button size="sm" variant="ghost" onClick={() => handleApprove(block.block_id)}
                                                    disabled={isPending} className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/10">
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                                    <span className="text-[11px]">Approve</span>
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setRejectBlockId(block.block_id)}
                                                    disabled={isPending} className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                                    <XCircle className="w-3.5 h-3.5 mr-1" />
                                                    <span className="text-[11px]">Reject</span>
                                                </Button>
                                            </>
                                        )}
                                        {isAdmin && block.status === "APPROVED" && (
                                            <Button size="sm" variant="ghost" onClick={() => handleCancel(block.block_id)}
                                                disabled={isPending} className="h-7 px-2 text-[var(--muted-foreground)]">
                                                <Ban className="w-3.5 h-3.5 mr-1" />
                                                <span className="text-[11px]">Cancel</span>
                                            </Button>
                                        )}
                                        {isDoctor && block.created_by === userId && block.status === "PENDING" && (
                                            <Button size="sm" variant="ghost" onClick={() => handleWithdraw(block.block_id)}
                                                disabled={isPending} className="h-7 px-2 text-[var(--muted-foreground)]">
                                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                                <span className="text-[11px]">Withdraw</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Reject Modal inline */}
                                {rejectBlockId === block.block_id && (
                                    <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10 space-y-2">
                                        <label className="text-xs text-red-400 font-medium">Rejection Reason</label>
                                        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="Provide a reason for rejection..."
                                            className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--border)] resize-none h-16"
                                            autoFocus />
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="destructive" onClick={handleReject} disabled={isPending || !rejectReason.trim()}>
                                                Confirm Reject
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => { setRejectBlockId(null); setRejectReason(""); }}>Cancel</Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
