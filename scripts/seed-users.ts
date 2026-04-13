import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
const PEPPER = process.env.BCRYPT_PEPPER ?? '';

const csvPath = process.argv[2]
    ? resolve(process.cwd(), process.argv[2])
    : resolve(process.cwd(), 'users.csv');

interface UserRow {
    email: string;
    name: string;
    password: string;
    role: string;
}

function parseCsv(filePath: string): UserRow[] {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    if (lines.length < 2) {
        throw new Error('CSV file is empty or missing data rows.');
    }

    const [headerLine, ...dataLines] = lines;
    const headers = headerLine.split(',').map((h) => h.trim());

    const idxEmail = headers.indexOf('email');
    const idxName = headers.indexOf('name');
    const idxPassword = headers.indexOf('password');
    const idxRole = headers.indexOf('role');

    for (const [col, idx] of [['email', idxEmail], ['name', idxName], ['password', idxPassword], ['role', idxRole]] as [string, number][]) {
        if (idx === -1) throw new Error(`CSV is missing required column: ${col}`);
    }

    return dataLines.map((line, lineNumber) => {
        const cols = line.split(',');
        const email = cols[idxEmail]?.trim();
        const name = cols[idxName]?.trim();
        const password = cols[idxPassword]?.trim();
        const role = cols[idxRole]?.trim();

        if (!email || !name || !password || !role) {
            throw new Error(`Row ${lineNumber + 2} is missing a required field (email, name, password, or role).`);
        }

        return { email, name, password, role };
    });
}

async function main() {
    const sql = neon(process.env.POSTGRES_URL!);

    console.log(`Reading users from: ${csvPath}`);
    const users = parseCsv(csvPath);
    console.log(`Found ${users.length} user(s). Seeding...`);

    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password + PEPPER, SALT_ROUNDS);
        await sql`
            INSERT INTO users (email, name, password, role)
            VALUES (${user.email}, ${user.name}, ${hashedPassword}, ${user.role})
            ON CONFLICT (email) DO NOTHING
        `;
        console.log(`  Inserted: ${user.name} <${user.email}>`);
    }

    console.log('Done.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
