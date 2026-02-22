"use client";

import { useState, useEffect, useCallback } from "react";
import type { Appointment } from "@/lib/types";

// Mock data generator
const NAMES = ["Emma Wilson", "James Rodriquez", "Sarah Chen", "Michael Brown", "Lisa Wang", "Robert Taylor", "David Anderson", "Jennifer Thomas"];
const DOCTORS = ["Dr. Smith", "Dr. Jones", "Dr. Lee", "Dr. Patil"];
const TYPES = ["New Patient", "Follow Up", "Routine Checkup", "Urgent"];

export interface QueueItem extends Appointment {
    wait_minutes: number;
    queue_number: number;
    is_emergency?: boolean;
}

export interface QueueStats {
    total: number;
    checked_in: number;
    in_consultation: number;
    completed: number;
    no_show: number;
}

export function useLiveQueue() {
    // Initialize mock queue
    const [queue, setQueue] = useState<QueueItem[]>(() => {
        return Array.from({ length: 8 }).map((_, i) => ({
            appointment_id: `apt-${i}`,
            clinic_id: "clinic-1",
            patient_id: `pat-${i}`,
            doctor_id: `doc-${i % 4}`,
            slot_id: `slot-${i}`,
            appointment_date: new Date().toISOString(),
            appointment_time: new Date(Date.now() + i * 1800000).toISOString(),
            visit_type: TYPES[i % 4],
            status: i === 0 ? "IN_CONSULTATION" : "CHECKED_IN",
            is_first_visit: false,
            rescheduled_count: 0,
            source: "WEB",
            patient_name: NAMES[i],
            doctor_name: DOCTORS[i % 4],
            wait_minutes: Math.max(0, 35 - i * 5), // Descending wait times
            queue_number: i + 1,
            is_emergency: i === 2, // Mock one emergency
        }));
    });

    const [selectedPatient, setSelectedPatient] = useState<QueueItem | null>(queue[0]);
    const [isConnected, setIsConnected] = useState(true);
    const [stats, setStats] = useState<QueueStats>({
        total: 45,
        checked_in: 12,
        in_consultation: 3,
        completed: 28,
        no_show: 2
    });

    // 1. Simulate Clock Tick (Wait times)
    useEffect(() => {
        const interval = setInterval(() => {
            setQueue(prev => prev.map(item => ({
                ...item,
                wait_minutes: item.status === "CHECKED_IN" ? item.wait_minutes + 1 : item.wait_minutes
            })));
        }, 60000); // Every minute
        return () => clearInterval(interval);
    }, []);

    // 2. Simulate Random Status Changes / New Patients
    useEffect(() => {
        const interval = setInterval(() => {
            const random = Math.random();
            if (random > 0.7) {
                // Flash connection to simulate activity
                setIsConnected(false);
                setTimeout(() => setIsConnected(true), 200);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleStatusChange = useCallback((appointmentId: string, newStatus: string) => {
        setQueue(prev => prev.map(item =>
            item.appointment_id === appointmentId
                ? { ...item, status: newStatus }
                : item
        ));

        // Update stats mock
        setStats(prev => {
            const newStats = { ...prev };
            if (newStatus === "COMPLETED") newStats.completed++;
            if (newStatus === "IN_CONSULTATION") newStats.in_consultation++;
            if (newStatus === "NO_SHOW") newStats.no_show++;
            return newStats;
        });
    }, []);

    return {
        queue,
        stats,
        selectedPatient,
        setSelectedPatient,
        isConnected,
        handleStatusChange
    };
}
