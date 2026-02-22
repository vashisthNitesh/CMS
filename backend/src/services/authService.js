const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/connection');

class AuthService {
    async register(userData) {
        const { email, password, first_name, last_name, phone, role_name, clinic_id } = userData;

        const existingUser = await db.query('SELECT user_id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            throw new Error('Email already registered');
        }

        const roleResult = await db.query('SELECT role_id FROM roles WHERE role_name = $1', [role_name]);
        if (roleResult.rows.length === 0) {
            throw new Error('Invalid role');
        }

        const password_hash = await bcrypt.hash(password, 10);

        const result = await db.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, clinic_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING user_id, email, first_name, last_name, role_id, clinic_id
    `, [email, password_hash, first_name, last_name, phone, roleResult.rows[0].role_id, clinic_id]);

        return result.rows[0];
    }

    async login(email, password) {
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
            throw new Error('Invalid credentials');
        }

        const user = result.rows[0];

        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
            throw new Error(`Account locked. Try again in ${minutesLeft} minutes`);
        }

        if (user.status !== 'active') {
            throw new Error('Account is not active');
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            await this.handleFailedLogin(user.user_id, user.failed_login_attempts);
            throw new Error('Invalid credentials');
        }

        await db.query(`
      UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW()
      WHERE user_id = $1
    `, [user.user_id]);

        const accessToken = this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user.user_id);

        return {
            user: {
                user_id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                clinic_id: user.clinic_id,
                role: user.role_name,
                permissions: user.permissions || [],
            },
            accessToken,
            refreshToken,
        };
    }

    async handleFailedLogin(userId, currentAttempts) {
        const newAttempts = currentAttempts + 1;
        if (newAttempts >= 5) {
            const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
            await db.query(
                'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE user_id = $3',
                [newAttempts, lockUntil, userId]
            );
        } else {
            await db.query(
                'UPDATE users SET failed_login_attempts = $1 WHERE user_id = $2',
                [newAttempts, userId]
            );
        }
    }

    generateAccessToken(user) {
        return jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                clinic_id: user.clinic_id,
                role: user.role_name,
                permissions: user.permissions || [],
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '24h' }
        );
    }

    async generateRefreshToken(userId) {
        const token = jwt.sign(
            { user_id: userId, type: 'refresh' },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        const tokenHash = await bcrypt.hash(token, 10);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await db.query(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
            [userId, tokenHash, expiresAt]
        );
        return token;
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    hasPermission(userPermissions, requiredPermission) {
        return userPermissions.includes(requiredPermission);
    }
}

module.exports = new AuthService();
