"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface ScheduleDrawersProps {
    isBlockOpen: boolean;
    onBlockChange: (open: boolean) => void;
    doctorId: string;
    onRefresh: () => Promise<void>;
}

export function ScheduleDrawers({
    isBlockOpen,
    onBlockChange,
    doctorId,
    onRefresh,
}: ScheduleDrawersProps) {
    const [isPending, startTransition] = useTransition();

    return (
        <Sheet open={isBlockOpen} onOpenChange={onBlockChange}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l-[var(--border)] bg-[var(--bg-surface)] p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-[var(--border)]">
                    <SheetTitle>Add Time Block</SheetTitle>
                    <SheetDescription>
                        Create a leave, holiday, or custom block.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Reuse time block form content here */}
                    <p className="text-sm text-[var(--muted-foreground)]">Form coming soon...</p>
                </div>
                <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--bg-canvas)]">
                    <Button variant="outline" onClick={() => onBlockChange(false)}>Cancel</Button>
                    <Button disabled={isPending}>Save Block</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
