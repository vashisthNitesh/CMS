"use client";

import { motion } from "framer-motion";
import { Check, Calendar, Clock, User, FileText, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AppointmentSlot } from "@/lib/types";

// Reusing types from previous components roughly
interface ConfirmationProps {
    patient: { first_name: string; last_name: string; phone: string; email?: string } | null;
    doctor: { first_name: string; last_name: string; specialization?: string } | null;
    slot: AppointmentSlot | null;
    visitType: string;
    reason: string;
    onConfirm: () => void;
    onBack: () => void;
    isBooking: boolean;
}

export function Confirmation({
    patient,
    doctor,
    slot,
    visitType,
    reason,
    onConfirm,
    onBack,
    isBooking
}: ConfirmationProps) {
    if (!patient || !doctor || !slot) return null;

    const dateStr = new Date(slot.slot_date).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="w-full max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <Card className="overflow-hidden border-[var(--border)] shadow-xl bg-[var(--bg-surface)]">
                {/* Header Summary */}
                <div className="bg-[var(--primary)]/5 p-6 border-b border-[var(--primary)]/10 text-center">
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Review Booking</h2>
                    <p className="text-[var(--muted-foreground)]">Please verify the details below before confirming.</p>
                </div>

                <div className="p-0">
                    {/* Patient Section */}
                    <div className="p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Patient</h3>
                            <p className="text-lg font-medium">{patient.first_name} {patient.last_name}</p>
                            <p className="text-sm text-[var(--muted-foreground)]">{patient.phone}</p>
                            {patient.email && <p className="text-sm text-[var(--muted-foreground)]">{patient.email}</p>}
                        </div>
                        <Button variant="ghost" size="sm" onClick={onBack} className="text-[var(--primary)] hover:text-[var(--primary)]/80">Edit</Button>
                    </div>

                    <Separator />

                    {/* Appointment Details */}
                    <div className="p-6 flex items-start gap-4 bg-[var(--bg-canvas)]/30">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Date & Time</h3>
                                <p className="text-lg font-medium">{dateStr}</p>
                                <p className="text-base text-[var(--muted-foreground)] flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {slot.slot_start_time.slice(0, 5)} - {slot.slot_end_time.slice(0, 5)}
                                    <span className="px-2 py-0.5 rounded-full bg-[var(--muted)] text-xs">
                                        {slot.slot_duration_min} min
                                    </span>
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Provider</h3>
                                <p className="font-medium">Dr. {doctor.first_name} {doctor.last_name}</p>
                                {doctor.specialization && <p className="text-sm text-[var(--muted-foreground)]">{doctor.specialization}</p>}
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onBack} className="text-[var(--primary)] hover:text-[var(--primary)]/80">Edit</Button>
                    </div>

                    <Separator />

                    {/* Visit Info */}
                    <div className="p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Visit Details</h3>
                            <div className="space-y-1">
                                <p className="font-medium"><span className="text-[var(--muted-foreground)] font-normal">Type:</span> {visitType.replace('_', ' ')}</p>
                                {reason && (
                                    <p className="font-medium"><span className="text-[var(--muted-foreground)] font-normal">Reason:</span> {reason}</p>
                                )}
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onBack} className="text-[var(--primary)] hover:text-[var(--primary)]/80">Edit</Button>
                    </div>
                </div>

                <div className="p-6 bg-[var(--bg-canvas)]/50 border-t border-[var(--border)] flex justify-end gap-3">
                    <Button variant="outline" onClick={onBack} disabled={isBooking}>Back</Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isBooking}
                        className="min-w-[160px] bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white shadow-lg shadow-primary/25"
                    >
                        {isBooking ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirming...
                            </>
                        ) : (
                            <>
                                Confirm & Book <ChevronRight className="w-4 h-4 ml-1" />
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
