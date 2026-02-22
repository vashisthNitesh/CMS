import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, icon, actions, className }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up", className)}>
            <div className="flex items-start gap-3">
                {icon && (
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {icon}
                    </div>
                )}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-[var(--muted-foreground)] mt-1 text-sm">{description}</p>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
    );
}
