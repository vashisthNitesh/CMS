import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface ComingSoonPageProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

export function ComingSoonPage({ title, description, icon }: ComingSoonPageProps) {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="heading-3 tracking-tight">{title}</h1>
                <p className="text-[var(--muted-foreground)] mt-1 text-sm">{description}</p>
            </div>
            <Card className="p-12 flex flex-col items-center justify-center text-center bg-[var(--card)] border-[var(--border)]">
                <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mb-5">
                    {icon || <Clock className="w-8 h-8 text-[var(--primary)]" />}
                </div>
                <h2 className="heading-4 mb-2">Coming Soon</h2>
                <p className="text-sm text-[var(--muted-foreground)] max-w-md">
                    This feature is under development and will be available in a future update.
                </p>
            </Card>
        </div>
    );
}
