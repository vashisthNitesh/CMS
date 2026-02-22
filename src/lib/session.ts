import { cookies } from "next/headers";
import { verifyToken } from "./auth";
import type { SessionUser } from "./types";

export async function getSession(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function requireSession(): Promise<SessionUser> {
    const session = await getSession();
    if (!session) {
        throw new Error("Not authenticated");
    }
    return session;
}

export function hasPermission(user: SessionUser, permission: string): boolean {
    return user.permissions.includes(permission);
}

export function requirePermission(user: SessionUser, ...permissions: string[]): void {
    const has = permissions.some((p) => user.permissions.includes(p));
    if (!has) {
        throw new Error(`Insufficient permissions. Required: ${permissions.join(", ")}`);
    }
}
