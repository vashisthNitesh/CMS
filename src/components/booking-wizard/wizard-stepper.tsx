"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStepperProps {
    currentStep: number;
    steps: { label: string; number: number }[];
}

export function WizardStepper({ currentStep, steps }: WizardStepperProps) {
    return (
        <div className="relative flex items-center justify-between w-full max-w-xl mx-auto mb-8 md:mb-12 px-2 md:px-0">
            {/* Background Line */}
            <div className="absolute top-1/2 left-4 right-4 md:left-0 md:right-0 h-[2px] bg-[var(--border)] -z-10 rounded-full" />

            {/* Animated Progress Line */}
            <motion.div
                className="absolute top-1/2 left-4 right-4 md:left-0 md:right-0 h-[2px] bg-[var(--primary)] -z-10 rounded-full origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: (currentStep - 1) / (steps.length - 1) }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
            />

            {steps.map((step) => {
                const status =
                    currentStep > step.number
                        ? "completed"
                        : currentStep === step.number
                            ? "active"
                            : "pending";

                return (
                    <div key={step.number} className="flex flex-col items-center gap-2 md:gap-3 bg-[var(--bg-canvas)] px-1 md:px-2 z-10 w-[72px] md:w-auto">
                        <motion.div
                            initial={false}
                            animate={{
                                backgroundColor:
                                    status === "pending"
                                        ? "var(--muted)"
                                        : "var(--primary)",
                                scale: status === "active" ? 1.1 : 1,
                                borderColor: status === "pending" ? "var(--border)" : "var(--primary)",
                            }}
                            className={cn(
                                "flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-2 shadow-sm transition-colors duration-400 mx-auto",
                                status === "pending" && "text-[var(--muted-foreground)] bg-[var(--bg-surface)]",
                                status !== "pending" && "text-primary-foreground shadow-md shadow-primary/25"
                            )}
                        >
                            {status === "completed" ? (
                                <Check className="w-4 h-4 md:w-5 md:h-5 stroke-[3px]" />
                            ) : (
                                <span className="text-xs md:text-sm font-bold">{step.number}</span>
                            )}
                        </motion.div>
                        <span
                            className={cn(
                                "text-[9px] md:text-xs font-bold uppercase tracking-wider transition-all duration-400 select-none text-center leading-tight md:whitespace-nowrap",
                                status === "active" ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]",
                                status === "completed" && "text-[var(--muted-foreground)] line-through decoration-2 opacity-70"
                            )}
                        >
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
