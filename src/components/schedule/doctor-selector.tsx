"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Doctor {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface DoctorSelectorProps {
    doctors: Doctor[];
    selectedId: string;
    onSelect: (id: string) => void;
    locked?: boolean;
}

export function DoctorSelector({ doctors, selectedId, onSelect, locked }: DoctorSelectorProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const selected = doctors.find((d) => d.user_id === selectedId);

    const filtered = useMemo(() => {
        if (!search) return doctors;
        const q = search.toLowerCase();
        return doctors.filter(
            (d) =>
                d.first_name.toLowerCase().includes(q) ||
                d.last_name.toLowerCase().includes(q)
        );
    }, [doctors, search]);

    if (locked && selected) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)]">
                <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                    {selected.first_name[0]}{selected.last_name[0]}
                </div>
                <span className="font-medium text-sm">Dr. {selected.first_name} {selected.last_name}</span>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)]",
                    "bg-[var(--card)]/60 hover:bg-[var(--card)] transition-colors text-sm min-w-[200px]"
                )}
            >
                {selected ? (
                    <>
                        <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[10px] font-bold text-[var(--primary)]">
                            {selected.first_name[0]}{selected.last_name[0]}
                        </div>
                        <span className="font-medium">Dr. {selected.first_name} {selected.last_name}</span>
                    </>
                ) : (
                    <span className="text-[var(--muted-foreground)]">Select doctor...</span>
                )}
                <ChevronDown className="w-4 h-4 ml-auto text-[var(--muted-foreground)]" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 z-50 w-72 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden">
                        <div className="p-2 border-b border-[var(--border)]">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search doctors..."
                                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-[var(--muted)]/50 rounded-lg border-none outline-none placeholder:text-[var(--muted-foreground)]"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1">
                            {filtered.length === 0 ? (
                                <p className="text-xs text-[var(--muted-foreground)] text-center py-4">No doctors found</p>
                            ) : (
                                filtered.map((d) => (
                                    <button
                                        key={d.user_id}
                                        type="button"
                                        onClick={() => { onSelect(d.user_id); setOpen(false); setSearch(""); }}
                                        className={cn(
                                            "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm transition-colors",
                                            d.user_id === selectedId
                                                ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                                : "hover:bg-[var(--muted)]/50"
                                        )}
                                    >
                                        <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[10px] font-bold text-[var(--primary)]">
                                            {d.first_name[0]}{d.last_name[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium">Dr. {d.first_name} {d.last_name}</p>
                                            <p className="text-[10px] text-[var(--muted-foreground)]">{d.email}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
