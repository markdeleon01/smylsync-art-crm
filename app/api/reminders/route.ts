import { getAppointmentsDueForReminder, markReminderSent } from '@/lib/services/appointments';
import type { Appointment } from '@/lib/types';
import { sendReminderEmail } from '@/lib/email';

export async function GET(req: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
        console.error('[reminders] CRON_SECRET is not set');
        return Response.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${secret}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const appointments = await getAppointmentsDueForReminder();
        let sent = 0;
        let skipped = 0;

        for (const appt of appointments) {
            const email = appt.email as string | undefined;
            if (!email) {
                skipped++;
                continue;
            }
            await sendReminderEmail(
                appt as Appointment,
                appt.firstname as string,
                appt.lastname as string,
                email
            );
            await markReminderSent(appt.id as string);
            sent++;
        }

        console.log(`[reminders] Processed ${appointments.length} due: ${sent} sent, ${skipped} skipped`);
        return Response.json({ sent, skipped });
    } catch (err) {
        console.error('[reminders] Error processing reminders:', err);
        return Response.json({ error: 'Failed to process reminders' }, { status: 500 });
    }
}
