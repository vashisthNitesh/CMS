"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Phone, MapPin, Calendar, Stethoscope, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewTabProps {
    patient: any; // Using any for now, ideally types should be shared
}

export function OverviewTab({ patient }: OverviewTabProps) {
    // Mock data for now
    const allergies = patient.allergies || [];
    const medicalConditions = ["Hypertension", "Type 2 Diabetes"];
    const recentAppointments = [
        { date: "2024-02-15", doctor: "Dr. Sarah Smith", status: "COMPLETED", type: "Follow-up" },
        { date: "2024-01-10", doctor: "Dr. James Wilson", status: "COMPLETED", type: "General Checkup" },
        { date: "2023-11-05", doctor: "Dr. Sarah Smith", status: "COMPLETED", type: "Lab Review" },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6 max-w-7xl mx-auto px-6">
            {/* Left Column */}
            <div className="space-y-6 lg:col-span-1">
                {/* Allergies Card */}
                <Card className="border-red-200 bg-red-50/10 shadow-sm overflow-hidden">
                    <CardHeader className="pb-3 border-b border-red-100/50 bg-red-50/30">
                        <CardTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5" /> Allergies
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {allergies.map((allergy: string) => (
                                    <Badge key={allergy} variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
                                        {allergy}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="font-medium text-sm">No known allergies</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Phone className="w-4 h-4" />
                            </span>
                            Contact Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 text-sm">
                            <Phone className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5" />
                            <div>
                                <p className="font-medium">{patient.phone}</p>
                                <p className="text-xs text-[var(--muted-foreground)]">Mobile</p>
                            </div>
                        </div>
                        {patient.email && (
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-4 h-4 flex items-center justify-center text-[var(--muted-foreground)]">@</div>
                                <div>
                                    <p className="font-medium">{patient.email}</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">Email</p>
                                </div>
                            </div>
                        )}
                        {patient.address && (
                            <div className="flex items-start gap-3 text-sm">
                                <MapPin className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5" />
                                <div>
                                    <p className="font-medium text-[var(--foreground)]">{patient.address}</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">Home Address</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4" />
                            </span>
                            Emergency Contact
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <p className="font-medium">Jane Doe (Wife)</p>
                            <p className="text-sm text-[var(--muted-foreground)]">+1 (555) 987-6543</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6 lg:col-span-2">
                {/* Medical History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Stethoscope className="w-4 h-4" />
                            </span>
                            Medical History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {medicalConditions.map((condition) => (
                                <Badge key={condition} variant="outline" className="px-3 py-1 text-sm bg-purple-50/50 text-purple-700 border-purple-200">
                                    {condition}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Appointments */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Calendar className="w-4 h-4" />
                            </span>
                            Recent Appointments
                        </CardTitle>
                        <button className="text-xs font-semibold text-[var(--primary)] hover:underline">View All</button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-[var(--border)]">
                            {recentAppointments.map((apt, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-[var(--muted)]/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-[var(--muted)] rounded-lg text-xs font-medium">
                                            <span className="text-[var(--muted-foreground)]">{new Date(apt.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                                            <span className="text-lg font-bold text-[var(--foreground)]">{new Date(apt.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{apt.type}</p>
                                            <p className="text-xs text-[var(--muted-foreground)]">{apt.doctor}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-transparent hover:bg-emerald-200">
                                        {apt.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
