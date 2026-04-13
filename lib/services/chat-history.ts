import { neon } from '@neondatabase/serverless';

/** Returns the current moment as "YYYY-MM-DD HH:MM:SS" in the clinic's local timezone.
 *  Stored into TIMESTAMP (without time zone) columns, so the value is preserved as-is. */
function getClinicNow(): string {
    const timezone = process.env.CLINIC_TIMEZONE ?? 'UTC';
    // 'sv' locale produces "YYYY-MM-DD HH:MM:SS" — no offset, no conversion by the DB
    return new Date().toLocaleString('sv', { timeZone: timezone });
}

export const recordLoginEvent = async (email: string) => {
    //console.log(`Recording login event for email: ${email}`);
    const sql = neon(process.env.POSTGRES_URL!);
    const id = crypto.randomUUID();
    const loggedInAt = getClinicNow();
    await sql`
        INSERT INTO login_events (id, email, logged_in_at)
        VALUES (${id}, ${email}, ${loggedInAt});
    `;
};

export const saveChatHistory = async (userId: string, messages: unknown[]) => {
    //console.log('saveChatHistory called with userId:', userId, 'and messages:', messages);
    const sql = neon(process.env.POSTGRES_URL!);
    const id = crypto.randomUUID();
    const createdAt = getClinicNow();
    const data = await sql`
        INSERT INTO chat_histories (id, user_id, messages, created_at)
        VALUES (${id}, ${userId}, ${JSON.stringify(messages)}, ${createdAt})
        RETURNING *;
    `;
    return data[0];
};
