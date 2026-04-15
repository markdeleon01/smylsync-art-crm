import { NextResponse } from 'next/server';

// This project uses JWT-based authentication via jose (see app/login/page.tsx).
// next-auth is not installed. These stubs satisfy the route type contract.
export const handlers = {
    GET: () => NextResponse.json({ error: 'Not implemented' }, { status: 501 }),
    POST: () => NextResponse.json({ error: 'Not implemented' }, { status: 501 })
};

