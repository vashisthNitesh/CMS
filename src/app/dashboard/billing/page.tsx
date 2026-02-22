import { requireSession } from "@/lib/session";
import { ComingSoonPage } from "@/components/ui/coming-soon";
import { CreditCard } from "lucide-react";

export default async function BillingPage() {
    await requireSession();
    return (
        <ComingSoonPage
            title="Billing"
            description="Manage billing, payments, and invoices."
            icon={<CreditCard className="w-8 h-8 text-[var(--primary)]" />}
        />
    );
}
