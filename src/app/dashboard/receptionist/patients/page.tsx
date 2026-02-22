import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, UserCircle } from "lucide-react";

export default async function PatientsPage() {
    const session = await requireSession();

    const patients = await db.query(
        `SELECT patient_id, first_name, last_name, phone, age, gender, email, profile_complete, created_at
     FROM patients
     WHERE clinic_id = $1 AND status = 'ACTIVE'
     ORDER BY created_at DESC LIMIT 50`,
        [session.clinic_id]
    );

    const count = await db.query(
        "SELECT COUNT(*) as cnt FROM patients WHERE clinic_id = $1 AND status = 'ACTIVE'",
        [session.clinic_id]
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
                <p className="text-[var(--muted-foreground)] mt-1">{parseInt(count.rows[0].cnt)} registered patients</p>
            </div>

            {/* Patient List */}
            <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="w-5 h-5 text-[var(--primary)]" />
                            All Patients
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {patients.rows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground)]">
                                <UserCircle className="w-12 h-12 opacity-20 mb-3" />
                                <p className="text-sm">No patients registered yet</p>
                                <p className="text-xs mt-1">Book an appointment to create a patient record</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {patients.rows.map((p: any) => (
                                    <div key={p.patient_id} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.04] transition-all duration-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                                                {(p.first_name[0] + p.last_name[0]).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{p.first_name} {p.last_name}</p>
                                                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mt-0.5">
                                                    <Phone className="w-3 h-3" /> {p.phone}
                                                    {p.age && <span>· {p.age}y</span>}
                                                    {p.gender && <span>· {p.gender}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={p.profile_complete ? "success" : "secondary"}>
                                                {p.profile_complete ? "Complete" : "Partial"}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
