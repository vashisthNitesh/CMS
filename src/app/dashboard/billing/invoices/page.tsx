import { requireSession } from "@/lib/session";
import { ComingSoonPage } from "@/components/ui/coming-soon";
import { Receipt } from "lucide-react";

export default async function InvoicesPage() {
    await requireSession();
    return (
        <ComingSoonPage
            title="Invoices"
            description="View and manage patient invoices."
            icon={<Receipt className="w-8 h-8 text-[var(--primary)]" />}
        />
    );
}
