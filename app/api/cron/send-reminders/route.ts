import { getAppointmentsDueForReminder, markReminderSent } from '@/lib/services/appointments';
import { sendReminderEmail } from '@/lib/services/email';
import type { Appointment } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

        console.log(`[send-reminders] Processed ${appointments.length} due: ${sent} sent, ${skipped} skipped`);
        return Response.json({ sent, skipped });
    } catch (err) {
        console.error('[send-reminders] Error processing reminders:', err);
        return Response.json({ error: 'Failed to process reminders' }, { status: 500 });
    }
}
