import { cn } from "@/lib/utils";
import Link from "next/link";

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
    className?: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
            <div className="w-16 h-16 rounded-2xl bg-[var(--muted)]/50 flex items-center justify-center text-[var(--muted-foreground)] mb-4 opacity-40">
                {icon}
            </div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">{title}</p>
            {description && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1 max-w-xs opacity-60">{description}</p>
            )}
            {actionLabel && actionHref && (
                <Link
                    href={actionHref}
                    className="mt-4 px-4 py-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors"
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
