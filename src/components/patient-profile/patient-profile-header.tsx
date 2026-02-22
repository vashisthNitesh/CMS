"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, Edit2, Printer, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientProfileHeaderProps {
    patient: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        age: number;
        gender: string;
        bloodGroup?: string;
        phone: string;
        address?: string;
    };
}

export function PatientProfileHeader({ patient }: PatientProfileHeaderProps) {
    const { scrollY } = useScroll();

    // Height transformation: 140px -> 80px
    const headerHeight = useTransform(scrollY, [0, 100], [140, 80]);
    // Avatar size: 80px -> 40px
    const avatarSize = useTransform(scrollY, [0, 100], [80, 40]);
    // Name size: 2xl -> lg (simulated via scale/origin)
    // Actually better to swap classes or use motion values for fontSize if possible, but scale is smoother
    const nameScale = useTransform(scrollY, [0, 100], [1, 0.8]);
    const nameOriginX = useTransform(scrollY, [0, 100], [0, 0]);

    // Opacity for elements that disappear on scroll
    const detailsOpacity = useTransform(scrollY, [0, 50], [1, 0]);
    const detailsHeight = useTransform(scrollY, [0, 50], ["auto", 0]);

    return (
        <motion.div
            style={{ height: headerHeight }}
            className="sticky top-0 z-40 w-full bg-[var(--bg-surface)]/80 backdrop-blur-md border-b border-[var(--border)] transition-all duration-200"
        >
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* Avatar */}
                    <motion.div style={{ width: avatarSize, height: avatarSize }} className="relative shrink-0">
                        <Avatar className="w-full h-full border-2 border-[var(--bg-canvas)] shadow-md">
                            <AvatarImage src={patient.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl">
                                {patient.firstName[0]}{patient.lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                    </motion.div>

                    {/* Check if we can use a simpler approach for the name/details switching */}
                    <div className="flex flex-col justify-center">
                        <motion.div className="flex items-center gap-3 origin-left">
                            <h1 className="text-2xl font-bold font-heading tracking-tight text-[var(--foreground)]">
                                {patient.firstName} {patient.lastName}
                            </h1>
                            <motion.div style={{ opacity: detailsOpacity }}>
                                <Badge variant="secondary" className="font-mono text-xs text-[var(--muted-foreground)] bg-[var(--muted)]">
                                    ID: {patient.id}
                                </Badge>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            style={{ opacity: detailsOpacity, height: detailsHeight }}
                            className="flex items-center gap-4 text-sm text-[var(--muted-foreground)] overflow-hidden"
                        >
                            <span className="flex items-center gap-1">
                                {patient.age} yrs • {patient.gender}
                            </span>
                            {patient.bloodGroup && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                                    <span className="font-medium text-[var(--foreground)]">{patient.bloodGroup}</span>
                                </>
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                        <CalendarPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Book Appointment</span>
                    </Button>
                    <Button variant="outline" size="icon" title="Edit Profile">
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Print Card">
                        <Printer className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
