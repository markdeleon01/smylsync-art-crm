import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';

const PEPPER = process.env.BCRYPT_PEPPER ?? '';
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'fallback-secret'
);

export async function POST(req: NextRequest) {
    const { email, password } = await req.json();

    if (!email || !password) {
        return Response.json(
            { error: 'Email and password are required.' },
            { status: 400 }
        );
    }

    const sql = neon(process.env.POSTGRES_URL!);
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

    const passwordMatch = await bcrypt.compare(password + PEPPER, user.password);

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
        .setExpirationTime('8h')
        .sign(JWT_SECRET);

    return Response.json({ token }, {
        headers: {
            'Set-Cookie': `token=${token}; HttpOnly; Path=/; Max-Age=${8 * 60 * 60}; SameSite=Lax; Secure`
        }
    });
}
