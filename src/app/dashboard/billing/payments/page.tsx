import { requireSession } from "@/lib/session";
import { ComingSoonPage } from "@/components/ui/coming-soon";
import { Banknote } from "lucide-react";

export default async function PaymentsPage() {
    await requireSession();
    return (
        <ComingSoonPage
            title="Payments"
            description="Track and manage payments."
            icon={<Banknote className="w-8 h-8 text-[var(--primary)]" />}
        />
    );
}
