"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCountUp } from "@/hooks/use-count-up";

interface MetricCardProps {
    title: string;
    value: number | string;
    trend?: {
        value: number;
        isPositive: boolean;
        label: string; // e.g. "vs yesterday"
    };
    icon: LucideIcon;
    color: string; // Hex or CSS var
    delay?: number;
}

export function MetricCard({ title, value, trend, icon: Icon, color, delay = 0 }: MetricCardProps) {
    const isNumber = typeof value === "number";

    // Animate pure numbers using our global useCountUp hook
    const animatedValue = useCountUp(isNumber ? (value as number) : 0, { delay });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <Card className="h-full border-none shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden relative group">
                {/* Left Border accent */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: color }}
                />

                <CardContent className="p-6 pl-7 flex flex-col justify-between h-full relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
                            <h3 className="text-3xl font-[800] mt-2 text-[var(--text-primary)] font-[family-name:var(--font-jakarta)]">
                                {isNumber ? animatedValue.toLocaleString() : value}
                            </h3>
                        </div>
                        <div
                            className="p-2.5 rounded-xl"
                            style={{ backgroundColor: `${color}15`, color: color }}
                        >
                            <Icon className="w-5 h-5" />
                        </div>
                    </div>

                    {trend && (
                        <div className="mt-4 flex items-center gap-2 text-sm">
                            <div
                                className={cn(
                                    "px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-0.5",
                                    trend.isPositive
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                                )}
                            >
                                {trend.isPositive ? "▲" : "▼"}
                                {Math.abs(trend.value)}%
                            </div>
                            <span className="text-[var(--text-tertiary)] text-xs">{trend.label}</span>
                        </div>
                    )}
                </CardContent>

                {/* Background Icon Watermark */}
                <Icon
                    className="absolute -right-4 -bottom-4 w-32 h-32 opacity-[0.03] pointer-events-none transition-transform duration-500 group-hover:scale-110"
                    style={{ color: color }}
                />
            </Card>
        </motion.div>
    );
}
