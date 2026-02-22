"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScheduleDrawers } from "./schedule-drawers";

interface ScheduleLayoutProps {
    doctors: { id: string; name: string }[];
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function ScheduleLayout({ doctors, children, activeTab, onTabChange }: ScheduleLayoutProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]?.id || "");
    const [isBlockDrawerOpen, setIsBlockDrawerOpen] = useState(false);

    return (
        <div className="flex flex-col h-full bg-[var(--bg-canvas)] min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Schedule & Availability</h1>

                        {/* Doctor Selector */}
                        <div className="w-[240px]">
                            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Doctor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {doctors.map((doc) => (
                                        <SelectItem key={doc.id} value={doc.id}>
                                            {doc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Button
                            className="gap-2 shadow-lg shadow-primary/20"
                            onClick={() => setIsBlockDrawerOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Add Time Block
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 max-w-[600px] h-10">
                        <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
                        <TabsTrigger value="blocks">Time Blocks</TabsTrigger>
                        <TabsTrigger value="overrides">Overrides</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                </Tabs>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-6 animate-in fade-in duration-500">
                {children}
            </main>

            <ScheduleDrawers
                isBlockOpen={isBlockDrawerOpen}
                onBlockChange={setIsBlockDrawerOpen}
                doctorId={selectedDoctor}
                onRefresh={async () => { }}
            />
        </div>
    );
}
