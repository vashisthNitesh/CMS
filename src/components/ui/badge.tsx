import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300",
    {
        variants: {
            variant: {
                default: "border-transparent bg-[var(--primary)]/10 text-[var(--primary)]",
                secondary: "border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)]",
                destructive: "border-transparent bg-[var(--destructive)]/10 text-[var(--destructive)]",
                outline: "border-[var(--border)] text-[var(--muted-foreground)]",
                success: "border-transparent bg-emerald-500/10 text-emerald-400",
                warning: "border-transparent bg-amber-500/10 text-amber-400",
                info: "border-transparent bg-sky-500/10 text-sky-400",
                // Clinical status variants
                scheduled: "border-transparent bg-blue-500/10 text-blue-400",
                checked_in: "border-transparent bg-cyan-500/10 text-cyan-400",
                in_consultation: "border-transparent bg-violet-500/10 text-violet-400",
                completed: "border-transparent bg-emerald-500/10 text-emerald-400",
                cancelled: "border-transparent bg-red-500/10 text-red-400",
                no_show: "border-transparent bg-amber-500/10 text-amber-400",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

function getStatusVariant(status: string): BadgeProps["variant"] {
    const map: Record<string, BadgeProps["variant"]> = {
        SCHEDULED: "scheduled",
        CHECKED_IN: "checked_in",
        IN_CONSULTATION: "in_consultation",
        COMPLETED: "completed",
        CANCELLED_BY_PATIENT: "cancelled",
        CANCELLED_BY_CLINIC: "cancelled",
        CANCELLED_BY_SYSTEM: "cancelled",
        NO_SHOW: "no_show",
    };
    return map[status] || "default";
}

export { Badge, badgeVariants, getStatusVariant };
