import type { Handler } from '@netlify/functions';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

interface UserRow {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    role: string;
}

function parseCsv(filePath: string): UserRow[] {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) throw new Error('CSV file is empty or missing data rows.');
    const [headerLine, ...dataLines] = lines;
    const headers = headerLine.split(',').map((h) => h.trim());
    const idxId = headers.indexOf('id');
    const idxFirst = headers.indexOf('firstname');
    const idxLast = headers.indexOf('lastname');
    const idxEmail = headers.indexOf('email');
    const idxPassword = headers.indexOf('password');
    const idxRole = headers.indexOf('role');
    for (const [col, idx] of [['id', idxId], ['firstname', idxFirst], ['lastname', idxLast], ['email', idxEmail], ['password', idxPassword], ['role', idxRole]] as [string, number][]) {
        if (idx === -1) throw new Error(`CSV is missing required column: ${col}`);
    }
    return dataLines.map((line, lineNumber) => {
        const cols = line.split(',');
        const id = cols[idxId]?.trim();
        const firstname = cols[idxFirst]?.trim();
        const lastname = cols[idxLast]?.trim();
        const email = cols[idxEmail]?.trim();
        const password = cols[idxPassword]?.trim();
        const role = cols[idxRole]?.trim();
        if (!id || !firstname || !lastname || !email || !password || !role) {
            throw new Error(`Row ${lineNumber + 2} is missing a required field (id, firstname, lastname, email, password, or role).`);
        }
        return { id, firstname, lastname, email, password, role };
    });
}

async function seedUsers(csvPath = resolve(process.cwd(), 'users.csv')) {
    if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL not set');
    const sql = neon(process.env.POSTGRES_URL);
    const users = parseCsv(csvPath);
    let inserted = 0;
    let skipped = 0;
    for (const user of users) {
        const result = await sql`
      INSERT INTO users (id, firstname, lastname, email, password, role)
      VALUES (${user.id}, ${user.firstname}, ${user.lastname}, ${user.email}, ${user.password}, ${user.role})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;
        if (result.length === 0) {
            skipped++;
        } else {
            inserted++;
        }
    }
    return { inserted, skipped, total: users.length };
}

const SECRET = process.env.SEED_SECRET;

export const handler: Handler = async (event) => {
    const auth = event.headers['x-seed-secret'];
    if (!SECRET || auth !== SECRET) {
        return {
            statusCode: 403,
            body: 'Forbidden: Invalid or missing secret.',
        };
    }
    try {
        const result = await seedUsers();
        return {
            statusCode: 200,
            body: JSON.stringify(result),
            headers: { 'Content-Type': 'application/json' },
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: 'Seeding failed: ' + (err instanceof Error ? err.message : String(err)),
        };
    }
};
