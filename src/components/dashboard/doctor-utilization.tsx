"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const DATA = [
    { name: "Dr. Smith", patients: 12, capacity: 15, color: "#3B82F6" },
    { name: "Dr. Jones", patients: 19, capacity: 20, color: "#10B981" },
    { name: "Dr. Lee", patients: 8, capacity: 12, color: "#F59E0B" },
    { name: "Dr. Patil", patients: 15, capacity: 15, color: "#EF4444" },
    { name: "Dr. Chen", patients: 10, capacity: 18, color: "#8B5CF6" },
];

export function DoctorUtilization() {
    return (
        <Card className="h-full border-[var(--border-subtle)] shadow-sm col-span-12 lg:col-span-6 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-6">
                <div>
                    <CardTitle className="text-base font-semibold">Doctor Utilization</CardTitle>
                    <CardDescription>Patients seen today vs capacity</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text-tertiary)]">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-[250px] p-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={DATA}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        barSize={20}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" opacity={0.5} />
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                            width={80}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: "var(--bg-surface-sunken)", opacity: 0.5 }}
                            contentStyle={{
                                backgroundColor: "var(--bg-surface)",
                                borderColor: "var(--border-subtle)",
                                borderRadius: "8px",
                                boxShadow: "var(--shadow-md)"
                            }}
                        />
                        <Bar dataKey="patients" radius={[0, 4, 4, 0]}>
                            {DATA.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
