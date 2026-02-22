import { requireSession } from "@/lib/session";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
    const session = await requireSession();
    return <DashboardContent user={session} />;
}
