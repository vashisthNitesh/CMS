import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";

export default async function SchedulePage() {
    const session = await requireSession();
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];

    // Get slots for next 7 days
    const slots = await db.query(
        `SELECT s.*, u.first_name, u.last_name 
         FROM appointment_slots s
         JOIN users u ON s.doctor_id = u.user_id
         WHERE s.clinic_id = $1 AND s.slot_date >= $2
         ORDER BY s.slot_date, s.slot_start_time`,
        [session.clinic_id, startDate]
    );

    // Group by date
    const slotsByDate: Record<string, any[]> = {};
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        dates.push({
            date: dateStr,
            display: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
        });
        slotsByDate[dateStr] = slots.rows.filter((s: any) =>
            new Date(s.slot_date).toISOString().split('T')[0] === dateStr
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
                    <p className="text-[var(--muted-foreground)] mt-1">Manage doctor availability and appointment slots.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline">
                        Today
                    </Button>
                    <Button variant="outline" size="icon">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button className="gap-2 shadow-lg shadow-primary/20 ml-2">
                        <Plus className="w-4 h-4" />
                        Add Slots
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 flex-1 min-h-0">
                {dates.map((day, i) => (
                    <Card key={day.date} className="flex flex-col h-full bg-[var(--card)]/40 hover:bg-[var(--card)]/60 transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className={`p-3 text-center border-b border-[var(--border)] ${i === 0 ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''}`}>
                            <p className="font-semibold">{day.display}</p>
                        </div>
                        <div className="flex-1 p-2 space-y-2 overflow-auto">
                            {slotsByDate[day.date].length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[var(--muted-foreground)] text-xs py-8">
                                    No slots
                                </div>
                            ) : (
                                slotsByDate[day.date].map((slot: any) => (
                                    <div key={slot.slot_id} className="p-2 rounded bg-[var(--muted)]/50 border border-[var(--border)] group hover:border-[var(--primary)]/50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-1 text-xs font-medium mb-1">
                                            <Clock className="w-3 h-3 text-[var(--muted-foreground)]" />
                                            {slot.slot_start_time.slice(0, 5)}
                                        </div>
                                        <p className="text-xs truncate">Dr. {slot.last_name}</p>
                                        <Badge variant={slot.status === 'AVAILABLE' ? 'outline' : 'secondary'} className="mt-1 text-[10px] h-5 px-1.5">
                                            {slot.status}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
