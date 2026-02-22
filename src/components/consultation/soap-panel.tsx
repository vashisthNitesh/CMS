"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock ICD-10
const ICD_10_CODES = [
    { value: "j01.90", label: "J01.90 - Acute sinusitis, unspecified" },
    { value: "i10", label: "I10 - Essential (primary) hypertension" },
    { value: "e11.9", label: "E11.9 - Type 2 diabetes mellitus without complications" },
    { value: "j45.909", label: "J45.909 - Unspecified asthma, uncomplicated" },
];

export function SoapPanel({ appointment, onSave }: { appointment: any, onSave: () => void }) {
    // Vitals State
    const [vitals, setVitals] = useState({ bp: "", hr: "", temp: "", spo2: "", weight: "", height: "" });
    const [bmi, setBmi] = useState<string>("--");

    // Diagnosis State
    const [openDiagnosis, setOpenDiagnosis] = useState(false);
    const [selectedDiagnoses, setSelectedDiagnoses] = useState<typeof ICD_10_CODES>([]);

    // Auto-calc BMI
    useEffect(() => {
        const w = parseFloat(vitals.weight);
        let h = parseFloat(vitals.height);
        if (w > 0 && h > 0) {
            // Assume height is in cm, convert to m
            if (h > 3) h = h / 100;
            const calc = (w / (h * h)).toFixed(1);
            setBmi(calc);
        } else {
            setBmi("--");
        }
    }, [vitals.weight, vitals.height]);

    const handleVitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVitals(v => ({ ...v, [e.target.name]: e.target.value }));
    };

    const addDiagnosis = (code: typeof ICD_10_CODES[0]) => {
        if (!selectedDiagnoses.find(d => d.value === code.value)) {
            setSelectedDiagnoses([...selectedDiagnoses, code]);
        }
        setOpenDiagnosis(false);
    };
    const removeDiagnosis = (val: string) => {
        setSelectedDiagnoses(selectedDiagnoses.filter(d => d.value !== val));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Consultation Notes</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Record SOAP notes and vitals for this visit.</p>
                </div>
                <Button onClick={onSave} variant="default" size="sm" className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors">
                    Save Draft
                </Button>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
                <Accordion type="multiple" defaultValue={["chief-complaint", "vitals"]} className="w-full">

                    {/* Chief Complaint */}
                    <AccordionItem value="chief-complaint" className="px-6">
                        <AccordionTrigger className="text-base font-semibold text-[var(--text-primary)] hover:no-underline hover:text-[var(--primary)] transition-colors">
                            1. Chief Complaint
                        </AccordionTrigger>
                        <AccordionContent>
                            <Textarea
                                placeholder="Describe the patient's primary symptoms and reason for visit..."
                                className="min-h-[100px] bg-[var(--bg-canvas)] border-[var(--border)] focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
                            />
                        </AccordionContent>
                    </AccordionItem>

                    {/* History */}
                    <AccordionItem value="history" className="px-6">
                        <AccordionTrigger className="text-base font-semibold text-[var(--text-primary)] hover:no-underline hover:text-[var(--primary)] transition-colors">
                            2. History of Present Illness
                        </AccordionTrigger>
                        <AccordionContent>
                            <Textarea
                                placeholder="Chronological description of the development of the patient's present illness..."
                                className="min-h-[120px] bg-[var(--bg-canvas)] border-[var(--border)] focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
                            />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Examination & Vitals */}
                    <AccordionItem value="vitals" className="px-6">
                        <AccordionTrigger className="text-base font-semibold text-[var(--text-primary)] hover:no-underline hover:text-[var(--primary)] transition-colors">
                            3. Examination & Vitals
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6">
                            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)]/50">
                                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Vitals Summary</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-[var(--text-muted)]">BP (mmHg)</Label>
                                        <Input name="bp" placeholder="120/80" value={vitals.bp} onChange={handleVitalChange} className="bg-white dark:bg-black/20" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-[var(--text-muted)]">HR (bpm)</Label>
                                        <Input name="hr" placeholder="72" value={vitals.hr} onChange={handleVitalChange} className="bg-white dark:bg-black/20" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-[var(--text-muted)]">Temp (°C)</Label>
                                        <Input name="temp" placeholder="36.8" value={vitals.temp} onChange={handleVitalChange} className="bg-white dark:bg-black/20" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-[var(--text-muted)]">SpO2 (%)</Label>
                                        <Input name="spo2" placeholder="98" value={vitals.spo2} onChange={handleVitalChange} className="bg-white dark:bg-black/20" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-[var(--text-muted)]">Weight (kg) / Height (cm)</Label>
                                        <div className="flex gap-2">
                                            <Input name="weight" placeholder="70" value={vitals.weight} onChange={handleVitalChange} className="w-1/2 bg-white dark:bg-black/20" />
                                            <Input name="height" placeholder="175" value={vitals.height} onChange={handleVitalChange} className="w-1/2 bg-white dark:bg-black/20" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 flex flex-col justify-end">
                                        <Label className="text-xs text-[var(--text-muted)]">BMI</Label>
                                        <div className="h-10 flex items-center px-3 rounded-md bg-[var(--focus)]/50 border border-[var(--border)] text-sm font-medium">
                                            {bmi}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Physical Examination Notes</Label>
                                <Textarea
                                    placeholder="Enter physical examination findings..."
                                    className="min-h-[100px] bg-[var(--bg-canvas)] border-[var(--border)] focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Diagnosis */}
                    <AccordionItem value="diagnosis" className="px-6">
                        <AccordionTrigger className="text-base font-semibold text-[var(--text-primary)] hover:no-underline hover:text-[var(--primary)] transition-colors">
                            4. Assessment / Diagnosis
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">ICD-10 Search</Label>
                                <Popover open={openDiagnosis} onOpenChange={setOpenDiagnosis}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openDiagnosis}
                                            className="w-full justify-between bg-[var(--bg-canvas)] font-normal text-muted-foreground"
                                        >
                                            Search diagnosis by name or code...
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search diagnoses..." />
                                            <CommandList>
                                                <CommandEmpty>No diagnosis found.</CommandEmpty>
                                                <CommandGroup>
                                                    {ICD_10_CODES.map((code) => (
                                                        <CommandItem
                                                            key={code.value}
                                                            value={code.label}
                                                            onSelect={() => addDiagnosis(code)}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedDiagnoses.find(d => d.value === code.value) ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {code.label}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Selected Diagnosis Chips */}
                            {selectedDiagnoses.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {selectedDiagnoses.map(d => (
                                        <div key={d.value} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 rounded-full text-sm font-medium group transition-colors hover:bg-blue-500/20">
                                            {d.label}
                                            <button
                                                onClick={() => removeDiagnosis(d.value)}
                                                className="ml-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-1.5 pt-4">
                                <Label className="text-sm font-medium">Additional Assessment Notes</Label>
                                <Textarea
                                    placeholder="Add any specific clinical assessment details..."
                                    className="min-h-[80px] bg-[var(--bg-canvas)] border-[var(--border)] focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Plan */}
                    <AccordionItem value="plan" className="px-6 border-b-0">
                        <AccordionTrigger className="text-base font-semibold text-[var(--text-primary)] hover:no-underline hover:text-[var(--primary)] transition-colors">
                            5. Plan & Follow-up
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                            <Textarea
                                placeholder="Outline the treatment plan, instructions for patient, etc..."
                                className="min-h-[120px] bg-[var(--bg-canvas)] border-[var(--border)] focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
                            />

                            <div className="flex items-center gap-4 pt-2">
                                <div className="space-y-1.5 flex-1">
                                    <Label className="text-sm font-medium">Follow-up Recommendation</Label>
                                    <select className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg-canvas)] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50">
                                        <option value="">No follow-up needed</option>
                                        <option value="1week">1 Week</option>
                                        <option value="2weeks">2 Weeks</option>
                                        <option value="1month">1 Month</option>
                                        <option value="3months">3 Months</option>
                                        <option value="custom">Custom Date (specify in notes)</option>
                                    </select>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                </Accordion>
            </div>
        </div>
    );
}
