const fs = require('fs');
const path = require('path');
const db = require('./connection');

async function runMigrations() {
    try {
        console.log('🔄 Running database migrations...\n');

        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            console.log(`  ➡️  Running ${file}...`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await db.query(sql);
            console.log(`  ✅  ${file} completed`);
        }

        console.log('\n✅ All migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigrations();
