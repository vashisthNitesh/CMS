"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Pill, FlaskConical, Stethoscope } from "lucide-react";

interface TimelineEvent {
    id: string;
    type: "APPOINTMENT" | "PRESCRIPTION" | "LAB" | "NOTE";
    date: string;
    title: string;
    subtitle?: string;
    description?: string;
    status: string;
    doctor?: string;
}

interface TimelineTabProps {
    patientId: string;
}

export function TimelineTab({ patientId }: TimelineTabProps) {
    // Mock data
    const events: TimelineEvent[] = [
        {
            id: "1",
            type: "APPOINTMENT",
            date: "2024-02-15",
            title: "Follow-up Consultation",
            subtitle: "General Checkup",
            status: "COMPLETED",
            doctor: "Dr. Sarah Smith"
        },
        {
            id: "2",
            type: "PRESCRIPTION",
            date: "2024-02-15",
            title: "Amoxicillin 500mg",
            description: "Take 1 tablet 3 times a day for 7 days",
            status: "ACTIVE",
            doctor: "Dr. Sarah Smith"
        },
        {
            id: "3",
            type: "LAB",
            date: "2024-01-10",
            title: "Complete Blood Count (CBC)",
            status: "NORMAL",
            doctor: "Dr. James Wilson"
        },
        {
            id: "4",
            type: "NOTE",
            date: "2023-12-05",
            title: "Patient called regarding side effects",
            description: "Advised to stop medication if nausea persists.",
            status: "LOGGED",
            doctor: "Receptionist"
        }
    ];

    // Group by Month Year
    const groupedEvents = events.reduce((acc, event) => {
        const date = new Date(event.date);
        const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[key]) acc[key] = [];
        acc[key].push(event);
        return acc;
    }, {} as Record<string, TimelineEvent[]>);

    const getIcon = (type: TimelineEvent["type"]) => {
        switch (type) {
            case "APPOINTMENT": return <Calendar className="w-4 h-4" />;
            case "PRESCRIPTION": return <Pill className="w-4 h-4" />;
            case "LAB": return <FlaskConical className="w-4 h-4" />;
            case "NOTE": return <FileText className="w-4 h-4" />;
            default: return <Stethoscope className="w-4 h-4" />;
        }
    };

    const getColors = (type: TimelineEvent["type"]) => {
        switch (type) {
            case "APPOINTMENT": return "bg-blue-100 text-blue-600 border-blue-200";
            case "PRESCRIPTION": return "bg-purple-100 text-purple-600 border-purple-200";
            case "LAB": return "bg-teal-100 text-teal-600 border-teal-200";
            case "NOTE": return "bg-gray-100 text-gray-600 border-gray-200";
            default: return "bg-slate-100 text-slate-600 border-slate-200";
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 pl-8 relative">
            {/* Main Vertical Spine */}
            <div className="absolute left-[27px] top-8 bottom-0 w-0.5 bg-[var(--border)]" />

            {Object.entries(groupedEvents).map(([month, monthEvents]) => (
                <div key={month} className="mb-10 relative">
                    {/* Month Header */}
                    <div className="sticky top-[140px] z-10 -ml-10 mb-6 flex items-center">
                        <div className="bg-[var(--bg-surface)] px-2 py-1 rounded-md border text-sm font-bold text-[var(--muted-foreground)] shadow-sm">
                            {month}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {monthEvents.map((event) => (
                            <div key={event.id} className="relative pl-8 group">
                                {/* Dot on spine */}
                                <div className={cn(
                                    "absolute left-[-5px] top-5 w-3 h-3 rounded-full border-2 bg-[var(--bg-surface)] z-10 transition-colors",
                                    event.type === "APPOINTMENT" && "border-blue-500 group-hover:bg-blue-500",
                                    event.type === "PRESCRIPTION" && "border-purple-500 group-hover:bg-purple-500",
                                    event.type === "LAB" && "border-teal-500 group-hover:bg-teal-500",
                                    event.type === "NOTE" && "border-gray-500 group-hover:bg-gray-500"
                                )} />

                                {/* Event Card */}
                                <div className="bg-[var(--bg-card)] rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow relative">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", getColors(event.type))}>
                                                {getIcon(event.type)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm text-[var(--foreground)]">{event.title}</h4>
                                                {event.subtitle && <p className="text-xs text-[var(--muted-foreground)]">{event.subtitle}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-medium text-[var(--muted-foreground)]">
                                                {new Date(event.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                            </p>
                                            <Badge variant="outline" className="text-[10px] h-5 mt-1">
                                                {event.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    {event.description && (
                                        <p className="text-sm text-[var(--foreground)]/80 mt-3 mb-2 bg-[var(--muted)]/30 p-2 rounded-md">
                                            {event.description}
                                        </p>
                                    )}

                                    {event.doctor && (
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                                            <Stethoscope className="w-3 h-3" />
                                            <span>{event.doctor}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
