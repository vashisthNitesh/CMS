"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateUser, createToken, registerUser } from "@/lib/auth";

export async function loginAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password required" };
    }

    try {
        const user = await authenticateUser(email, password);
        const token = createToken(user);

        const cookieStore = await cookies();
        cookieStore.set("session_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });

        return { success: true, role: user.role };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("session_token");
    redirect("/login");
}

export async function registerAction(formData: FormData) {
    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        first_name: formData.get("first_name") as string,
        last_name: formData.get("last_name") as string,
        phone: formData.get("phone") as string,
        role_name: formData.get("role_name") as string,
        clinic_name: formData.get("clinic_name") as string || undefined,
    };

    try {
        const user = await registerUser(data);
        return { success: true, user };
    } catch (error) {
        return { error: (error as Error).message };
    }
}
