import type { Config } from '@netlify/functions';

// Runs every hour at :00. Calls the Next.js /api/reminders endpoint so that
// patients with appointments starting in 23–25 hours receive a reminder email.
export default async () => {
    const baseUrl = process.env.URL ?? process.env.NEXTAUTH_URL;
    if (!baseUrl) {
        console.error('[send-reminders] BASE_URL not set — cannot call /api/reminders');
        return;
    }

    const secret = process.env.CRON_SECRET;
    if (!secret) {
        console.error('[send-reminders] CRON_SECRET not set — aborting');
        return;
    }

    const url = `${baseUrl}/api/reminders`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${secret}` },
    });

    if (!res.ok) {
        const text = await res.text();
        console.error(`[send-reminders] /api/reminders returned ${res.status}: ${text}`);
        return;
    }

    const data = await res.json();
    console.log(`[send-reminders] Done — sent: ${data.sent}, skipped: ${data.skipped}`);
};

export const config: Config = {
    schedule: '0 * * * *', // every hour on the hour
};
