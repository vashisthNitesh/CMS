import "server-only";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import db from "./db";
import type { SessionUser } from "./types";

const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || "super_secure_secret_key_change_in_production";
const JWT_EXPIRY: string = process.env.JWT_EXPIRY || "24h";

export async function authenticateUser(
    email: string,
    password: string
): Promise<SessionUser> {
    const query = `
    SELECT 
      u.user_id, u.email, u.password_hash, u.first_name, u.last_name,
      u.clinic_id, u.status, u.failed_login_attempts, u.locked_until,
      r.role_name,
      ARRAY_AGG(p.permission_name) FILTER (WHERE p.permission_name IS NOT NULL) as permissions
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.permission_id
    WHERE u.email = $1
    GROUP BY u.user_id, r.role_name
  `;

    const result = await db.query(query, [email]);
    if (result.rows.length === 0) {
        throw new Error("Invalid credentials");
    }

    const user = result.rows[0];

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const minutesLeft = Math.ceil(
            (new Date(user.locked_until).getTime() - Date.now()) / 60000
        );
        throw new Error(`Account locked. Try again in ${minutesLeft} minutes`);
    }

    if (user.status !== "active") {
        throw new Error("Account is not active");
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
        const newAttempts = user.failed_login_attempts + 1;
        if (newAttempts >= 5) {
            const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
            await db.query(
                "UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE user_id = $3",
                [newAttempts, lockUntil, user.user_id]
            );
        } else {
            await db.query(
                "UPDATE users SET failed_login_attempts = $1 WHERE user_id = $2",
                [newAttempts, user.user_id]
            );
        }
        throw new Error("Invalid credentials");
    }

    await db.query(
        "UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE user_id = $1",
        [user.user_id]
    );

    return {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        clinic_id: user.clinic_id,
        role: user.role_name,
        permissions: user.permissions || [],
    };
}

export function createToken(user: SessionUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRY } as jwt.SignOptions);
}

export function verifyToken(token: string): SessionUser | null {
    try {
        return jwt.verify(token, JWT_SECRET) as SessionUser;
    } catch {
        return null;
    }
}

export async function registerUser(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role_name: string;
    clinic_name?: string;
    clinic_id?: string;
}) {
    const existing = await db.query("SELECT user_id FROM users WHERE email = $1", [data.email]);
    if (existing.rows.length > 0) throw new Error("Email already registered");

    const roleResult = await db.query("SELECT role_id FROM roles WHERE role_name = $1", [data.role_name]);
    if (roleResult.rows.length === 0) throw new Error("Invalid role");

    let clinicId = data.clinic_id;

    // Auto-create clinic for clinic_owner registrations
    if (data.role_name === "clinic_owner") {
        const clinicName = data.clinic_name || `${data.first_name}'s Clinic`;
        const clinicResult = await db.query(
            `INSERT INTO organization_config 
             (clinic_name, country_code, timezone, currency_code, language_code, specialty_type)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING clinic_id`,
            [clinicName, "IN", "Asia/Kolkata", "INR", "en-IN", "general_practice"]
        );
        clinicId = clinicResult.rows[0].clinic_id;
    } else if (!clinicId) {
        throw new Error("Clinic ID is required for non-owner roles");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const result = await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, clinic_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING user_id, email, first_name, last_name, clinic_id`,
        [data.email, passwordHash, data.first_name, data.last_name, data.phone, roleResult.rows[0].role_id, clinicId]
    );
    return result.rows[0];
}
