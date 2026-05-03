import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'fallback-secret'
);

const PUBLIC_PATHS = ['/login', '/api/auth', '/api/art', '/api/mcp', '/.netlify/functions/send-reminders', '/.netlify/functions/get-available-slots'];

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // If already authenticated, redirect away from login
    if (pathname.startsWith('/login')) {
        const token = req.cookies.get('token')?.value;
        if (token) {
            try {
                await jwtVerify(token, JWT_SECRET);
                return NextResponse.redirect(new URL('/', req.url));
            } catch {
                // Token invalid/expired — let them see the login page
            }
        }
        return NextResponse.next();
    }

    // Allow all other public paths through
    if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    const token = req.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.next();
    } catch {
        // Token is invalid or expired
        const response = NextResponse.redirect(new URL('/login', req.url));
        response.cookies.delete('token');
        return response;
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon\.ico|robots\.txt|sitemap\.xml|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'
    ]
};
