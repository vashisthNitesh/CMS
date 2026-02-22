"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Mock Data
const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CURRENT_DAY = "Wed"; // Mock current day

type SlotStatus = "available" | "booked" | "completed" | "blocked";

const MOCK_SCHEDULE: Record<string, Record<string, SlotStatus>> = {
    "Mon": { "09:00": "booked", "10:00": "booked", "11:00": "completed", "14:00": "available" },
    "Tue": { "09:00": "completed", "10:00": "completed", "11:00": "booked", "12:00": "blocked" },
    "Wed": { "09:00": "completed", "10:00": "booked", "11:00": "booked", "13:00": "available", "14:00": "available", "15:00": "booked" },
    "Thu": { "09:00": "available", "10:00": "available", "11:00": "booked", "14:00": "blocked" },
    "Fri": { "09:00": "booked", "10:00": "booked", "16:00": "available" },
};

export function AppointmentCalendar() {
    const [currentWeek] = useState("Feb 12 - Feb 18, 2024");
    const [selectedDay, setSelectedDay] = useState(CURRENT_DAY);

    const handleNextDay = () => {
        const currIdx = DAYS.indexOf(selectedDay);
        if (currIdx < DAYS.length - 1) setSelectedDay(DAYS[currIdx + 1]);
    };

    const handlePrevDay = () => {
        const currIdx = DAYS.indexOf(selectedDay);
        if (currIdx > 0) setSelectedDay(DAYS[currIdx - 1]);
    };

    const getStatusColor = (status?: SlotStatus) => {
        switch (status) {
            case "booked": return "bg-blue-500/80 hover:bg-blue-600";
            case "completed": return "bg-emerald-500/80 hover:bg-emerald-600";
            case "blocked": return "bg-slate-200 dark:bg-slate-800 diagonal-stripe"; // simplified
            case "available": return "bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20";
            default: return "bg-transparent hover:bg-[var(--bg-surface-sunken)]";
        }
    };

    return (
        <Card className="h-full border-[var(--border-subtle)] shadow-sm col-span-12 lg:col-span-8 flex flex-col min-h-0">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base font-semibold">Weekly Schedule</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--text-secondary)] mr-2 font-medium hidden md:inline-block">{currentWeek}</span>
                    <span className="text-sm text-[var(--text-secondary)] mr-2 font-medium md:hidden">{selectedDay}, Feb {12 + DAYS.indexOf(selectedDay)}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={handlePrevDay}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={handleNextDay}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
                <div className="w-full min-w-[300px] md:min-w-[600px] h-full flex flex-col">
                    {/* Header Row */}
                    <div className="grid grid-cols-2 md:grid-cols-8 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-sunken)]/30">
                        <div className="p-3 text-xs font-medium text-[var(--text-tertiary)] border-r border-[var(--border-subtle)] text-center">Time</div>
                        {DAYS.map((day) => (
                            <div
                                key={day}
                                className={cn(
                                    "p-3 text-center text-sm font-semibold border-r border-[var(--border-subtle)] last:border-r-0",
                                    day === CURRENT_DAY && "bg-blue-500/5 text-blue-600 dark:text-blue-400",
                                    day !== selectedDay ? "hidden md:block" : "block"
                                )}
                            >
                                {day}
                                {day === CURRENT_DAY && <div className="mt-1 h-1 w-1 rounded-full bg-blue-500 mx-auto" />}
                            </div>
                        ))}
                    </div>

                    {/* Time Slots */}
                    <div className="flex-1 relative min-h-0">
                        <ScrollArea className="absolute inset-0">
                            <div className="flex flex-col">
                                {TIME_SLOTS.map((time) => (
                                    <div key={time} className="grid grid-cols-2 md:grid-cols-8 border-b border-[var(--border-subtle)] last:border-b-0 min-h-[60px]">
                                        <div className="p-2 text-xs text-[var(--text-tertiary)] font-medium border-r border-[var(--border-subtle)] flex items-start justify-center pt-3">
                                            {time}
                                        </div>
                                        {DAYS.map((day) => {
                                            const status = MOCK_SCHEDULE[day]?.[time];
                                            return (
                                                <div
                                                    key={`${day}-${time}`}
                                                    className={cn(
                                                        "border-r border-[var(--border-subtle)] last:border-r-0 p-1 relative",
                                                        day !== selectedDay ? "hidden md:block" : "block"
                                                    )}
                                                >
                                                    {status && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className={cn(
                                                                "w-full h-full min-h-[40px] rounded-md cursor-pointer transition-colors text-[10px] flex items-center justify-center font-medium",
                                                                getStatusColor(status),
                                                                status === "blocked" && "opacity-50"
                                                            )}
                                                        >
                                                            {status === "booked" && "Patient"}
                                                            {status === "completed" && "Done"}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
