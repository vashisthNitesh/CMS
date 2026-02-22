import { requireSession } from "@/lib/session";
import { ComingSoonPage } from "@/components/ui/coming-soon";
import { FileText } from "lucide-react";

export default async function PrescriptionsPage() {
    await requireSession();
    return (
        <ComingSoonPage
            title="Prescriptions"
            description="Create and manage patient prescriptions."
            icon={<FileText className="w-8 h-8 text-[var(--primary)]" />}
        />
    );
}
