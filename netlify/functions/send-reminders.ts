
import type { Config } from '@netlify/functions';
import { getAppointmentsDueForReminder, markReminderSent } from '../../lib/services/appointments';
import { sendReminderEmail } from '../../lib/services/email';
import type { Appointment } from '../../lib/types';

const secret = process.env.CRON_SECRET;

const handler = async () => {

    if (!secret) {
        console.error('[send-reminders] CRON_SECRET not set');
        return { statusCode: 500, body: 'Server configuration error.' };
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

        console.log('[send-reminders] CLINIC_TIMEZONE: ', process.env.CLINIC_TIMEZONE);
        console.log('[send-reminders] NEXT_PUBLIC_CLINIC_TIMEZONE: ', process.env.NEXT_PUBLIC_CLINIC_TIMEZONE);
        console.log(`[send-reminders] Processed ${appointments.length} due: ${sent} sent, ${skipped} skipped`);
        return {
            statusCode: 200,
            body: JSON.stringify({ sent, skipped }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (err) {
        console.error('[send-reminders] Error processing reminders:', err);
        return { statusCode: 500, body: 'Failed to process reminders' };
    }
};

export { handler };

export const config: Config = {
    schedule: '0 * * * *', // every hour on the hour
};
