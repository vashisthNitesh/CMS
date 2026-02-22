import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface WaitTimeCounterProps {
    minutes: number;
    className?: string;
}

export function WaitTimeCounter({ minutes, className }: WaitTimeCounterProps) {
    const getColor = (m: number) => {
        if (m < 15) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
        if (m < 30) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
        return "text-red-500 bg-red-500/10 border-red-500/20";
    };

    return (
        <div className={cn(
            "relative inline-flex items-center justify-center px-3 py-1.5 rounded-lg border font-mono font-bold transition-colors duration-300",
            getColor(minutes),
            className
        )}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={minutes}
                    initial={{ y: 10, opacity: 0, rotateX: -90 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    exit={{ y: -10, opacity: 0, rotateX: 90 }}
                    transition={{ duration: 0.3 }}
                    className="inline-block"
                >
                    {minutes}
                </motion.span>
            </AnimatePresence>
            <span className="ml-1 text-xs font-medium opacity-80">min</span>
        </div>
    );
}
