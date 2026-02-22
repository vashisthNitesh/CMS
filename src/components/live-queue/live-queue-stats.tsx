"use client";

import { motion } from "framer-motion";
import { Users, Clock, CheckCircle, Stethoscope, AlertOctagon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QueueStats } from "@/hooks/use-live-queue";

interface LiveQueueStatsProps {
    stats: QueueStats;
}

export function LiveQueueStats({ stats }: LiveQueueStatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatChip
                label="Total Today"
                value={stats.total}
                icon={Users}
                color="bg-blue-500"
                textColor="text-blue-500"
                bgColor="bg-blue-500/10"
            />
            <StatChip
                label="Checked In"
                value={stats.checked_in}
                icon={Clock}
                color="bg-amber-500"
                textColor="text-amber-500"
                bgColor="bg-amber-500/10"
            />
            <StatChip
                label="In Consultation"
                value={stats.in_consultation}
                icon={Stethoscope}
                color="bg-indigo-500"
                textColor="text-indigo-500"
                bgColor="bg-indigo-500/10"
            />
            <StatChip
                label="Completed"
                value={stats.completed}
                icon={CheckCircle}
                color="bg-emerald-500"
                textColor="text-emerald-500"
                bgColor="bg-emerald-500/10"
            />
            <StatChip
                label="No-Shows"
                value={stats.no_show}
                icon={AlertOctagon}
                color="bg-red-500"
                textColor="text-red-500"
                bgColor="bg-red-500/10"
            />
        </div>
    );
}

function StatChip({
    label,
    value,
    icon: Icon,
    color,
    textColor,
    bgColor
}: {
    label: string,
    value: number,
    icon: React.ElementType,
    color: string,
    textColor: string,
    bgColor: string
}) {
    return (
        <Card className="flex items-center justify-between p-3 border-none shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
                <div className={cn("w-1.5 h-8 rounded-full", color)} />
                <div>
                    <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{label}</p>
                    <motion.p
                        key={value}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-bold text-[var(--foreground)]"
                    >
                        {value}
                    </motion.p>
                </div>
            </div>
            <div className={cn("p-2 rounded-xl", bgColor)}>
                <Icon className={cn("w-4 h-4", textColor)} />
            </div>
        </Card>
    );
}
