import { requireSession } from "@/lib/session";
import { ComingSoonPage } from "@/components/ui/coming-soon";
import { Stethoscope } from "lucide-react";

export default async function ConsultationsPage() {
    await requireSession();
    return (
        <ComingSoonPage
            title="Consultations"
            description="Manage patient consultations and clinical notes."
            icon={<Stethoscope className="w-8 h-8 text-[var(--primary)]" />}
        />
    );
}
