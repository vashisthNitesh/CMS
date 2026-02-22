"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StaggerGridProps {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
    mode?: "sync" | "wait" | "popLayout";
}

const container = {
    hidden: { opacity: 0 },
    show: (staggerDelay: number = 0.05) => ({
        opacity: 1,
        transition: {
            staggerChildren: staggerDelay
        }
    }),
    exit: { opacity: 0, transition: { duration: 0.2 } }
};

const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } }
};

export function StaggerGrid({ children, className, staggerDelay = 0.05, mode = "sync" }: StaggerGridProps) {
    return (
        <AnimatePresence mode={mode}>
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                custom={staggerDelay}
            >
                {/* Exported StaggerItem assumes these container variants are present above it */}
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <motion.div variants={item} className={className}>
            {children}
        </motion.div>
    );
}
