import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
const PEPPER = process.env.BCRYPT_PEPPER ?? '';

const users = [
    { email: 'info@smylsync.com', name: 'Admin User', password: 'password', role: 'admin' },
    { email: 'mark.deleon@smylsync.com', name: 'Mark de Leon', password: 'password', role: 'admin' },
    { email: 'icn.tubban@smylsync.com', name: 'Ian Charl Nico Tubban', password: 'password', role: 'admin' },
    { email: 'mariachriseth.cruz@smylsync.com', name: 'Maria Chriseth Cruz', password: 'password', role: 'admin' },
    { email: 'paolo.argamaso@smylsync.com', name: 'Paolo Argamaso', password: 'password', role: 'admin' },
    { email: 'art.padua@smylsync.com', name: 'Jun Art Padua', password: 'password', role: 'user' }
];

async function main() {
    const sql = neon(process.env.POSTGRES_URL!);

    console.log('Seeding users...');

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
