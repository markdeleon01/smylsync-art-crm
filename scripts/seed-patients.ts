import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const csvPath = process.argv[2]
    ? resolve(process.cwd(), process.argv[2])
    : resolve(process.cwd(), 'patients.csv');

interface PatientRow {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string | null;
}

function parseCsv(filePath: string): PatientRow[] {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    if (lines.length < 2) {
        throw new Error('CSV file is empty or missing data rows.');
    }

    const [headerLine, ...dataLines] = lines;
    const headers = headerLine.split(',').map((h) => h.trim());

    const idxId = headers.indexOf('id');
    const idxFirst = headers.indexOf('firstname');
    const idxLast = headers.indexOf('lastname');
    const idxEmail = headers.indexOf('email');
    const idxPhone = headers.indexOf('phone');

    for (const [col, idx] of [['id', idxId], ['firstname', idxFirst], ['lastname', idxLast], ['email', idxEmail]] as [string, number][]) {
        if (idx === -1) throw new Error(`CSV is missing required column: ${col}`);
    }

    return dataLines.map((line, lineNumber) => {
        const cols = line.split(',');
        const id = cols[idxId]?.trim();
        const firstname = cols[idxFirst]?.trim();
        const lastname = cols[idxLast]?.trim();
        const email = cols[idxEmail]?.trim();
        const phone = idxPhone !== -1 ? (cols[idxPhone]?.trim() || null) : null;

        if (!id || !firstname || !lastname || !email) {
            throw new Error(`Row ${lineNumber + 2} is missing a required field (id, firstname, lastname, or email).`);
        }

        return { id, firstname, lastname, email, phone };
    });
}

async function main() {
    const sql = neon(process.env.POSTGRES_URL!);

    console.log(`Reading patients from: ${csvPath}`);
    const patients = parseCsv(csvPath);
    console.log(`Found ${patients.length} patient(s). Seeding...`);

    let inserted = 0;
    let skipped = 0;

    for (const patient of patients) {
        const result = await sql`
            INSERT INTO patients (id, firstname, lastname, email, phone)
            VALUES (${patient.id}, ${patient.firstname}, ${patient.lastname}, ${patient.email}, ${patient.phone})
            ON CONFLICT (email) DO NOTHING
        `;
        if (result.length === 0) {
            console.log(`  Skipped (already exists): ${patient.id} – ${patient.firstname} ${patient.lastname}`);
            skipped++;
        } else {
            console.log(`  Inserted: ${patient.id} – ${patient.firstname} ${patient.lastname}`);
            inserted++;
        }
    }

    console.log(`\nDone. ${inserted} inserted, ${skipped} skipped.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
