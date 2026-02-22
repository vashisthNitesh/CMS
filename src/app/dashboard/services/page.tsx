import { ComingSoonPage } from "@/components/ui/coming-soon";
import { Stethoscope } from "lucide-react";

export default function ServicesPage() {
    return (
        <ComingSoonPage
            title="Services Management"
            description="Manage and configure clinical services and procedures."
            icon={<Stethoscope className="w-8 h-8 text-[var(--primary)]" />}
        />
    );
}
