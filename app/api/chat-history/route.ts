import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { saveChatHistory } from '@/lib/services/chat-history';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'fallback-secret'
);

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const email = payload.email;
        if (typeof email !== 'string' || !email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        userId = email;
    } catch {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let messages: unknown[];
    try {
        const body = await req.json();
        messages = body.messages;
    } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
        return Response.json({ error: 'No messages to save' }, { status: 400 });
    }

    try {
        //console.log(`Saving chat history for user: ${userId} with ${messages.length} messages`);
        await saveChatHistory(userId, messages);
        return Response.json({ success: true });
    } catch (err) {
        console.error('POST /api/chat-history error:', err);
        return Response.json({ error: 'Failed to save chat history' }, { status: 500 });
    }
}
