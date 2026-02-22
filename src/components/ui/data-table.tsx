"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
    key: string;
    label: string;
    className?: string;
    render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    searchable?: boolean;
    searchPlaceholder?: string;
    searchKeys?: string[];
    pageSize?: number;
    rowKey: (row: T) => string;
    onRowClick?: (row: T) => void;
    toolbar?: React.ReactNode;
    emptyState?: React.ReactNode;
}

export function DataTable<T extends Record<string, unknown>>({
    columns,
    data,
    searchable = true,
    searchPlaceholder = "Search...",
    searchKeys = [],
    pageSize = 15,
    rowKey,
    onRowClick,
    toolbar,
    emptyState,
}: DataTableProps<T>) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => {
        if (!search || searchKeys.length === 0) return data;
        const q = search.toLowerCase();
        return data.filter((row) =>
            searchKeys.some((key) => {
                const val = row[key];
                return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
            })
        );
    }, [data, search, searchKeys]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

    return (
        <Card className="overflow-hidden flex flex-col animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            {/* Toolbar */}
            {(searchable || toolbar) && (
                <div className="p-4 border-b border-[var(--border)] flex items-center gap-3 flex-wrap">
                    {searchable && (
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                className="pl-9"
                            />
                        </div>
                    )}
                    {toolbar}
                </div>
            )}

            {/* Table */}
            <div className="overflow-auto flex-1">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-[var(--muted)]/50 text-[var(--muted-foreground)] sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key} className={cn("px-5 py-3.5 font-medium whitespace-nowrap", col.className)}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-5 py-16 text-center">
                                    {emptyState || (
                                        <p className="text-sm text-[var(--muted-foreground)]">No results found.</p>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            paged.map((row) => (
                                <tr
                                    key={rowKey(row)}
                                    onClick={() => onRowClick?.(row)}
                                    className={cn(
                                        "border-b border-[var(--border)]/50 hover:bg-white/[0.02] transition-colors",
                                        onRowClick && "cursor-pointer"
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className={cn("px-5 py-3.5 whitespace-nowrap", col.className)}>
                                            {col.render ? col.render(row) : (row[col.key] as React.ReactNode) ?? "—"}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filtered.length > pageSize && (
                <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span>
                        Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-1.5 rounded-lg hover:bg-white/[0.04] disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-2 tabular-nums">
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="p-1.5 rounded-lg hover:bg-white/[0.04] disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
}
