import { requireSession } from "@/lib/session";
import { ComingSoonPage } from "@/components/ui/coming-soon";
import { TrendingUp } from "lucide-react";

export default async function ReportsPage() {
    await requireSession();
    return (
        <ComingSoonPage
            title="Reports"
            description="Comprehensive clinic reports and analytics."
            icon={<TrendingUp className="w-8 h-8 text-[var(--primary)]" />}
        />
    );
}
