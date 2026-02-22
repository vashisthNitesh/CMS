import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", ring: "ring-blue-500/10" },
    violet: { bg: "bg-violet-500/10", text: "text-violet-400", ring: "ring-violet-500/10" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", ring: "ring-emerald-500/10" },
    red: { bg: "bg-red-500/10", text: "text-red-400", ring: "ring-red-500/10" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", ring: "ring-amber-500/10" },
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", ring: "ring-indigo-500/10" },
    slate: { bg: "bg-slate-500/10", text: "text-slate-400", ring: "ring-slate-500/10" },
};

interface StatsCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color?: string;
    trend?: string;
    className?: string;
}

export function StatsCard({ icon, label, value, color = "blue", trend, className }: StatsCardProps) {
    const c = colorMap[color] || colorMap.blue;

    return (
        <Card className={cn("p-4 hover-lift transition-all duration-300", className)}>
            <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", c.bg, c.text)}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider font-medium truncate">{label}</p>
                </div>
                {trend && (
                    <span className="ml-auto text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
        </Card>
    );
}
