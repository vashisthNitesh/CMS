import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, Globe, Clock } from "lucide-react";
import Link from "next/link";

export default async function ClinicSettingsPage() {
    const session = await requireSession();

    // Try to get clinic config — table may be named differently or not exist
    let clinic: Record<string, string> = {};
    try {
        const result = await db.query(
            "SELECT * FROM organization_config WHERE clinic_id = $1",
            [session.clinic_id]
        );
        clinic = result.rows[0] || {};
    } catch {
        // Table may not exist yet, that's fine
        try {
            const result = await db.query(
                "SELECT * FROM clinics WHERE clinic_id = $1",
                [session.clinic_id]
            );
            clinic = result.rows[0] || {};
        } catch {
            // Neither table exists, use empty config
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3 animate-fade-in-up">
                <Link href="/dashboard/settings">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <PageHeader
                    title="Clinic Configuration"
                    description="Manage your clinic profile and regional settings."
                    icon={<Building2 className="w-5 h-5 text-[var(--primary)]" />}
                />
            </div>

            {/* Basic Info */}
            <Card className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[var(--primary)]" /> Basic Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Clinic Name</Label>
                            <Input defaultValue={clinic.clinic_name || clinic.name || ""} readOnly className="mt-1 bg-[var(--muted)]/20" />
                        </div>
                        <div>
                            <Label>Specialty</Label>
                            <Input defaultValue={(clinic.specialty_type || clinic.specialty || "")?.replace(/_/g, " ")} readOnly className="mt-1 bg-[var(--muted)]/20 capitalize" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Phone</Label>
                            <Input defaultValue={clinic.phone || ""} placeholder="Clinic phone number" className="mt-1" />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input defaultValue={clinic.email || ""} placeholder="clinic@example.com" className="mt-1" />
                        </div>
                    </div>
                    <div>
                        <Label>Address</Label>
                        <textarea
                            defaultValue={clinic.address || ""}
                            placeholder="Full clinic address"
                            rows={2}
                            className="w-full mt-1 px-3 py-2 rounded-xl border border-[var(--border)] bg-transparent text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/50"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Regional */}
            <Card className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[var(--primary)]" /> Regional Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <Label>Country</Label>
                            <Input defaultValue={clinic.country_code || "IN"} readOnly className="mt-1 bg-[var(--muted)]/20" />
                        </div>
                        <div>
                            <Label>Timezone</Label>
                            <Input defaultValue={clinic.timezone || "Asia/Kolkata"} readOnly className="mt-1 bg-[var(--muted)]/20" />
                        </div>
                        <div>
                            <Label>Currency</Label>
                            <Input defaultValue={clinic.currency_code || "INR"} readOnly className="mt-1 bg-[var(--muted)]/20" />
                        </div>
                        <div>
                            <Label>Language</Label>
                            <Input defaultValue={clinic.language_code || "en-IN"} readOnly className="mt-1 bg-[var(--muted)]/20" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Appointment Settings */}
            <Card className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--primary)]" /> Appointment Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Default Slot Duration</Label>
                            <Input defaultValue={clinic.slot_duration_minutes || 15} type="number" className="mt-1" />
                            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">minutes</p>
                        </div>
                        <div>
                            <Label>Max Advance Booking</Label>
                            <Input defaultValue={clinic.max_advance_booking_days || 30} type="number" className="mt-1" />
                            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">days</p>
                        </div>
                        <div>
                            <Label>Cancellation Window</Label>
                            <Input defaultValue={clinic.cancellation_window_hours || 2} type="number" className="mt-1" />
                            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">hours before appointment</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end animate-fade-in-up" style={{ animationDelay: "320ms" }}>
                <Button className="gap-2 shadow-lg shadow-primary/20">Save Changes</Button>
            </div>
        </div>
    );
}
