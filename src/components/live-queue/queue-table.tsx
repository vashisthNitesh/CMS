"use client";

import { motion, AnimatePresence } from "framer-motion";
import { QueueRow } from "./queue-row";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { QueueItem } from "@/hooks/use-live-queue";

interface QueueTableProps {
    queue: QueueItem[];
    selectedId?: string;
    onSelect: (item: QueueItem) => void;
    onStatusChange: (id: string, status: string) => void;
}

export function QueueTable({ queue, selectedId, onSelect, onStatusChange }: QueueTableProps) {
    return (
        <div className="flex-1 bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/30 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="font-semibold text-[var(--foreground)]">Patient Queue</h2>
            </div>
            <div className="flex-1 relative min-h-0">
                <ScrollArea className="h-full w-full">
                    <div className="p-4 space-y-2 pb-20"> {/* pb-20 for FAB space if needed */}
                        <AnimatePresence mode="popLayout">
                            {queue.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-20 text-[var(--muted-foreground)]"
                                >
                                    Queue is empty. Great job! 🎉
                                </motion.div>
                            ) : (
                                queue.map((item) => (
                                    <QueueRow
                                        key={item.appointment_id}
                                        item={item}
                                        isSelected={selectedId === item.appointment_id}
                                        onSelect={onSelect}
                                        onStatusChange={onStatusChange}
                                    />
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
