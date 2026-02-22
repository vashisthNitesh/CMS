"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PatientProfileHeader } from "@/components/patient-profile/patient-profile-header";
import { ProfileTabs } from "@/components/patient-profile/profile-tabs";
import { OverviewTab } from "@/components/patient-profile/overview-tab";
import { TimelineTab } from "@/components/patient-profile/timeline-tab";

// Mock data generator (replace with DB fetch later)
const getMockPatient = (id: string) => ({
    id,
    firstName: "Sarah",
    lastName: "Johnson",
    age: 34,
    gender: "Female",
    bloodGroup: "O+",
    phone: "+1 (555) 123-4567",
    email: "sarah.j@example.com",
    address: "123 Maple Ave, Springfield, IL",
    allergies: ["Penicillin", "Peanuts"],
    avatar: "https://i.pravatar.cc/300?u=sarah"
});

export default function PatientProfilePage() {
    const params = useParams();
    const id = params.id as string;
    const [activeTab, setActiveTab] = useState("Overview");

    const patient = getMockPatient(id);
    const tabs = ["Overview", "Visits", "Prescriptions", "Labs", "Documents", "Billing", "Timeline"];

    return (
        <div className="min-h-screen bg-[var(--bg-canvas)] pb-20">
            <PatientProfileHeader patient={patient} />

            <ProfileTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <main className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === "Overview" && <OverviewTab patient={patient} />}
                {activeTab === "Timeline" && <TimelineTab patientId={id} />}

                {/* Placeholders for other tabs */}
                {!["Overview", "Timeline"].includes(activeTab) && (
                    <div className="max-w-7xl mx-auto px-6 py-12 text-center text-[var(--muted-foreground)]">
                        <p className="text-lg font-medium">Coming Soon</p>
                        <p className="text-sm">The {activeTab} module is currently under development.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
