"use client";

import { useTransition } from "react";
import { CheckCircle2, Calendar, User, Clock, Stethoscope, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bookAppointment } from "@/actions/appointments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function StepConfirmation({ data, onBack }: any) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleConfirm = () => {
        startTransition(async () => {
            const result = await bookAppointment({
                patient_id: data.patient.patient_id,
                doctor_id: data.doctor.user_id,
                slot_id: data.slot.slot_id,
                visit_type: data.visitType,
                reason_for_visit: data.reason,
                source: "WALK_IN",
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Appointment Confirmed!", {
                description: "Redirecting to dashboard...",
                duration: 2000,
            });

            // Redirect after delay
            setTimeout(() => {
                router.push("/dashboard/receptionist");
            }, 1500);
        });
    };

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Confirm Booking</h2>
                <p className="text-[var(--muted-foreground)]">Please review the details before confirming.</p>
            </div>

            <div className="bg-[var(--muted)]/20 p-6 rounded-2xl border border-[var(--border)] space-y-6">

                {/* Patient Summary */}
                <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Patient</h4>
                        <p className="font-bold text-lg">{data.patient.first_name} {data.patient.last_name}</p>
                        <p className="text-sm opacity-70">{data.patient.phone} • {data.patient.gender}</p>
                    </div>
                </div>

                <div className="h-px bg-[var(--border)]" />

                {/* Appointment Detail */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                            <Stethoscope className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Doctor</h4>
                            <p className="font-semibold">Dr. {data.doctor.first_name} {data.doctor.last_name}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Time</h4>
                            <p className="font-semibold">
                                {new Date(data.slot.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                <br />
                                {data.slot.slot_start_time.slice(0, 5)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-[var(--border)]" />

                {/* Visit Reason */}
                <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Visit Details</h4>
                        <p className="font-medium text-sm capitalize">{data.visitType.replace(/_/g, " ").toLowerCase()}</p>
                        {data.reason && <p className="text-sm opacity-70 mt-1">"{data.reason}"</p>}
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={onBack} size="lg" disabled={isPending}>Back</Button>
                <Button
                    onClick={handleConfirm}
                    disabled={isPending}
                    size="lg"
                    className="px-8 shadow-xl shadow-primary/20 bg-gradient-to-r from-[var(--primary)] to-indigo-600 hover:to-indigo-500 border-none"
                >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                    Confirm & Book
                </Button>
            </div>
        </div>
    );
}
