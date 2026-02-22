"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProfileTabsProps {
    tabs: string[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function ProfileTabs({ tabs, activeTab, onTabChange }: ProfileTabsProps) {
    return (
        <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] sticky top-[80px] z-30 transition-all duration-200">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => onTabChange(tab)}
                                className={cn(
                                    "relative py-4 text-sm font-medium transition-colors hover:text-[var(--primary)] whitespace-nowrap",
                                    isActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                                )}
                            >
                                {tab}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
