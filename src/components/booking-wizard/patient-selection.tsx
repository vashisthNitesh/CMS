"use client";

import { useState, useEffect, useRef } from "react";
import { Search, UserPlus, User, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPatient, searchPatients } from "@/actions/patients";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { PatientRegistrationForm } from "@/components/patients/patient-registration-form";

// Types (should be in a shared type file, but defining here for now based on page.tsx)
interface Patient {
    patient_id: string;
    first_name: string;
    last_name: string;
    phone: string;
    age?: number;
    gender?: string;
    last_visit?: string;
}

interface PatientSelectionProps {
    selectedPatient: Patient | null;
    onSelect: (patient: Patient) => void;
}

export function PatientSelection({ selectedPatient, onSelect }: PatientSelectionProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showQuickRegister, setShowQuickRegister] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                setIsSearching(true);
                try {
                    const result = await searchPatients(searchTerm);
                    setSearchResults(result.patients);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    async function handleCreatePatient(formData: FormData) {
        setIsCreating(true);
        try {
            const result = await createPatient({
                first_name: formData.get("first_name") as string,
                last_name: formData.get("last_name") as string,
                phone: formData.get("phone") as string,
                age: parseInt(formData.get("age") as string) || undefined,
                gender: formData.get("gender") as string || undefined,
            });

            if (result.error) {
                // Handle error (toast or inline)
                console.error(result.error);
                return;
            }

            onSelect(result.patient);
            setShowQuickRegister(false);
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <AnimatePresence mode="wait">
                {selectedPatient ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative group"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-2xl opacity-75 blur transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative flex items-center justify-between p-6 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] shadow-lg">
                            <div className="flex items-center gap-5">
                                <Avatar className="w-16 h-16 border-2 border-[var(--bg-canvas)] shadow-md">
                                    <AvatarFallback className="bg-[var(--primary)]/10 text-[var(--primary)] text-xl font-bold">
                                        {(selectedPatient.first_name[0] + selectedPatient.last_name[0]).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        {selectedPatient.first_name} {selectedPatient.last_name}
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold">Selected</span>
                                    </h3>
                                    <p className="text-[var(--muted-foreground)] flex items-center gap-2 text-sm mt-1">
                                        {selectedPatient.phone}
                                        <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                                        {selectedPatient.age} years
                                        {selectedPatient.gender && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                                                <span className="capitalize">{selectedPatient.gender.toLowerCase()}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" onClick={() => onSelect(null as any)} className="text-[var(--muted-foreground)] hover:text-[var(--destructive)]">
                                Change
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-6"
                    >
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors" />
                                <Input
                                    placeholder="Search by name or phone..."
                                    className="pl-12 h-14 text-lg rounded-xl shadow-sm border-[var(--border)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            <AnimatePresence>
                                {searchResults.length > 0 && !showQuickRegister && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-50 w-full mt-2 overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl max-h-[300px] overflow-y-auto"
                                    >
                                        <div className="p-1">
                                            {searchResults.map((patient) => (
                                                <button
                                                    key={patient.patient_id}
                                                    onClick={() => onSelect(patient)}
                                                    className="flex items-center gap-4 w-full p-3 hover:bg-[var(--muted)]/50 rounded-lg transition-colors text-left group"
                                                >
                                                    <Avatar className="w-10 h-10 border border-[var(--border)]">
                                                        <AvatarFallback className="text-xs font-semibold bg-[var(--primary)]/5 text-[var(--primary)]">
                                                            {(patient.first_name[0] + patient.last_name[0]).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-sm group-hover:text-[var(--primary)] transition-colors">{patient.first_name} {patient.last_name}</p>
                                                        <p className="text-xs text-[var(--muted-foreground)]">{patient.phone}</p>
                                                    </div>
                                                    {patient.last_visit && (
                                                        <div className="text-xs text-[var(--muted-foreground)] text-right">
                                                            <p>Last visit</p>
                                                            <p className="font-medium">{new Date(patient.last_visit).toLocaleDateString()}</p>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Quick Register Toggle */}
                        <div className="flex flex-col items-center gap-4">
                            {!showQuickRegister ? (
                                <button
                                    onClick={() => setShowQuickRegister(true)}
                                    className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] flex items-center gap-2 transition-colors py-2"
                                >
                                    Patient not found? <span className="font-semibold underline">Quick Register</span>
                                </button>
                            ) : null}
                        </div>

                        {/* Inline Registration Form */}
                        <AnimatePresence>
                            {showQuickRegister && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <Card className="border-[var(--border)] bg-[var(--bg-canvas)]/50">
                                        <div className="p-6 space-y-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-semibold flex items-center gap-2 text-lg">
                                                    <UserPlus className="w-5 h-5 text-[var(--primary)]" />
                                                    New Patient Registration
                                                </h3>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
                                                    onClick={() => setShowQuickRegister(false)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <PatientRegistrationForm
                                                onSubmit={async (formData) => await handleCreatePatient(formData)}
                                                submitLabel="Create & Select Patient"
                                                onCancel={() => setShowQuickRegister(false)}
                                            />
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
