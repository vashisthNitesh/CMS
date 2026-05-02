const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const migrations = [
            'backend/src/database/migrations/001_create_config_tables.sql',
            'backend/src/database/migrations/002_create_auth_tables.sql',
            'backend/src/database/migrations/003_create_audit_tables.sql',
            'backend/src/database/migrations/004_create_appointment_tables.sql',
            'migrations/001_schedule_schema.sql'
        ];

        for (const file of migrations) {
            console.log(`Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
            await pool.query(sql);
            console.log(`Successfully ran ${file}`);
        }

        console.log('Seeding initial data...');
        
        // 1. Insert Clinic
        let clinicId;
        const clinicRes = await pool.query('SELECT clinic_id FROM organization_config LIMIT 1');
        if (clinicRes.rows.length === 0) {
            const res = await pool.query(`
                INSERT INTO organization_config (clinic_name, country_code, timezone, currency_code, language_code, specialty_type)
                VALUES ('Main Clinic', 'US', 'UTC', 'USD', 'en', 'general_practice')
                RETURNING clinic_id
            `);
            clinicId = res.rows[0].clinic_id;
            console.log('Created clinic', clinicId);
        } else {
            clinicId = clinicRes.rows[0].clinic_id;
            console.log('Clinic already exists', clinicId);
        }

        // 2. Get super_admin role
        const roleRes = await pool.query(`SELECT role_id FROM roles WHERE role_name = 'super_admin'`);
        if (roleRes.rows.length === 0) {
            throw new Error('super_admin role not found');
        }
        const roleId = roleRes.rows[0].role_id;

        // 3. Insert Admin user
        const email = 'admin@example.com';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userRes = await pool.query(`SELECT user_id FROM users WHERE email = $1`, [email]);
        if (userRes.rows.length === 0) {
            await pool.query(`
                INSERT INTO users (clinic_id, email, password_hash, first_name, last_name, role_id)
                VALUES ($1, $2, $3, 'Super', 'Admin', $4)
            `, [clinicId, email, hashedPassword, roleId]);
            console.log(`Created admin user: ${email} / ${password}`);
        } else {
            console.log(`Admin user already exists: ${email} / ${password}`);
            await pool.query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [hashedPassword, email]);
            console.log(`Updated admin user password to ${password}`);
        }

        console.log('All migrations and seeding completed successfully!');
        process.exit(0);
    } catch (e) {
        console.error('Error during migration/seeding:', e);
        process.exit(1);
    }
}

run();
