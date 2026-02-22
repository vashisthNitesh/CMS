
// ============================================
// Schedule Utility Functions
// Pure helpers for slot computation, conflict detection, and impact analysis.
// ============================================

/** Convert "HH:MM" or "HH:MM:SS" to total minutes from midnight */
export function timeToMin(t: string): number {
    const p = t.split(":");
    return parseInt(p[0]) * 60 + parseInt(p[1]);
}

/** Convert total minutes from midnight to "HH:MM" */
export function minToTime(m: number): string {
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Format minutes as human-readable duration */
export function formatDuration(min: number): string {
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Compute the number of appointment slots in a time range,
 * accounting for breaks and buffer time.
 */
export function computeSlotCount(
    startMin: number,
    endMin: number,
    slotDuration: number,
    bufferTime: number,
    breaks: { startMin: number; endMin: number }[]
): number {
    let count = 0;
    const cycle = slotDuration + bufferTime;
    for (let m = startMin; m + slotDuration <= endMin; m += cycle) {
        // Skip if slot overlaps any break
        const slotEnd = m + slotDuration;
        const overlapsBreak = breaks.some(
            (b) => m < b.endMin && slotEnd > b.startMin
        );
        if (!overlapsBreak) count++;
    }
    return count;
}

/**
 * Generate the list of individual slot start/end times for a time range.
 */
export function generateSlotTimes(
    startMin: number,
    endMin: number,
    slotDuration: number,
    bufferTime: number,
    breaks: { startMin: number; endMin: number }[]
): { start: string; end: string }[] {
    const slots: { start: string; end: string }[] = [];
    const cycle = slotDuration + bufferTime;
    for (let m = startMin; m + slotDuration <= endMin; m += cycle) {
        const slotEnd = m + slotDuration;
        const overlapsBreak = breaks.some(
            (b) => m < b.endMin && slotEnd > b.startMin
        );
        if (!overlapsBreak) {
            slots.push({ start: minToTime(m), end: minToTime(slotEnd) });
        }
    }
    return slots;
}

/**
 * Check if two time ranges overlap.
 */
export function timesOverlap(
    start1: number, end1: number,
    start2: number, end2: number
): boolean {
    return start1 < end2 && start2 < end1;
}

/**
 * Detect overlapping time slots in an array of {start_time, end_time}.
 */
export function detectOverlaps(
    slots: { start_time: string; end_time: string }[]
): { index1: number; index2: number }[] {
    const conflicts: { index1: number; index2: number }[] = [];
    for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
            if (
                timesOverlap(
                    timeToMin(slots[i].start_time), timeToMin(slots[i].end_time),
                    timeToMin(slots[j].start_time), timeToMin(slots[j].end_time)
                )
            ) {
                conflicts.push({ index1: i, index2: j });
            }
        }
    }
    return conflicts;
}

/** Day-of-week map: JS Date.getDay() index → 3-letter code */
export const DAY_MAP = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

/** Get the 3-letter day code from an ISO date string (YYYY-MM-DD) */
export function getDayCode(dateStr: string): string {
    // Parse the date components locally to avoid UTC timezone shifts
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return DAY_MAP[d.getDay()];
}
