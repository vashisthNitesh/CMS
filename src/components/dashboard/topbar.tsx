"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Bell, Search, Sun, Moon, Monitor, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { MobileSidebar } from "@/components/dashboard/sidebar";
import { logoutAction } from "@/actions/auth";
import type { SessionUser } from "@/lib/types";

export function TopBar({
    session,
    onSearchOpen,
}: {
    session: SessionUser;
    onSearchOpen?: () => void;
}) {
    const initials = `${session.first_name[0]}${session.last_name[0]}`.toUpperCase();
    const roleLabel = session.role.replace(/_/g, " ");
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => setMounted(true), []);

    return (
        <header className="h-14 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
            {/* Left: Mobile menu + Search */}
            <div className="flex items-center gap-2 flex-1">
                <MobileSidebar session={session} />

                {/* Global Search Trigger */}
                <button
                    onClick={onSearchOpen}
                    className="hidden md:flex items-center gap-2 max-w-md w-full px-3 py-2 bg-[var(--muted)]/40 border border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)]/60 hover:text-[var(--foreground)] transition-all cursor-pointer"
                    suppressHydrationWarning
                >
                    <Search className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">Search patients, appointments...</span>
                    <kbd className="hidden lg:inline-flex text-[10px] bg-[var(--muted)] px-1.5 py-0.5 rounded font-mono border border-[var(--border)]">
                        ⌘K
                    </kbd>
                </button>

                {/* Mobile search */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-9 w-9"
                    onClick={onSearchOpen}
                >
                    <Search className="w-4.5 h-4.5" />
                </Button>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-1.5">
                {/* Theme Toggle */}
                {mounted && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                                {theme === "dark" ? (
                                    <Moon className="w-4 h-4" />
                                ) : theme === "light" ? (
                                    <Sun className="w-4 h-4" />
                                ) : (
                                    <Monitor className="w-4 h-4" />
                                )}
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 text-xs">
                                <Sun className="w-3.5 h-3.5" /> Light
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 text-xs">
                                <Moon className="w-3.5 h-3.5" /> Dark
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 text-xs">
                                <Monitor className="w-3.5 h-3.5" /> System
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative h-9 w-9 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--destructive)] rounded-full ring-2 ring-[var(--background)]" />
                    <span className="sr-only">Notifications</span>
                </Button>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Avatar Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2.5 px-1 py-1 rounded-lg hover:bg-[var(--muted)]/40 transition-colors cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-[var(--background)]">
                                {initials}
                            </div>
                            <div className="hidden lg:block text-left">
                                <p className="text-sm font-medium leading-none">{session.first_name} {session.last_name}</p>
                                <p className="text-[10px] text-[var(--muted-foreground)] capitalize mt-0.5">{roleLabel}</p>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium">{session.first_name} {session.last_name}</p>
                                <p className="text-xs text-[var(--muted-foreground)]">{session.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="gap-2 text-xs cursor-pointer">
                            <a href="/dashboard/settings"><User className="w-3.5 h-3.5" /> Profile</a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="gap-2 text-xs cursor-pointer">
                            <a href="/dashboard/settings"><Settings className="w-3.5 h-3.5" /> Settings</a>
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2 text-xs">
                                {theme === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                                Theme
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 text-xs">
                                    <Sun className="w-3.5 h-3.5" /> Light
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 text-xs">
                                    <Moon className="w-3.5 h-3.5" /> Dark
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 text-xs">
                                    <Monitor className="w-3.5 h-3.5" /> System
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="gap-2 text-xs text-[var(--destructive)] focus:text-[var(--destructive)] cursor-pointer"
                            onClick={() => logoutAction()}
                        >
                            <LogOut className="w-3.5 h-3.5" /> Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
