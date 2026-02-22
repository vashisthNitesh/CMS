"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { User, Activity, AlertCircle, RefreshCw, FileText, Pill, FlaskConical, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Simulated AI Context Data
const MOCK_AI_CONTEXT = {
    confidence: 88,
    allergies: ["Penicillin - High Severity", "Peanuts - Mild"],
    lastVisit: "Follow-up for hypertension (2 months ago). BP was 145/90. Prescribed Lisinopril 10mg.",
    medications: ["Lisinopril 10mg (Daily)", "Metformin 500mg (BID)"],
    pendingLabs: ["HbA1c (Drawn today)", "Lipid Panel (Drawn today)"]
};

export function PatientPanel({ appointment }: { appointment: any }) {
    const initials = `${appointment.first_name?.[0] || ""}${appointment.last_name?.[0] || ""}`;
    const [aiState, setAiState] = useState<"generating" | "success" | "error">("generating");
    const [revealedSections, setRevealedSections] = useState<string[]>([]);

    useEffect(() => {
        // Simulate API call and staggered reveal
        const timer = setTimeout(() => {
            setAiState("success");

            // Staggered reveal
            const sections = ["allergies", "lastVisit", "medications", "pendingLabs"];
            sections.forEach((section, index) => {
                setTimeout(() => {
                    setRevealedSections(prev => [...prev, section]);
                }, index * 400); // 400ms stagger between sections
            });
        }, 2000); // 2s initial loading

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col h-full bg-[var(--bg-sidebar)]">
            <div className="p-4 flex-1 overflow-y-auto space-y-6">

                {/* Patient Card */}
                <Card className="p-4 border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border border-[var(--border)]">
                            <AvatarImage src={appointment.avatar_url || ""} />
                            <AvatarFallback className="bg-[var(--primary)]/10 text-[var(--primary)] font-medium">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-semibold text-[var(--text-primary)]">
                                {appointment.first_name} {appointment.last_name}
                            </h2>
                            <div className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-2">
                                <span>{appointment.patient_id.split('-')[0].toUpperCase()}</span>
                                <span>•</span>
                                <span>{appointment.age || "32"} yrs</span>
                                {appointment.blood_group && (
                                    <>
                                        <span>•</span>
                                        <span className="text-red-500 font-medium">{appointment.blood_group}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* AI Context Card */}
                <Accordion type="single" collapsible defaultValue="ai-context" className="w-full">
                    <AccordionItem value="ai-context" className="border-none">
                        <AccordionTrigger className="hover:no-underline py-2 px-1">
                            <div className="flex items-center justify-between w-full pr-2">
                                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-[var(--primary)]" />
                                    AI Visit Context
                                </h3>
                                {aiState === "success" && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                        {MOCK_AI_CONTEXT.confidence}% Match
                                    </span>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-1">
                            <div className={cn(
                                "relative rounded-xl border bg-[var(--bg-card)] overflow-hidden transition-all duration-300",
                                aiState === "generating" ? "border-transparent" : "border-[var(--border)] shadow-sm"
                            )}>
                                {/* Animated Gradient Border during generation */}
                                {aiState === "generating" && (
                                    <div className="absolute inset-0 p-[2px] rounded-xl overflow-hidden pointer-events-none">
                                        <div className="absolute inset-[-100%] bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] animate-[spin_2s_linear_infinite]" />
                                        <div className="absolute inset-[1px] bg-[var(--bg-card)] rounded-xl" />
                                    </div>
                                )}

                                <div className="relative p-4 z-10">
                                    <AnimatePresence mode="wait">
                                        {aiState === "generating" && (
                                            <motion.div
                                                key="generating"
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex flex-col items-center justify-center py-8 space-y-4"
                                            >
                                                <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin" />
                                                <p className="text-sm text-[var(--text-secondary)] animate-pulse">
                                                    Preparing context...
                                                </p>

                                                {/* Shimmer Skeleton */}
                                                <div className="w-full space-y-3 mt-4">
                                                    <div className="h-4 bg-[var(--bg-sidebar)] rounded-md w-3/4 animate-pulse" />
                                                    <div className="h-4 bg-[var(--bg-sidebar)] rounded-md w-full animate-pulse" />
                                                    <div className="h-4 bg-[var(--bg-sidebar)] rounded-md w-5/6 animate-pulse" />
                                                </div>
                                            </motion.div>
                                        )}

                                        {aiState === "error" && (
                                            <motion.div
                                                key="error"
                                                initial={{ opacity: 0, scale: 1.02 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ duration: 0.3 }}
                                                className="flex flex-col items-center justify-center py-6 text-center space-y-3"
                                            >
                                                <AlertCircle className="w-8 h-8 text-red-500/80" />
                                                <p className="text-sm font-medium text-[var(--text-primary)]">Context Generation Failed</p>
                                                <p className="text-xs text-[var(--text-secondary)]">We couldn't generate the AI context for this visit.</p>
                                            </motion.div>
                                        )}

                                        {aiState === "success" && (
                                            <motion.div
                                                key="success"
                                                initial={{ opacity: 0, scale: 1.02 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-5"
                                            >
                                                {/* Allergies - Always First, Always Red Highlighted */}
                                                <div className={cn(
                                                    "transition-all duration-500 transform",
                                                    revealedSections.includes("allergies") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                                )}>
                                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400">
                                                        <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                                                        <div>
                                                            <div className="text-xs font-bold uppercase tracking-wider mb-1">Allergies</div>
                                                            <ul className="text-sm space-y-0.5 font-medium list-disc list-inside">
                                                                {MOCK_AI_CONTEXT.allergies.map((allergy, i) => (
                                                                    <li key={i}>{allergy}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Last Visit Summary */}
                                                <div className={cn(
                                                    "transition-all duration-500 transform",
                                                    revealedSections.includes("lastVisit") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                                )}>
                                                    <div className="flex items-start gap-2 text-[var(--text-primary)]">
                                                        <FileText className="w-4 h-4 mt-0.5 text-[var(--primary)] shrink-0" />
                                                        <div>
                                                            <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Last Visit Summary</div>
                                                            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                                                                {MOCK_AI_CONTEXT.lastVisit}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Current Medications */}
                                                <div className={cn(
                                                    "transition-all duration-500 transform",
                                                    revealedSections.includes("medications") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                                )}>
                                                    <div className="flex items-start gap-2 text-[var(--text-primary)]">
                                                        <Pill className="w-4 h-4 mt-0.5 text-orange-500 shrink-0" />
                                                        <div>
                                                            <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Current Medications</div>
                                                            <ul className="text-sm space-y-0.5 text-[var(--text-secondary)]">
                                                                {MOCK_AI_CONTEXT.medications.map((med, i) => (
                                                                    <li key={i}>• {med}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Pending Labs */}
                                                <div className={cn(
                                                    "transition-all duration-500 transform",
                                                    revealedSections.includes("pendingLabs") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                                )}>
                                                    <div className="flex items-start gap-2 text-[var(--text-primary)]">
                                                        <FlaskConical className="w-4 h-4 mt-0.5 text-purple-500 shrink-0" />
                                                        <div>
                                                            <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Pending Labs</div>
                                                            <ul className="text-sm space-y-0.5 text-[var(--text-secondary)]">
                                                                {MOCK_AI_CONTEXT.pendingLabs.map((lab, i) => (
                                                                    <li key={i}>• {lab}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>

                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    );
}
