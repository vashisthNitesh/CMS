"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPatient } from "@/actions/patients";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft, CalendarPlus, Heart, Phone, User, CheckCircle, AlertCircle, UserPlus
} from "lucide-react";
import Link from "next/link";
import { PatientRegistrationForm } from "@/components/patients/patient-registration-form";

export default function NewPatientPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(formData: FormData) {
        setError("");
        startTransition(async () => {
            const result = await createPatient({
                first_name: formData.get("first_name") as string,
                last_name: formData.get("last_name") as string,
                phone: formData.get("phone") as string,
                email: (formData.get("email") as string) || undefined,
                age: parseInt(formData.get("age") as string) || undefined,
                gender: (formData.get("gender") as string) || undefined,
            });
            if (result.error) {
                setError(result.error);
            } else if (result.patient) {
                setSuccess("Patient registered successfully!");
                setTimeout(() => router.push(`/dashboard/patients/${result.patient.patient_id}`), 1000);
            }
        });
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/patients">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <PageHeader
                    title="Register Patient"
                    description="Fill in the patient details to create a new record."
                    icon={<UserPlus className="w-5 h-5 text-[var(--primary)]" />}
                />
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in-up">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-fade-in-up">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
                </div>
            )}

            <Card className="mb-5 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4 text-[var(--primary)]" /> Patient Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <PatientRegistrationForm
                        onSubmit={async (formData) => handleSubmit(formData)}
                        submitLabel="Register Patient"
                        onCancel={() => router.push("/dashboard/patients")}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
