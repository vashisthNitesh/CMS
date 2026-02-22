"use client";

import { motion } from "framer-motion";
import { Users, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AppointmentCalendar } from "@/components/dashboard/appointment-calendar";
import { LiveQueue } from "@/components/dashboard/live-queue";
import { DoctorUtilization } from "@/components/dashboard/doctor-utilization";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActionFab } from "@/components/dashboard/quick-action-fab";
import type { SessionUser } from "@/lib/types";

interface DashboardContentProps {
    user: SessionUser;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export function DashboardContent({ user }: DashboardContentProps) {
    return (
        <div className="min-h-[calc(100vh-60px)] p-4 md:p-6 lg:p-8 space-y-8 bg-[var(--bg-canvas)]">
            <div className="flex flex-col gap-2 mb-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                        Good Morning, {user.first_name} 👋
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        Here&apos;s what&apos;s happening at your clinic today.
                    </p>
                </motion.div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <motion.div variants={item}>
                    <MetricCard
                        title="Today's Appointments"
                        value={42}
                        trend={{ value: 12, isPositive: true, label: "vs yesterday" }}
                        icon={Calendar}
                        color="#3B82F6"
                    />
                </motion.div>
                <motion.div variants={item}>
                    <MetricCard
                        title="Revenue Today"
                        value={user.role === "clinic_owner" ? "$3,240" : "---"}
                        trend={{ value: 8, isPositive: true, label: "vs yesterday" }}
                        icon={DollarSign}
                        color="#10B981"
                    />
                </motion.div>
                <motion.div variants={item}>
                    <MetricCard
                        title="Active Queue"
                        value={12}
                        trend={{ value: 2, isPositive: false, label: "waiting > 15m" }}
                        icon={Users}
                        color="#F59E0B"
                    />
                </motion.div>
                <motion.div variants={item}>
                    <MetricCard
                        title="No-Show Rate"
                        value="4.2%"
                        trend={{ value: 1.1, isPositive: true, label: "vs last week" }}
                        icon={TrendingUp}
                        color="#EF4444"
                    />
                </motion.div>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-12 gap-6"
            >
                {/* Middle Row */}
                <motion.div variants={item} className="col-span-12 lg:col-span-8 min-h-[500px] lg:min-h-[400px] flex flex-col">
                    <AppointmentCalendar />
                </motion.div>
                <motion.div variants={item} className="col-span-12 lg:col-span-4 min-h-[500px] lg:min-h-[400px] flex flex-col">
                    <LiveQueue />
                </motion.div>

                {/* Bottom Row */}
                <motion.div variants={item} className="col-span-12 lg:col-span-6 min-h-[350px] flex flex-col">
                    <DoctorUtilization />
                </motion.div>
                <motion.div variants={item} className="col-span-12 lg:col-span-6 min-h-[350px] flex flex-col">
                    <RecentActivity />
                </motion.div>
            </motion.div>

            <QuickActionFab />
        </div>
    );
}
