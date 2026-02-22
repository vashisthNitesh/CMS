"use client";

import { checkInPatient, startConsultation, completeAppointment, cancelAppointment, markNoShow } from "@/actions/appointments";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Play, CheckCircle, X, UserX, LogIn } from "lucide-react";
import type { Appointment } from "@/lib/types";

export function AppointmentActions({ appointment }: { appointment: Appointment }) {
    const router = useRouter();
    const [loading, setLoading] = useState("");

    const doAction = async (action: () => Promise<{ error?: string; success?: boolean }>, name: string) => {
        setLoading(name);
        const result = await action();
        if (result.error) {
            alert(result.error);
        }
        setLoading("");
        router.refresh();
    };

    return (
        <div className="flex items-center gap-1">
            {appointment.status === "SCHEDULED" && (
                <>
                    <Button
                        size="sm" variant="outline"
                        onClick={() => doAction(() => checkInPatient(appointment.appointment_id), "checkin")}
                        disabled={!!loading}
                    >
                        {loading === "checkin" ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogIn className="w-3 h-3" />}
                        <span className="ml-1">Check In</span>
                    </Button>
                    <Button
                        size="sm" variant="ghost"
                        onClick={() => doAction(() => markNoShow(appointment.appointment_id), "noshow")}
                        disabled={!!loading}
                    >
                        {loading === "noshow" ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX className="w-3 h-3" />}
                    </Button>
                </>
            )}
            {appointment.status === "CHECKED_IN" && (
                <Button
                    size="sm" variant="default"
                    onClick={() => doAction(() => startConsultation(appointment.appointment_id), "start")}
                    disabled={!!loading}
                    className="animate-pulse-glow"
                >
                    {loading === "start" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    <span className="ml-1">Start</span>
                </Button>
            )}
            {appointment.status === "IN_CONSULTATION" && (
                <Button
                    size="sm" variant="success"
                    onClick={() => doAction(() => completeAppointment(appointment.appointment_id), "complete")}
                    disabled={!!loading}
                >
                    {loading === "complete" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                    <span className="ml-1">Complete</span>
                </Button>
            )}
            {["SCHEDULED", "CHECKED_IN"].includes(appointment.status) && (
                <Button
                    size="sm" variant="ghost" className="text-[var(--destructive)]"
                    onClick={() => doAction(() => cancelAppointment(appointment.appointment_id, "Cancelled via dashboard"), "cancel")}
                    disabled={!!loading}
                >
                    {loading === "cancel" ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                </Button>
            )}
        </div>
    );
}
