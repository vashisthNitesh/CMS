import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, User, Sparkles, MapPin, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppointmentSlot } from "@/lib/types";

// Types
interface Doctor {
    doctor_id: string;
    first_name: string;
    last_name: string;
    specialization?: string;
}

interface SlotSelectionProps {
    doctors: Doctor[];
    selectedDoctorId: string;
    onDoctorChange: (id: string) => void;
    selectedDate: string;
    onDateChange: (date: string) => void;
    slots: AppointmentSlot[];
    isLoadingSlots: boolean;
    selectedSlot: AppointmentSlot | null;
    onSlotSelect: (slot: AppointmentSlot) => void;
    visitType: string;
    onVisitTypeChange: (type: string) => void;
    reason: string;
    onReasonChange: (reason: string) => void;
}

export function SlotSelection({
    doctors,
    selectedDoctorId,
    onDoctorChange,
    selectedDate,
    onDateChange,
    slots,
    isLoadingSlots,
    selectedSlot,
    onSlotSelect,
    visitType,
    onVisitTypeChange,
    reason,
    onReasonChange,
}: SlotSelectionProps) {

    // Group slots into AM/PM
    const amSlots = slots.filter(s => parseInt(s.slot_start_time.split(':')[0]) < 12);
    const pmSlots = slots.filter(s => parseInt(s.slot_start_time.split(':')[0]) >= 12);

    // Mock recommendation logic: First available AM slot or first PM slot
    const recommendedSlotId = slots.find(s => s.status === "AVAILABLE")?.slot_id;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Filters & Details */}
                <div className="md:col-span-1 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Doctor</Label>
                            <Select value={selectedDoctorId} onValueChange={onDoctorChange}>
                                <SelectTrigger className="w-full h-11 bg-[var(--bg-surface)]">
                                    <SelectValue placeholder="Choose doctor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {doctors.map((doc) => (
                                        <SelectItem key={doc.doctor_id} value={doc.doctor_id}>
                                            Dr. {doc.first_name} {doc.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Date</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                                <input
                                    type="date"
                                    className="flex h-11 w-full rounded-md border border-[var(--input)] bg-[var(--bg-surface)] px-3 py-2 pl-9 text-sm ring-offset-[var(--bg-canvas)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedDate}
                                    onChange={(e) => onDateChange(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                        <div className="space-y-2">
                            <Label>Visit Type</Label>
                            <Select value={visitType} onValueChange={onVisitTypeChange}>
                                <SelectTrigger className="w-full h-11 bg-[var(--bg-surface)]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NEW_PATIENT">New Patient</SelectItem>
                                    <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                                    <SelectItem value="WALK_IN">Walk In</SelectItem>
                                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                                    <SelectItem value="CONSULTATION">Consultation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Reason for Visit</Label>
                            <Textarea
                                placeholder="Brief description of symptoms or purpose..."
                                className="resize-none bg-[var(--bg-surface)] min-h-[100px]"
                                value={reason}
                                onChange={(e) => onReasonChange(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Slot Grid */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-6 min-h-[500px] border-[var(--border)] bg-[var(--bg-canvas)]/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[var(--primary)]" />
                                Available Slots
                            </h3>
                            {slots.length > 0 && (
                                <Badge variant="secondary" className="font-medium">
                                    {slots.filter(s => s.status === "AVAILABLE").length} available
                                </Badge>
                            )}
                        </div>

                        {isLoadingSlots ? (
                            <div className="flex flex-col items-center justify-center h-[300px] gap-3 text-[var(--muted-foreground)]">
                                <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm animate-pulse">Checking availability...</p>
                            </div>
                        ) : slots.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[300px] gap-3 text-[var(--muted-foreground)]">
                                <div className="w-12 h-12 rounded-full bg-[var(--muted)]/50 flex items-center justify-center">
                                    <CalendarIcon className="w-6 h-6 opacity-50" />
                                </div>
                                <p className="text-sm">No slots available for this date.</p>
                                <Button variant="link" onClick={() => { /* logic to next day? or let user pick */ }} className="text-[var(--primary)]">
                                    Try the next day
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* AM Slots */}
                                {amSlots.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Morning
                                        </h4>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {amSlots.map((slot) => (
                                                <SlotButton
                                                    key={slot.slot_id}
                                                    slot={slot}
                                                    isSelected={selectedSlot?.slot_id === slot.slot_id}
                                                    isRecommended={slot.slot_id === recommendedSlotId}
                                                    onSelect={() => onSlotSelect(slot)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* PM Slots */}
                                {pmSlots.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Afternoon
                                        </h4>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {pmSlots.map((slot) => (
                                                <SlotButton
                                                    key={slot.slot_id}
                                                    slot={slot}
                                                    isSelected={selectedSlot?.slot_id === slot.slot_id}
                                                    isRecommended={slot.slot_id === recommendedSlotId}
                                                    onSelect={() => onSlotSelect(slot)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}

function SlotButton({ slot, isSelected, isRecommended, onSelect }: { slot: AppointmentSlot, isSelected: boolean, isRecommended: boolean, onSelect: () => void }) {
    const isAvailable = slot.status === "AVAILABLE";

    return (
        <motion.button
            whileHover={isAvailable ? { scale: 1.05 } : {}}
            whileTap={isAvailable ? { scale: 0.95 } : {}}
            onClick={isAvailable ? onSelect : undefined}
            disabled={!isAvailable}
            className={cn(
                "relative group flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 min-h-[3.5rem]",
                !isAvailable && "opacity-50 cursor-not-allowed bg-[var(--muted)]/30 border-transparent text-[var(--muted-foreground)] decoration-slate-400/50", // Line-through handled via class or just visual dimmed
                isAvailable && "bg-[var(--bg-surface)] hover:border-[var(--primary)]/50 hover:shadow-sm",
                isSelected && "bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)] shadow-md shadow-primary/25 ring-2 ring-[var(--primary)]/20",
                isRecommended && !isSelected && "border-indigo-400/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.15)]",
                !isSelected && !isAvailable && "line-through decoration-[var(--muted-foreground)]"
            )}
        >
            {isRecommended && !isSelected && isAvailable && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-1 whitespace-nowrap">
                    <Sparkles className="w-2 h-2" /> Best
                </div>
            )}

            <span className={cn(
                "text-sm font-semibold",
                isSelected ? "text-white" : "text-[var(--foreground)]"
            )}>
                {slot.slot_start_time.slice(0, 5)}
            </span>
        </motion.button>
    );
}
