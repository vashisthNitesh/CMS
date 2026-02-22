import { requireSession } from "@/lib/session";
import db from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Building, Globe, CreditCard } from "lucide-react";
import { Label } from "@/components/ui/label";

export default async function SettingsPage() {
    const session = await requireSession();

    const configResult = await db.query(
        "SELECT * FROM organization_config WHERE clinic_id = $1",
        [session.clinic_id]
    );
    const config = configResult.rows[0];

    return (
        <div className="space-y-6 h-full flex flex-col max-w-4xl mx-auto w-full animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-[var(--muted-foreground)] mt-1">Manage your clinic&apos;s configuration and preferences.</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-[var(--primary)]" />
                            General Information
                        </CardTitle>
                        <CardDescription>
                            Basic details about your clinic.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="clinicName">Clinic Name</Label>
                            <Input id="clinicName" defaultValue={config.clinic_name} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="specialty">Specialty</Label>
                                <Input id="specialty" defaultValue={config.specialty_type} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="language">Language</Label>
                                <Input id="language" defaultValue={config.language_code} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-400" />
                            Regional Settings
                        </CardTitle>
                        <CardDescription>
                            Localization settings for your region.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="country">Country</Label>
                                <Input id="country" defaultValue={config.country_code} readOnly className="bg-[var(--muted)] opacity-50" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="timezone">Timezone</Label>
                                <Input id="timezone" defaultValue={config.timezone} readOnly className="bg-[var(--muted)] opacity-50" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Input id="currency" defaultValue={config.currency_code} readOnly className="bg-[var(--muted)] opacity-50" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-400" />
                            Subscription
                        </CardTitle>
                        <CardDescription>
                            Your current plan status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)]">
                            <div>
                                <p className="font-medium text-lg capitalize">{config.subscription_plan || 'Free Plan'}</p>
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    Valid until {config.subscription_valid_until ? new Date(config.subscription_valid_until).toLocaleDateString() : 'Forever'}
                                </p>
                            </div>
                            <Button variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
                                Upgrade Plan
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button className="gap-2 w-full md:w-auto shadow-lg shadow-primary/20">
                        <Save className="w-4 h-4" />
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
