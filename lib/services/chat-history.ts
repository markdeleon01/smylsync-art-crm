import { neon } from '@neondatabase/serverless';

/** Returns the current moment as an ISO 8601 string with the clinic's UTC offset,
 *  e.g. "2026-04-13T22:30:00+08:00" for Asia/Manila. */
function getClinicNow(): string {
    const timezone = process.env.CLINIC_TIMEZONE ?? 'UTC';
    const now = new Date();
    // 'sv' locale gives "YYYY-MM-DD HH:MM:SS" in the target timezone
    const localStr = now.toLocaleString('sv', { timeZone: timezone });
    // Compute UTC offset by comparing the same moment in UTC vs. the clinic timezone
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMs = tzDate.getTime() - utcDate.getTime();
    const sign = offsetMs >= 0 ? '+' : '-';
    const absMs = Math.abs(offsetMs);
    const hh = String(Math.floor(absMs / 3_600_000)).padStart(2, '0');
    const mm = String(Math.floor((absMs % 3_600_000) / 60_000)).padStart(2, '0');
    return `${localStr.replace(' ', 'T')}${sign}${hh}:${mm}`;
}

export const recordLoginEvent = async (email: string) => {
    const sql = neon(process.env.POSTGRES_URL!);
    const id = crypto.randomUUID();
    const loggedInAt = getClinicNow();
    await sql`
        INSERT INTO login_events (id, email, logged_in_at)
        VALUES (${id}, ${email}, ${loggedInAt});
    `;
};

export const saveChatHistory = async (userId: string, messages: unknown[]) => {
    console.log('saveChatHistory called with userId:', userId, 'and messages:', messages);
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
