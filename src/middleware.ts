import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("session_token")?.value;
    const { pathname } = request.nextUrl;

    // Public routes
    if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname === "/favicon.ico") {
        // If already logged in, redirect to dashboard
        if (token && (pathname === "/login" || pathname === "/register")) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.next();
    }

    // Protected routes — require token
    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
