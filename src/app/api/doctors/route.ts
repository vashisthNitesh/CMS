import { requireSession } from "@/lib/session";
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
    try {
        const session = await requireSession();
        const result = await db.query(
            `SELECT u.user_id, u.first_name, u.last_name, u.email, r.role_name
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.clinic_id = $1 AND r.role_name = 'doctor' AND u.status = 'active'
            ORDER BY u.first_name ASC`,
            [session.clinic_id]
        );
        return NextResponse.json({ doctors: result.rows });
    } catch {
        return NextResponse.json({ doctors: [] }, { status: 500 });
    }
}
