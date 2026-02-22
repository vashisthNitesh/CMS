"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Stethoscope, UserPlus, CalendarCheck2, FileText, CheckCircle2 } from "lucide-react";

const ACTIVITIES = [
    {
        id: 1,
        user: "Dr. Sarah Smith",
        action: "completed consultation",
        target: "John Doe",
        time: "2 min ago",
        icon: CheckCircle2,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        avatar: "SS"
    },
    {
        id: 2,
        user: "Nurse Jessica",
        action: "added vitals for",
        target: "Emma Wilson",
        time: "15 min ago",
        icon: Activity,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        avatar: "NJ"
    },
    {
        id: 3,
        user: "Front Desk",
        action: "scheduled appointment",
        target: "Michael Brown",
        time: "1 hour ago",
        icon: CalendarCheck2,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        avatar: "FD"
    },
    {
        id: 4,
        user: "Dr. James Lee",
        action: "prescribed medication",
        target: "Linda Chen",
        time: "2 hours ago",
        icon: FileText,
        color: "text-violet-500",
        bg: "bg-violet-500/10",
        avatar: "JL"
    },
    {
        id: 5,
        user: "system",
        action: "new patient registered",
        target: "Robert Taylor",
        time: "3 hours ago",
        icon: UserPlus,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
        avatar: "SY"
    },
    {
        id: 6,
        user: "Dr. Sarah Smith",
        action: "started consultation",
        target: "Alice Cooper",
        time: "4 hours ago",
        icon: Stethoscope,
        color: "text-sky-500",
        bg: "bg-sky-500/10",
        avatar: "SS"
    }
];

export function RecentActivity() {
    return (
        <Card className="h-full border-[var(--border-subtle)] shadow-sm col-span-12 lg:col-span-6 flex flex-col">
            <CardHeader className="py-4 px-6 border-b border-[var(--border-subtle)]">
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <CardDescription>Latest clinical updates</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative min-h-0">
                <ScrollArea className="absolute inset-0">
                    <div className="w-full px-6 py-4">
                        <div className="space-y-6 relative ml-2">
                            {/* Timeline Line */}
                            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-[var(--border-subtle)]" />

                            {ACTIVITIES.map((activity, index) => (
                                <div key={activity.id} className="relative flex items-start gap-4">
                                    {/* Icon Bubble */}
                                    <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--bg-surface)] shadow-sm ${activity.bg} ${activity.color}`}>
                                        <activity.icon className="h-5 w-5" />
                                    </div>

                                    <div className="flex-1 pt-1 opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}>
                                        <p className="text-sm text-[var(--text-primary)]">
                                            <span className="font-semibold">{activity.user}</span> {activity.action}{" "}
                                            <span className="font-medium text-[var(--text-secondary)]">{activity.target}</span>
                                        </p>
                                        <span className="text-xs text-[var(--text-tertiary)]">{activity.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
