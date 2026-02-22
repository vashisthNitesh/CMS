"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
    // Using AnimatePresence at the layout level in Next.js app router 
    // requires it to be above the template, or we just rely on standard unmount mapping.
    // Template remounts its children on navigation, triggering the initial animation.
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col flex-1 h-full w-full"
        >
            {children}
        </motion.div>
    );
}
