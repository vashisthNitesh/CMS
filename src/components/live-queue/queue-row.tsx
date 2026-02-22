"use client";

import React from "react"; // Added React import for types
import { motion } from "framer-motion";
import {
    CheckCircle,
    Play,
    AlertOctagon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WaitTimeCounter } from "./wait-time-counter";
import type { QueueItem } from "@/hooks/use-live-queue";

interface QueueRowProps {
    item: QueueItem;
    isSelected: boolean;
    onSelect: (item: QueueItem) => void;
    onStatusChange: (id: string, status: string) => void;
}

export function QueueRow({ item, isSelected, onSelect, onStatusChange }: QueueRowProps) {
    const isEmergency = item.is_emergency;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
                "group relative flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                isSelected
                    ? "bg-[var(--primary)]/5 border-[var(--primary)]"
                    : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--primary)]/50",
                isEmergency && "border-l-[4px] border-l-red-500 bg-red-50 dark:bg-red-950/10"
            )}
            onClick={() => onSelect(item)}
        >
            {/* Queue Number */}
            <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg shadow-sm shrink-0",
                isSelected ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]",
                isEmergency && "bg-red-500 text-white animate-pulse"
            )}>
                {item.queue_number}
            </div>

            {/* Patient Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[var(--foreground)] truncate">{item.patient_name}</h3>
                    <span className="text-xs font-mono text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded">
                        {new Date(item.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <span className="truncate">{item.doctor_name}</span>
                    <span>•</span>
                    <span className="truncate">{item.visit_type}</span>
                </div>
            </div>

            <div className="relative shrink-0 flex items-center justify-end overflow-hidden w-[160px] md:w-[220px] h-10 pr-2">
                {/* Status & Wait Time */}
                <div className="absolute right-2 flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-10 group-hover:opacity-0">
                    <WaitTimeCounter minutes={item.wait_minutes} />
                    <Badge variant={getStatusVariant(item.status)} className="h-7 whitespace-nowrap">
                        {item.status.replace(/_/g, " ")}
                    </Badge>
                </div>

                {/* Inline Actions */}
                <div className="absolute right-2 flex items-center gap-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                    <ActionBtn
                        icon={Play}
                        tooltip="Start Consult"
                        color="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onStatusChange(item.appointment_id, "IN_CONSULTATION"); }}
                    />
                    <ActionBtn
                        icon={CheckCircle}
                        tooltip="Complete"
                        color="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onStatusChange(item.appointment_id, "COMPLETED"); }}
                    />
                    <ActionBtn
                        icon={AlertOctagon}
                        tooltip="No Show / Cancel"
                        color="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onStatusChange(item.appointment_id, "NO_SHOW"); }}
                    />
                </div>
            </div>
        </motion.div>
    );
}

interface ActionBtnProps {
    icon: React.ElementType;
    tooltip: string;
    color: string;
    onClick: (e: React.MouseEvent) => void;
}

function ActionBtn({ icon: Icon, tooltip, color, onClick }: ActionBtnProps) {
    return (
        <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full shadow-sm transition-transform hover:scale-105", color)} onClick={onClick} title={tooltip}>
            <Icon className="w-4 h-4" />
        </Button>
    )
}

function getStatusVariant(status: string): "default" | "secondary" | "success" | "destructive" | "outline" {
    switch (status) {
        case "IN_CONSULTATION": return "default"; // Primary color typically
        case "CHECKED_IN": return "secondary";
        case "COMPLETED": return "success";
        case "NO_SHOW": return "destructive";
        default: return "outline";
    }
}
