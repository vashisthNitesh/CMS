"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Need to ensure this exists or use Input
import { getAvailableSlots } from "@/actions/schedule";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function StepSlotSelection({ data, onUpdate, onNext, onBack }: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [slots, setSlots] = useState<any[]>([]);
    const [date, setDate] = useState(data.slot?.date || new Date().toISOString().split("T")[0]);
    const [doctorId, setDoctorId] = useState(data.doctor?.user_id || "");

    useEffect(() => {
        // Fetch doctors (mock or actual api)
        async function fetchDoctors() {
            try {
                const res = await fetch("/api/doctors");
                const json = await res.json();
                setDoctors(json.doctors || []);
                if (!doctorId && json.doctors?.length > 0) {
                    setDoctorId(json.doctors[0].user_id);
                    onUpdate({ doctor: json.doctors[0] });
                }
            } catch (e) {
                console.error(e);
            }
        }
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (!doctorId || !date) return;

        let mounted = true;
        setLoading(true);

        getAvailableSlots(doctorId, date).then((res) => {
            if (mounted) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setSlots(res || []);
                setLoading(false);
            }
        });

        return () => { mounted = false; };
    }, [doctorId, date]);

    const handleDoctorChange = (id: string) => {
        setDoctorId(id);
        const doc = doctors.find(d => d.user_id === id);
        onUpdate({ doctor: doc, slot: null });
    };

    const handleSlotSelect = (slot: any) => {
        onUpdate({ slot: { ...slot, date } });
    };

    // Split slots into AM/PM
    const amSlots = slots.filter(s => parseInt(s.slot_start_time.split(":")[0]) < 12);
    const pmSlots = slots.filter(s => parseInt(s.slot_start_time.split(":")[0]) >= 12);

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">When should they come in?</h2>
                <p className="text-[var(--muted-foreground)]">Choose a doctor and an available time slot.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Filters */}
                <div className="space-y-4 md:col-span-1">
                    <div className="space-y-2">
                        <Label>Doctor</Label>
                        <select
                            className="flex h-11 w-full rounded-xl border border-input bg-[var(--bg-canvas)] px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={doctorId}
                            onChange={(e) => handleDoctorChange(e.target.value)}
                        >
                            {doctors.map(d => (
                                <option key={d.user_id} value={d.user_id}>Dr. {d.first_name} {d.last_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => { setDate(e.target.value); onUpdate({ slot: null }); }}
                            className="h-11 rounded-xl bg-[var(--bg-canvas)]"
                        />
                    </div>

                    <div className="pt-4 border-t border-[var(--border)] space-y-4">
                        <div className="space-y-2">
                            <Label>Visit Type</Label>
                            <select
                                className="flex h-11 w-full rounded-xl border border-input bg-[var(--bg-canvas)] px-3 py-2 text-sm"
                                value={data.visitType}
                                onChange={(e) => onUpdate({ visitType: e.target.value })}
                            >
                                <option value="NEW_PATIENT">New Patient</option>
                                <option value="FOLLOW_UP">Follow Up</option>
                                <option value="CONSULTATION">Consultation</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Reason for Visit</Label>
                            <Input
                                placeholder="Headache, Fever..."
                                value={data.reason}
                                onChange={(e) => onUpdate({ reason: e.target.value })}
                                className="h-11 rounded-xl bg-[var(--bg-canvas)]"
                            />
                        </div>
                    </div>
                </div>

                {/* Slots Grid */}
                <div className="md:col-span-2 space-y-6">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center border rounded-2xl bg-[var(--muted)]/10">
                            <div className="flex flex-col items-center gap-2 text-[var(--muted-foreground)]">
                                <div className="animate-spin text-2xl">⏳</div>
                                <p>Checking availability...</p>
                            </div>
                        </div>
                    ) : slots.length === 0 ? (
                        <div className="h-64 flex items-center justify-center border rounded-2xl bg-[var(--muted)]/10 text-[var(--muted-foreground)]">
                            No slots available for this date.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* AM Slots */}
                            {amSlots.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Morning
                                    </h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {amSlots.map(slot => (
                                            <SlotButton
                                                key={slot.slot_id}
                                                slot={slot}
                                                selected={data.slot?.slot_id === slot.slot_id}
                                                onClick={() => handleSlotSelect(slot)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PM Slots */}
                            {pmSlots.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Afternoon
                                    </h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {pmSlots.map(slot => (
                                            <SlotButton
                                                key={slot.slot_id}
                                                slot={slot}
                                                selected={data.slot?.slot_id === slot.slot_id}
                                                onClick={() => handleSlotSelect(slot)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-[var(--border)]">
                <Button variant="ghost" onClick={onBack} size="lg">Back</Button>
                <Button onClick={onNext} disabled={!data.slot} size="lg" className="px-8">
                    Review & Confirm <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SlotButton({ slot, selected, onClick }: any) {
    // Mock "AI Recommended" logic: random check or specific time
    const isRecommended = slot.slot_start_time.startsWith("10:00") || slot.slot_start_time.startsWith("14:30");

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative p-3 rounded-xl border text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1",
                selected
                    ? "border-[var(--primary)] bg-[var(--primary)] text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                    : "border-[var(--border)] bg-[var(--bg-canvas)] hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5",
                isRecommended && !selected && "border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]"
            )}
        >
            {isRecommended && !selected && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-600 text-[10px] text-white rounded-full font-bold shadow-sm whitespace-nowrap flex items-center gap-1">
                    <Sparkles className="w-2 h-2" /> AI Pick
                </div>
            )}
            <span className="text-base">{slot.slot_start_time.slice(0, 5)}</span>
        </button>
    );
}
