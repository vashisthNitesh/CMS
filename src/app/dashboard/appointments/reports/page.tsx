import { requireSession } from "@/lib/session";
import { ComingSoonPage } from "@/components/ui/coming-soon";
import { BarChart } from "lucide-react";

export default async function AppointmentReportsPage() {
    await requireSession();
    return (
        <ComingSoonPage
            title="Appointment Reports"
            description="Analytics and reports for appointment data."
            icon={<BarChart className="w-8 h-8 text-[var(--primary)]" />}
        />
    );
}
