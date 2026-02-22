"use client";

import { useTransition, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";

export interface PatientRegistrationFormProps {
    onSubmit: (formData: FormData) => Promise<void>;
    submitLabel?: string;
    onCancel?: () => void;
    cancelLabel?: string;
}

export function PatientRegistrationForm({
    onSubmit,
    submitLabel = "Register Patient",
    onCancel,
    cancelLabel = "Cancel",
}: PatientRegistrationFormProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (formData: FormData) => {
        setError(null);
        startTransition(async () => {
            try {
                await onSubmit(formData);
            } catch (err: any) {
                setError(err.message || "An unexpected error occurred.");
            }
        });
    };

    return (
        <form action={handleSubmit} className="space-y-6">
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in-up">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input id="first_name" name="first_name" required placeholder="John" className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input id="last_name" name="last_name" required placeholder="Doe" className="mt-1" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" name="age" type="number" min={0} max={150} placeholder="e.g. 32" className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender">
                        <SelectTrigger id="gender" className="w-full mt-1 h-10 rounded-xl border-[var(--input)] bg-white/[0.03] px-3.5 focus:ring-[var(--ring)]/50 focus:border-[var(--ring)]/30 transition-all duration-200">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] shadow-xl">
                            <SelectItem value="MALE" className="rounded-lg cursor-pointer">Male</SelectItem>
                            <SelectItem value="FEMALE" className="rounded-lg cursor-pointer">Female</SelectItem>
                            <SelectItem value="OTHER" className="rounded-lg cursor-pointer">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="blood_group">Blood Group</Label>
                    <Select name="blood_group">
                        <SelectTrigger id="blood_group" className="w-full mt-1 h-10 rounded-xl border-[var(--input)] bg-white/[0.03] px-3.5 focus:ring-[var(--ring)]/50 focus:border-[var(--ring)]/30 transition-all duration-200">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] shadow-xl">
                            <SelectItem value="A+" className="rounded-lg cursor-pointer">A+</SelectItem>
                            <SelectItem value="A-" className="rounded-lg cursor-pointer">A-</SelectItem>
                            <SelectItem value="B+" className="rounded-lg cursor-pointer">B+</SelectItem>
                            <SelectItem value="B-" className="rounded-lg cursor-pointer">B-</SelectItem>
                            <SelectItem value="O+" className="rounded-lg cursor-pointer">O+</SelectItem>
                            <SelectItem value="O-" className="rounded-lg cursor-pointer">O-</SelectItem>
                            <SelectItem value="AB+" className="rounded-lg cursor-pointer">AB+</SelectItem>
                            <SelectItem value="AB-" className="rounded-lg cursor-pointer">AB-</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" name="phone" required placeholder="+91 98765 43210" className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="john@example.com" className="mt-1" />
                </div>
            </div>

            <div>
                <Label htmlFor="address">Address</Label>
                <textarea
                    id="address"
                    name="address"
                    rows={2}
                    placeholder="Street address, city, state, pin code"
                    className="w-full mt-1 px-3.5 py-2 rounded-xl border border-[var(--input)] bg-white/[0.03] text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/50 focus-visible:border-[var(--ring)]/30 placeholder:text-[var(--muted-foreground)]/60 transition-all duration-200"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="allergies">Known Allergies</Label>
                    <Input id="allergies" name="allergies" placeholder="e.g. Penicillin, Dust" className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="chronic_conditions">Chronic Conditions</Label>
                    <Input id="chronic_conditions" name="chronic_conditions" placeholder="e.g. Diabetes, Hypertension" className="mt-1" />
                </div>
            </div>

            <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    placeholder="Any additional notes about the patient..."
                    className="w-full mt-1 px-3.5 py-2 rounded-xl border border-[var(--input)] bg-white/[0.03] text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/50 focus-visible:border-[var(--ring)]/30 placeholder:text-[var(--muted-foreground)]/60 transition-all duration-200"
                />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
                        {cancelLabel}
                    </Button>
                )}
                <Button type="submit" disabled={isPending} className="gap-2 shadow-lg shadow-primary/20">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
