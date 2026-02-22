"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction, registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, Loader2, AlertCircle, ArrowRight, Sparkles, ShieldCheck, Zap, UserPlus, LogIn, Eye, EyeOff } from "lucide-react";

type Mode = "login" | "register";

export default function AuthPage() {
    const [mode, setMode] = useState<Mode>("login");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await loginAction(formData);
        if (result.error) {
            setError(result.error);
            setLoading(false);
            return;
        }
        router.push("/dashboard");
    }

    async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        // Validate password match
        const password = formData.get("password") as string;
        const confirm = formData.get("confirm_password") as string;
        if (password !== confirm) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        const result = await registerAction(formData);
        if (result.error) {
            setError(result.error);
            setLoading(false);
            return;
        }
        setSuccess("Account created! Signing you in...");
        setLoading(false);

        // Auto-login immediately
        const loginForm = new FormData();
        loginForm.set("email", formData.get("email") as string);
        loginForm.set("password", password);
        const loginResult = await loginAction(loginForm);
        if (loginResult.error) {
            setMode("login");
            setSuccess("");
            setError("Account created but auto-login failed. Please sign in.");
            return;
        }
        router.push("/dashboard");
    }

    const features = [
        { icon: <Sparkles className="w-5 h-5" />, title: "AI Visit Context", desc: "Smart patient summaries & risk flags" },
        { icon: <Zap className="w-5 h-5" />, title: "Real-Time Queue", desc: "Live dashboard with zero-delay updates" },
        { icon: <ShieldCheck className="w-5 h-5" />, title: "Enterprise RBAC", desc: "Role-based access with audit trails" },
    ];

    return (
        <div className="min-h-screen flex aurora-bg noise">
            {/* Left Panel — Branding & Features */}
            <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative z-10">
                {/* Top: Logo */}
                <div className="animate-fade-in-up">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center glow-primary">
                            <Stethoscope className="w-6 h-6 text-[var(--primary)]" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">ClinicOS</span>
                    </div>
                </div>

                {/* Center: Hero Text + Features */}
                <div className="space-y-10 max-w-lg">
                    <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                        <h1 className="text-4xl font-bold leading-tight tracking-tight">
                            Clinical management,{" "}
                            <span className="text-gradient">reimagined</span>
                        </h1>
                        <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
                            AI-powered scheduling, real-time queues, and intelligent patient context — all in one unified platform.
                        </p>
                    </div>

                    <div className="space-y-4 stagger-children">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-4 p-4 rounded-2xl glass hover-lift cursor-default animate-fade-in-up"
                                style={{ animationDelay: `${200 + i * 80}ms` }}
                            >
                                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] flex-shrink-0">
                                    {f.icon}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{f.title}</p>
                                    <p className="text-sm text-[var(--muted-foreground)]">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom */}
                <p className="text-xs text-[var(--muted-foreground)] animate-fade-in" style={{ animationDelay: "500ms" }}>
                    © 2026 ClinicOS · Enterprise-grade healthcare software
                </p>
            </div>

            {/* Right Panel — Auth Form */}
            <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-md animate-scale-in">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <span className="text-lg font-bold">ClinicOS</span>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex p-1 rounded-xl bg-[var(--muted)] mb-8">
                        <button
                            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${mode === "login"
                                ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20"
                                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                        >
                            <LogIn className="w-4 h-4" />
                            Sign In
                        </button>
                        <button
                            onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${mode === "register"
                                ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20"
                                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                        >
                            <UserPlus className="w-4 h-4" />
                            Sign Up
                        </button>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-sm mb-6 animate-scale-in">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6 animate-scale-in">
                            <Sparkles className="w-4 h-4 flex-shrink-0" />
                            {success}
                        </div>
                    )}

                    {/* Login Form */}
                    {mode === "login" && (
                        <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
                                <p className="text-sm text-[var(--muted-foreground)] mt-1">Enter your credentials to continue</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" placeholder="you@clinic.com" required autoComplete="email" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password" name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            required autoComplete="current-password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                                ) : (
                                    <><span>Sign In</span> <ArrowRight className="w-4 h-4" /></>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Register Form */}
                    {mode === "register" && (
                        <form onSubmit={handleRegister} className="space-y-5 animate-fade-in">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Create account</h2>
                                <p className="text-sm text-[var(--muted-foreground)] mt-1">Set up your ClinicOS account</p>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">First Name</Label>
                                        <Input id="first_name" name="first_name" placeholder="Amit" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">Last Name</Label>
                                        <Input id="last_name" name="last_name" placeholder="Sharma" required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reg_email">Email</Label>
                                    <Input id="reg_email" name="email" type="email" placeholder="you@clinic.com" required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" name="phone" placeholder="+91 98765 43210" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role_name">Role</Label>
                                    <select
                                        id="role_name" name="role_name" required
                                        className="flex h-10 w-full rounded-lg border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                                    >
                                        <option value="" className="bg-[var(--card)]">Select your role</option>
                                        <option value="clinic_owner" className="bg-[var(--card)]">Clinic Owner</option>
                                        <option value="doctor" className="bg-[var(--card)]">Doctor</option>
                                        <option value="receptionist" className="bg-[var(--card)]">Receptionist</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic_name">Clinic Name</Label>
                                    <Input id="clinic_name" name="clinic_name" placeholder="e.g. Sharma Family Clinic" required />
                                    <p className="text-xs text-[var(--muted-foreground)]">Your clinic will be created automatically</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="reg_password">Password</Label>
                                        <Input id="reg_password" name="password" type="password" placeholder="••••••••" required minLength={8} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm_password">Confirm</Label>
                                        <Input id="confirm_password" name="confirm_password" type="password" placeholder="••••••••" required />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                                ) : (
                                    <><UserPlus className="w-4 h-4" /> Create Account</>
                                )}
                            </Button>
                        </form>
                    )}

                    <p className="text-center text-xs text-[var(--muted-foreground)] mt-8">
                        Protected by enterprise-grade encryption
                    </p>
                </div>
            </div>
        </div>
    );
}
