"use client";


import Link from "next/link";
import { useTheme } from "next-themes";
import {
    Bell,
    Menu,
    Moon,
    Plus,
    Search,
    Settings,
    Sun,
    LogOut,
    User,
    CalendarPlus,
    UserPlus,
    FileText,
    CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLayoutStore } from "@/lib/store/layout-store";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TopbarProps {
    user: SessionUser;
}

export function Topbar({ user }: TopbarProps) {
    const { toggleMobileMenu } = useLayoutStore();
    const { theme, setTheme } = useTheme();

    return (
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-[var(--bg-topbar)] text-white z-50 flex items-center px-4 justify-between shadow-md">
            {/* Left: Logo & Toggle */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-white hover:bg-white/10"
                    onClick={toggleMobileMenu}
                >
                    <Menu className="h-5 w-5" />
                </Button>
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <span className="text-white font-bold text-lg leading-none">C</span>
                    </div>
                    <span className="font-[family-name:var(--font-jakarta)] font-semibold text-lg tracking-tight hidden md:block">
                        ClinicOS
                    </span>
                </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Quick Action (Desktop) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-900/20 gap-2 h-8 px-3 rounded-md"
                            size="sm"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="font-medium text-xs">New</span>
                            <kbd className="hidden lg:inline-flex ml-1 items-center justify-center rounded bg-blue-800/50 px-1.5 h-4 min-w-[16px] text-[9px] font-mono text-blue-100">
                                N
                            </kbd>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48" align="end" forceMount>
                        <DropdownMenuItem asChild className="cursor-pointer gap-2">
                            <Link href="/dashboard/receptionist/book">
                                <CalendarPlus className="h-4 w-4 text-blue-500" />
                                <span>Book Appointment</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer gap-2">
                            <Link href="/dashboard/patients/new">
                                <UserPlus className="h-4 w-4 text-emerald-500" />
                                <span>Add Patient</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer gap-2">
                            <Link href="/dashboard/reports/new">
                                <FileText className="h-4 w-4 text-violet-500" />
                                <span>New Report</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Notifications */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/5 rounded-full h-9 w-9">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 border border-[var(--bg-topbar)]" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80" align="end" forceMount>
                        <DropdownMenuLabel className="flex items-center justify-between pb-2">
                            <span className="font-semibold text-sm">Notifications</span>
                            <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">3 New</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="max-h-[300px] overflow-y-auto">
                            <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 p-3 focus:bg-white/5 data-[highlighted]:bg-white/5 transition-all outline-none rounded-md group">
                                <div className="flex items-center gap-2 w-full">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-0.5 shrink-0" />
                                    <span className="text-sm font-medium flex-1 group-focus:text-white transition-colors">New Appointment Request</span>
                                    <span className="text-[10px] text-[var(--muted-foreground)] group-focus:text-blue-200 transition-colors shrink-0">2m ago</span>
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)] group-focus:text-blue-100 transition-colors pl-4">Sarah Johnson requested a consultation for tomorrow at 10:00 AM.</p>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 p-3 focus:bg-white/5 data-[highlighted]:bg-white/5 transition-all outline-none rounded-md group">
                                <div className="flex items-center gap-2 w-full">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
                                    <span className="text-sm font-medium flex-1 group-focus:text-white transition-colors">Lab Results Ready</span>
                                    <span className="text-[10px] text-[var(--muted-foreground)] group-focus:text-emerald-200 transition-colors shrink-0">1h ago</span>
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)] group-focus:text-emerald-100 transition-colors pl-4">Blood work results for Michael Chen are now available in EMR.</p>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 p-3 focus:bg-white/5 data-[highlighted]:bg-white/5 transition-all outline-none rounded-md group">
                                <div className="flex items-center gap-2 w-full">
                                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-0.5 shrink-0" />
                                    <span className="text-sm font-medium flex-1 group-focus:text-white transition-colors">Inventory Low</span>
                                    <span className="text-[10px] text-[var(--muted-foreground)] group-focus:text-amber-200 transition-colors shrink-0">3h ago</span>
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)] group-focus:text-amber-100 transition-colors pl-4">Syringes (10ml) are running low. Only 15 boxes remaining.</p>
                            </DropdownMenuItem>
                        </div>
                        <DropdownMenuSeparator />
                        <Button variant="ghost" className="w-full text-center text-xs text-blue-600 dark:text-blue-400 justify-center h-8 rounded-none rounded-b-md">
                            View All Notifications
                        </Button>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-white hover:bg-white/5 rounded-full h-9 w-9"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>

                {/* User Profile */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1 overflow-hidden ring-2 ring-white/10 hover:ring-white/20 transition-all p-0">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.first_name} ${user.last_name}`} alt={user.first_name} />
                                <AvatarFallback className="bg-blue-600 text-white font-medium text-xs">
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.first_name} {user.last_name}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user.email}
                                </p>
                                <div className="pt-1">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800 capitalize">
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                            {/* <DropdownMenuShortcut>⌘S</DropdownMenuShortcut> */}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                            {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
