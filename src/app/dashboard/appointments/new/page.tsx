"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPatient, searchPatients } from "@/actions/patients";
import { bookAppointment } from "@/actions/appointments";
import { getAvailableSlots } from "@/actions/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
    CalendarPlus, Search, UserPlus, Clock, Loader2, CheckCircle,
    AlertCircle, ArrowRight, ArrowLeft, User, Sparkles
} from "lucide-react";
import type { AppointmentSlot } from "@/lib/types";
import { PatientRegistrationForm } from "@/components/patients/patient-registration-form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Step = "patient" | "schedule" | "confirm";
const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "patient", label: "Patient", icon: <User className="w-4 h-4" /> },
    { key: "schedule", label: "Schedule", icon: <Clock className="w-4 h-4" /> },
    { key: "confirm", label: "Confirm", icon: <CheckCircle className="w-4 h-4" /> },
];

export default function NewAppointmentPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [step, setStep] = useState<Step>("patient");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Patient
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Record<string, string>[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Record<string, string> | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Schedule
    const [doctors, setDoctors] = useState<Record<string, string>[]>([]);
    const [doctorId, setDoctorId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [slots, setSlots] = useState<AppointmentSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Details
    const [visitType, setVisitType] = useState("NEW_PATIENT");
    const [reason, setReason] = useState("");

    // Load doctors list
    useEffect(() => {
        async function loadDoctors() {
            try {
                const res = await fetch("/api/doctors");
                if (res.ok) {
                    const data = await res.json();
                    setDoctors(data.doctors || []);
                    if (data.doctors?.length > 0) {
                        setDoctorId(data.doctors[0].user_id);
                    }
                }
            } catch {
                // fallback: manual entry
            }
        }
        loadDoctors();
    }, []);

    async function handleSearch() {
        if (searchTerm.length < 2) return;
        setError("");
        const result = await searchPatients(searchTerm);
        setSearchResults(result.patients);
    }

    async function handleCreatePatient(formData: FormData) {
        setError("");
        const result = await createPatient({
            first_name: formData.get("first_name") as string,
            last_name: formData.get("last_name") as string,
            phone: formData.get("phone") as string,
            age: parseInt(formData.get("age") as string) || undefined,
            gender: (formData.get("gender") as string) || undefined,
        });
        if (result.error) {
            throw new Error(result.error);
        } else if (result.patient) {
            setSelectedPatient(result.patient);
            setIsCreating(false);
            setStep("schedule");
        }
    }

    const loadSlots = useCallback(async () => {
        if (!doctorId || !date) return;
        setLoadingSlots(true);
        setSelectedSlot(null);
        try {
            const result = await getAvailableSlots(doctorId, date);
            setSlots(result || []);
        } catch {
            setSlots([]);
        }
        setLoadingSlots(false);
    }, [doctorId, date]);

    useEffect(() => {
        if (step === "schedule" && doctorId && date) {
            loadSlots();
        }
    }, [step, doctorId, date, loadSlots]);

    async function handleBooking() {
        if (!selectedPatient || !selectedSlot) return;
        setError("");
        startTransition(async () => {
            const result = await bookAppointment({
                patient_id: selectedPatient.patient_id,
                doctor_id: doctorId,
                slot_id: selectedSlot.slot_id,
                visit_type: visitType,
                reason_for_visit: reason || undefined,
            });
            if (result.error) {
                setError(result.error);
            } else {
                setSuccess("Appointment booked successfully!");
                setTimeout(() => router.push("/dashboard/appointments"), 1500);
            }
        });
    }

    const currentStepIndex = steps.findIndex(s => s.key === step);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <PageHeader
                title="Book Appointment"
                description="Search for a patient or register a new one, then book a time slot."
                icon={<CalendarPlus className="w-5 h-5 text-[var(--primary)]" />}
            />

            {/* Step Indicator */}
            <div className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
                {steps.map((s, i) => (
                    <div key={s.key} className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (i < currentStepIndex) setStep(s.key);
                            }}
                            disabled={i > currentStepIndex}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${step === s.key
                                ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                                : i < currentStepIndex
                                    ? "text-emerald-400 cursor-pointer hover:bg-white/[0.04]"
                                    : "text-[var(--muted-foreground)] opacity-40"
                                }`}
                        >
                            {i < currentStepIndex ? <CheckCircle className="w-4 h-4" /> : s.icon}
                            {s.label}
                        </button>
                        {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] opacity-30" />}
                    </div>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {/* Success */}
            {success && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
                </div>
            )}

            {/* Step 1: Patient */}
            {step === "patient" && (
                <Card className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
                    <CardHeader>
                        <CardTitle>
                            {isCreating ? "Register New Patient" : "Find Patient"}
                        </CardTitle>
                        <CardDescription>
                            {isCreating ? "Fill in the patient details below." : "Search by name or phone number."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!isCreating ? (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                                        <Input
                                            placeholder="Search by name or phone..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Button onClick={handleSearch} variant="outline">Search</Button>
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="space-y-2">
                                        {searchResults.map((p) => (
                                            <button
                                                key={p.patient_id}
                                                onClick={() => { setSelectedPatient(p); setStep("schedule"); }}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${selectedPatient?.patient_id === p.patient_id
                                                    ? "bg-[var(--primary)]/10 border-[var(--primary)]/20"
                                                    : "bg-white/[0.02] border-transparent hover:border-white/[0.04] hover:bg-white/[0.04]"
                                                    }`}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                                                    {p.first_name?.[0]}{p.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{p.first_name} {p.last_name}</p>
                                                    <p className="text-xs text-[var(--muted-foreground)]">
                                                        {p.phone} {p.age && `· ${p.age}y`} {p.gender && `· ${p.gender}`}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-2 border-t border-[var(--border)]">
                                    <Button variant="outline" className="gap-2 w-full" onClick={() => setIsCreating(true)}>
                                        <UserPlus className="w-4 h-4" /> Register New Patient
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="pt-2">
                                <PatientRegistrationForm
                                    onSubmit={async (formData) => await handleCreatePatient(formData)}
                                    submitLabel="Register & Continue"
                                    onCancel={() => setIsCreating(false)}
                                    cancelLabel="Back"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Schedule */}
            {step === "schedule" && (
                <Card className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
                    <CardHeader>
                        <CardTitle>Select Time Slot</CardTitle>
                        <CardDescription>
                            Choose a doctor and date to view available slots.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {selectedPatient && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--primary)]/[0.04] border border-[var(--primary)]/10">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                                    {selectedPatient.first_name?.[0]}{selectedPatient.last_name?.[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">{selectedPatient.phone}</p>
                                </div>
                                <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setStep("patient")}>
                                    Change
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Doctor</Label>
                                {doctors.length > 0 ? (
                                    <Select value={doctorId} onValueChange={setDoctorId}>
                                        <SelectTrigger className="w-full mt-1 h-10 rounded-xl border-[var(--input)] bg-white/[0.03] px-3.5 focus:ring-[var(--ring)]/50 transition-all duration-200">
                                            <SelectValue placeholder="Select Doctor" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] shadow-xl">
                                            {doctors.map((d) => (
                                                <SelectItem key={d.user_id} value={d.user_id} className="rounded-lg cursor-pointer">
                                                    Dr. {d.first_name} {d.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        placeholder="Doctor UUID"
                                        value={doctorId}
                                        onChange={(e) => setDoctorId(e.target.value)}
                                        className="mt-1"
                                    />
                                )}
                            </div>
                            <div>
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        {/* Visit Details */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Visit Type</Label>
                                <Select value={visitType} onValueChange={setVisitType}>
                                    <SelectTrigger className="w-full mt-1 h-10 rounded-xl border-[var(--input)] bg-white/[0.03] px-3.5 focus:ring-[var(--ring)]/50 transition-all duration-200">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] shadow-xl">
                                        <SelectItem value="NEW_PATIENT" className="rounded-lg cursor-pointer">New Patient</SelectItem>
                                        <SelectItem value="FOLLOW_UP" className="rounded-lg cursor-pointer">Follow Up</SelectItem>
                                        <SelectItem value="ROUTINE" className="rounded-lg cursor-pointer">Routine</SelectItem>
                                        <SelectItem value="URGENT" className="rounded-lg cursor-pointer">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Visit Reason</Label>
                                <Input
                                    placeholder="e.g., Headache, follow-up"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        {/* Slots Grid */}
                        {loadingSlots ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                            </div>
                        ) : slots.length > 0 ? (
                            <div>
                                <Label className="mb-2 block">Available Slots</Label>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {slots.map((slot) => (
                                        <button
                                            key={slot.slot_id}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`p-2 rounded-xl text-center text-sm font-medium transition-all border ${selectedSlot?.slot_id === slot.slot_id
                                                ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30 ring-2 ring-[var(--primary)]/20"
                                                : "bg-white/[0.02] border-[var(--border)] hover:bg-white/[0.04] hover:border-white/[0.06]"
                                                }`}
                                        >
                                            <Clock className="w-3 h-3 mx-auto mb-0.5" />
                                            {String(slot.slot_start_time).slice(0, 5)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : doctorId && date ? (
                            <div className="text-center py-8 text-[var(--muted-foreground)] text-sm">
                                No available slots for this date.
                            </div>
                        ) : null}

                        <div className="flex gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setStep("patient")}>
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button
                                onClick={() => setStep("confirm")}
                                disabled={!selectedSlot}
                                className="gap-2"
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && selectedPatient && selectedSlot && (
                <Card className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                            Confirm Booking
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-[var(--border)]/50">
                                <dt className="text-[var(--muted-foreground)]">Patient</dt>
                                <dd className="font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</dd>
                            </div>
                            <div className="flex justify-between py-2 border-b border-[var(--border)]/50">
                                <dt className="text-[var(--muted-foreground)]">Doctor</dt>
                                <dd className="font-medium">
                                    {doctors.find(d => d.user_id === doctorId) ? `Dr. ${doctors.find(d => d.user_id === doctorId)!.first_name} ${doctors.find(d => d.user_id === doctorId)!.last_name}` : doctorId}
                                </dd>
                            </div>
                            <div className="flex justify-between py-2 border-b border-[var(--border)]/50">
                                <dt className="text-[var(--muted-foreground)]">Date</dt>
                                <dd className="font-medium">{new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</dd>
                            </div>
                            <div className="flex justify-between py-2 border-b border-[var(--border)]/50">
                                <dt className="text-[var(--muted-foreground)]">Time</dt>
                                <dd className="font-medium">{String(selectedSlot.slot_start_time).slice(0, 5)} – {String(selectedSlot.slot_end_time).slice(0, 5)}</dd>
                            </div>
                            <div className="flex justify-between py-2 border-b border-[var(--border)]/50">
                                <dt className="text-[var(--muted-foreground)]">Visit Type</dt>
                                <dd className="font-medium capitalize">{visitType.replace(/_/g, " ").toLowerCase()}</dd>
                            </div>
                            {reason && (
                                <div className="flex justify-between py-2">
                                    <dt className="text-[var(--muted-foreground)]">Reason</dt>
                                    <dd className="font-medium text-right max-w-xs">{reason}</dd>
                                </div>
                            )}
                        </dl>

                        <div className="flex gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setStep("schedule")}>
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button
                                onClick={handleBooking}
                                disabled={isPending}
                                className="flex-1 gap-2 shadow-lg shadow-primary/20"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
                                Confirm Booking
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
