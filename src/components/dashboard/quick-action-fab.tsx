"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CalendarPlus, UserPlus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function QuickActionFab() {
    const [isOpen, setIsOpen] = useState(false);

    const actions = [
        { icon: CalendarPlus, label: "Book Appointment", href: "/dashboard/receptionist/book", color: "bg-blue-600" },
        { icon: UserPlus, label: "Add Patient", href: "/dashboard/patients/new", color: "bg-emerald-600" },
        { icon: FileText, label: "New Report", href: "/dashboard/reports/new", color: "bg-violet-600" }
    ];

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
            <AnimatePresence>
                {isOpen && (
                    <div className="flex flex-col items-end gap-3 mb-2">
                        {actions.map((action, index) => (
                            <motion.div
                                key={action.label}
                                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                transition={{ delay: index * 0.05, duration: 0.2 }}
                                className="flex items-center gap-3"
                            >
                                <span className="bg-[var(--bg-surface)] text-[var(--text-primary)] px-2 py-1 rounded-md text-xs font-medium shadow-md border border-[var(--border)]">
                                    {action.label}
                                </span>
                                <Link href={action.href}>
                                    <Button
                                        size="icon"
                                        className={`${action.color} text-white hover:opacity-90 rounded-full h-10 w-10 shadow-lg`}
                                    >
                                        <action.icon className="w-5 h-5" />
                                    </Button>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-14 w-14 shadow-xl shadow-blue-600/30 flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/30"
            >
                <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Plus className="w-8 h-8" />
                </motion.div>
            </motion.button>
        </div>
    );
}
