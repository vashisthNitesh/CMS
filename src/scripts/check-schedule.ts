import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const result = await pool.query(`SELECT * FROM schedule_templates`);
    console.log("Templates: ", JSON.stringify(result.rows, null, 2));

    const override = await pool.query(`SELECT * FROM slot_overrides`);
    console.log("Overrides: ", JSON.stringify(override.rows, null, 2));
    process.exit(0);
}
run();
