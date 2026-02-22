import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
    // Appointment statuses
    SCHEDULED: { label: "Scheduled", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    CHECKED_IN: { label: "Checked In", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    IN_CONSULTATION: { label: "In Consultation", className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    COMPLETED: { label: "Completed", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    CANCELLED: { label: "Cancelled", className: "bg-red-500/10 text-red-400 border-red-500/20" },
    CANCELLED_BY_CLINIC: { label: "Cancelled", className: "bg-red-500/10 text-red-400 border-red-500/20" },
    CANCELLED_BY_PATIENT: { label: "Cancelled", className: "bg-red-500/10 text-red-400 border-red-500/20" },
    NO_SHOW: { label: "No Show", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
    // Slot statuses
    AVAILABLE: { label: "Available", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    BOOKED: { label: "Booked", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    BLOCKED: { label: "Blocked", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
    // Invoice statuses
    PAID: { label: "Paid", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    UNPAID: { label: "Unpaid", className: "bg-red-500/10 text-red-400 border-red-500/20" },
    PARTIAL: { label: "Partial", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    OVERDUE: { label: "Overdue", className: "bg-red-500/10 text-red-300 border-red-500/30" },
    // User statuses
    active: { label: "Active", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    inactive: { label: "Inactive", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status] || {
        label: status.replace(/_/g, " "),
        className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border uppercase tracking-wider",
                config.className,
                className
            )}
        >
            {config.label}
        </span>
    );
}
