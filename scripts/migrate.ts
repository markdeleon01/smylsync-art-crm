import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

const files = [
    join(process.cwd(), 'create_users_table.sql'),
    join(process.cwd(), 'create_login_events_table.sql'),
    join(process.cwd(), 'create_chat_histories_table.sql'),
    join(process.cwd(), 'create_patients_table.sql'),
    join(process.cwd(), 'create_appointments_table.sql')
];

async function main() {
    const sql = neon(process.env.POSTGRES_URL!);

    for (const file of files) {
        console.log(`Running ${file}...`);
        const query = readFileSync(file, 'utf-8');
        const statements = query
            .split(';')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        for (const statement of statements) {
            await sql(statement);
        }
        console.log(`Done.`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
