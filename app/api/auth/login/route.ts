import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';

const PEPPER = process.env.BCRYPT_PEPPER ?? '';
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'fallback-secret'
);

// e.g. SESSION_EXPIRY=8h, 30m, 1d — defaults to 8 hours
const SESSION_EXPIRY = process.env.SESSION_EXPIRY ?? '8h';

/** Parse a duration string (e.g. "8h", "30m", "1d") into seconds. */
function parseExpirySeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 8 * 60 * 60; // fallback: 8h
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * multipliers[unit];
}

export async function POST(req: NextRequest) {
    const { email, password } = await req.json();

    if (!email || !password) {
        return Response.json(
            { error: 'Email and password are required.' },
            { status: 400 }
        );
    }

    if (!process.env.POSTGRES_URL) {
        console.error('POSTGRES_URL environment variable is not set');
        return Response.json(
            { error: 'Server configuration error.' },
            { status: 500 }
        );
    }

    try {
        const sql = neon(process.env.POSTGRES_URL);
        const rows = await sql`
      SELECT id, email, name, role, password FROM users WHERE email = ${email} LIMIT 1
    `;

        const user = rows[0];

        if (!user || !user.password) {
            return Response.json(
                { error: 'Invalid email or password.' },
                { status: 401 }
            );
        }

        const passwordMatch = await bcrypt.compare(
            password + PEPPER,
            user.password
        );

        if (!passwordMatch) {
            return Response.json(
                { error: 'Invalid email or password.' },
                { status: 401 }
            );
        }

        const token = await new SignJWT({
            sub: String(user.id),
            email: user.email,
            name: user.name,
            role: user.role
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(SESSION_EXPIRY)
            .sign(JWT_SECRET);

        return Response.json(
            { token },
            {
                headers: {
                    'Set-Cookie': `token=${token}; HttpOnly; Path=/; Max-Age=${parseExpirySeconds(SESSION_EXPIRY)}; SameSite=Lax; Secure`
                }
            }
        );
    } catch (err) {
        console.error('Login error:', err);
        return Response.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
