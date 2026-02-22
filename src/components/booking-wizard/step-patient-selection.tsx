"use client";

import { useState, useTransition } from "react";
import { Search, UserPlus, Check, Loader2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { searchPatients, createPatient } from "@/actions/patients";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PatientRegistrationForm } from "@/components/patients/patient-registration-form";

export function StepPatientSelection({ data, onUpdate, onNext }: any) {
    const [searchTerm, setSearchTerm] = useState("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();
    const [isRegistering, setIsRegistering] = useState(false);
    const [createPending, startCreateTransition] = useTransition();

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }

        startTransition(async () => {
            const result = await searchPatients(term);
            setSearchResults(result.patients);
        });
    };

    const handleSelect = (patient: any) => {
        onUpdate({ patient });
        setSearchTerm("");
        setSearchResults([]);
        // Optional: Auto-advance or let user click Next
    };

    const handleCreate = async (formData: FormData) => {
        startCreateTransition(async () => {
            const result = await createPatient({
                first_name: formData.get("first_name") as string,
                last_name: formData.get("last_name") as string,
                phone: formData.get("phone") as string,
                age: parseInt(formData.get("age") as string) || undefined,
                gender: formData.get("gender") as string || undefined,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Patient registered!");
            handleSelect(result.patient);
            setIsRegistering(false);
        });
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Who is this appointment for?</h2>
                <p className="text-[var(--muted-foreground)]">Search for an existing patient or register a new one.</p>
            </div>

            {/* Selected Patient Card */}
            <AnimatePresence mode="wait">
                {data.patient ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12 border-2 border-[var(--background)] shadow-sm">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${data.patient.patient_id}`} />
                                <AvatarFallback>{data.patient.first_name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-bold text-lg">{data.patient.first_name} {data.patient.last_name}</h3>
                                <p className="text-sm text-[var(--muted-foreground)] flex gap-2">
                                    <span>{data.patient.phone}</span>
                                    <span>•</span>
                                    <span>{data.patient.gender}</span>
                                    <span>•</span>
                                    <span>{data.patient.age}y</span>
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" onClick={() => onUpdate({ patient: null })}>Change</Button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                            <Input
                                placeholder="Search by name or phone number..."
                                className="pl-12 h-14 text-lg rounded-xl shadow-sm border-[var(--border)] focus-visible:ring-[var(--primary)]"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                autoFocus
                            />
                            {isPending && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
                                </div>
                            )}
                        </div>

                        {/* Results Dropdown */}
                        <AnimatePresence>
                            {searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="border rounded-xl bg-[var(--card)] shadow-lg overflow-hidden divide-y divide-[var(--border)]"
                                >
                                    {searchResults.map((p) => (
                                        <button
                                            key={p.patient_id}
                                            onClick={() => handleSelect(p)}
                                            className="w-full flex items-center gap-4 p-4 text-left hover:bg-[var(--muted)]/50 transition-colors"
                                        >
                                            <Avatar className="w-10 h-10">
                                                <AvatarFallback>{p.first_name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold">{p.first_name} {p.last_name}</p>
                                                <p className="text-xs text-[var(--muted-foreground)]">{p.phone} • {p.age}y</p>
                                            </div>
                                            <div className="ml-auto text-xs text-[var(--muted-foreground)]">
                                                Last visit: {new Date().toLocaleDateString()}
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Quick Register */}
                        <div className="pt-4 border-t border-[var(--border)]/50">
                            <Collapsible open={isRegistering} onOpenChange={setIsRegistering}>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-[var(--muted-foreground)]">Patient not found?</p>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="link" className="text-[var(--primary)] p-0 h-auto font-semibold">
                                            {isRegistering ? "Cancel Registration" : "Quick Register"}
                                        </Button>
                                    </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent>
                                    <div className="mt-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 animate-in slide-in-from-top-2 duration-300">
                                        <PatientRegistrationForm
                                            onSubmit={async (formData) => await handleCreate(formData)}
                                            submitLabel="Create Patient Record"
                                        />
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-end pt-4">
                <Button onClick={onNext} disabled={!data.patient} size="lg" className="px-8">
                    Continue
                </Button>
            </div>
        </div>
    );
}
