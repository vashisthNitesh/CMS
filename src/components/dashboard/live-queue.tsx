"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, MoreHorizontal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock Queue Data
const QUEUE_ITEMS = [
    { id: 1, name: "Sarah Johnson", time: "10:30 AM", wait: "12 min", status: "in_consultation", avatar: "SJ" },
    { id: 2, name: "Michael Chen", time: "10:45 AM", wait: "5 min", status: "waiting", avatar: "MC" },
    { id: 3, name: "Emma Davis", time: "11:00 AM", wait: "On time", status: "upcoming", avatar: "ED" },
    { id: 4, name: "James Wilson", time: "11:15 AM", wait: "On time", status: "upcoming", avatar: "JW" },
    { id: 5, name: "Linda Martinez", time: "11:30 AM", wait: "On time", status: "upcoming", avatar: "LM" },
];

export function LiveQueue() {
    return (
        <Card className="h-full border-[var(--border-subtle)] shadow-sm col-span-12 lg:col-span-4 flex flex-col min-h-0">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-5 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <CardTitle className="text-base font-semibold">Live Queue</CardTitle>
                    <Badge variant="secondary" className="ml-2 bg-[var(--bg-surface-sunken)]">12 Total</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text-tertiary)]">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative min-h-0">
                <ScrollArea className="absolute inset-0">
                    <div className="divide-y divide-[var(--border-subtle)]">
                        {QUEUE_ITEMS.map((item, index) => (
                            <motion.div
                                key={item.id}
                                layoutId={`queue-item-${item.id}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1, layout: { type: "spring", bounce: 0, duration: 0.4 } }}
                                className="p-4 flex items-center justify-between hover:bg-[var(--bg-surface-sunken)]/50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-10 w-10 border border-[var(--border-subtle)]">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.name}`} />
                                            <AvatarFallback>{item.avatar}</AvatarFallback>
                                        </Avatar>
                                        {item.status === "in_consultation" && (
                                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1E293B]">
                                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text-primary)]">{item.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                                            <Clock className="w-3 h-3" />
                                            <span>{item.time}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 relative h-6 w-24">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={item.status}
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            transition={{ duration: 0.2 }}
                                            className={`absolute right-0 text-xs font-medium px-2 py-0.5 rounded-full ${item.status === "in_consultation" ? "bg-emerald-500/10 text-emerald-600" :
                                                item.status === "waiting" ? "bg-amber-500/10 text-amber-600" :
                                                    "bg-blue-500/5 text-blue-600"
                                                }`}
                                        >
                                            {item.status === "in_consultation" ? "In Consult" :
                                                item.status === "waiting" ? "Waiting" : "Upcoming"}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                                <span className="text-[10px] text-[var(--text-tertiary)] mt-1">{item.wait}</span>
                            </motion.div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-sunken)]/30">
                <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs flex items-center justify-center gap-2 h-8">
                    View Full Queue <ArrowRight className="w-3 h-3" />
                </Button>
            </div>
        </Card>
    );
}
