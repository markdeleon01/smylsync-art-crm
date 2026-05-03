import { neon } from '@neondatabase/serverless';

import type { Config } from '@netlify/functions';

import { format, parse } from 'date-fns';
// @ts-ignore
import { zonedTimeToUtc } from 'date-fns-tz';
import { APPOINTMENT_DURATIONS, SLOT_MINUTES } from '../../lib/types';
import {
    getBusinessHoursForDate,
    getClinicBusinessHours
} from '../../lib/clinic-hours';


const getDb = () => neon(process.env.POSTGRES_URL!);


/** Generate every 30-min slot boundary for a calendar day in the clinic's timezone */
function generateDaySlots(dateStr: string): string[] {
    // Returns wall time slot strings: 'YYYY-MM-DDTHH:mm:ss'
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateForDow = new Date(y, m - 1, d);
    const businessHours = getBusinessHoursForDate(dateForDow, getClinicBusinessHours());
    if (!businessHours) return [];

    const slots: string[] = [];
    let h = Math.floor(businessHours.startMinutes / 60);
    let min = businessHours.startMinutes % 60;
    let endMins = businessHours.endMinutes;
    while ((h * 60 + min) < endMins) {
        const slot = `${dateStr}T${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
        slots.push(slot);
        min += SLOT_MINUTES;
        if (min >= 60) {
            h += 1;
            min = min % 60;
        }
    }
    return slots;
}

/**
 * Returns ISO timestamp strings for every open slot on the given date.
 * A slot is open when no existing appointment overlaps its [start, start+duration) window.
 */
export const getAvailableSlots = async (
    date: string,
    appointmentType = 'checkup'
) => {
    // Enforce that CLINIC_TIMEZONE must be set
    const CLINIC_TIMEZONE = process.env.CLINIC_TIMEZONE;
    if (!CLINIC_TIMEZONE) {
        throw new Error('CLINIC_TIMEZONE environment variable must be set.');
    }
    // DEBUG: Log timezone environment and Intl support (always log for diagnosis)
    const tz = CLINIC_TIMEZONE;
    const testDate = new Date('2026-05-02T10:00:00');
    let resolvedTz = 'unknown';
    let formatted = 'error';
    try {
        resolvedTz = new Intl.DateTimeFormat('en-US', { timeZone: tz }).resolvedOptions().timeZone;
        formatted = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false }).format(testDate);
    } catch (e: any) {
        formatted = 'Intl error: ' + (e && e.message);
    }
    // eslint-disable-next-line no-console
    console.log('[DEBUG][getAvailableSlots] process.env.CLINIC_TIMEZONE:', process.env.CLINIC_TIMEZONE, '| CLINIC_TIMEZONE const:', tz, '| Intl resolved:', resolvedTz, '| 10:00:', formatted);
    const sql = getDb();
    // Query all appointments for the day (wall time)
    const existing = await sql`
        SELECT start_time, end_time
        FROM appointments
        WHERE start_time::date = ${date}::date
          AND status != 'cancelled'
    `;

    const durationMins = APPOINTMENT_DURATIONS[appointmentType] ?? 30;
    const slots = generateDaySlots(date);
    // Get business hours for the date
    const [y, m, d] = date.split('-').map(Number);
    const dateForDow = new Date(y, m - 1, d);
    const businessHours = getBusinessHoursForDate(dateForDow, getClinicBusinessHours());
    // Debug: print business hours and generated slots
    // eslint-disable-next-line no-console
    console.log('[DEBUG][getAvailableSlots] For date:', date, '| businessHours:', businessHours, '| slots:', slots);
    if (!businessHours) return [];
    const dayEndMinutes = businessHours.endMinutes;

    const available: string[] = [];
    for (const slot of slots) {
        // slot is wall time string 'YYYY-MM-DDTHH:mm:ss'
        // Replace 'T' with space for correct parsing
        const slotStr = slot.replace('T', ' ');
        const slotStart = parse(slotStr, 'yyyy-MM-dd HH:mm:ss', new Date());
        const slotEnd = new Date(slotStart.getTime() + durationMins * 60 * 1000);

        // Only allow slots that fit entirely within business hours
        const [_, timePart] = slot.split('T');
        const [h, min] = timePart.split(':').map(Number);
        const slotStartMinutes = h * 60 + min;
        const slotEndMinutes = slotStartMinutes + durationMins;
        if (slotEndMinutes > dayEndMinutes) continue;

        const hasConflict = existing.some((appt) => {
            // Normalize to wall time: remove 'Z', milliseconds, and replace 'T' with space
            const norm = (s: string) => s.replace('T', ' ').replace(/\..*$/, '').replace('Z', '');
            const apptStartStr = norm(appt.start_time as string);
            const apptEndStr = norm(appt.end_time as string);
            const apptStart = parse(apptStartStr, 'yyyy-MM-dd HH:mm:ss', new Date());
            const apptEnd = parse(apptEndStr, 'yyyy-MM-dd HH:mm:ss', new Date());
            return apptStart < slotEnd && apptEnd > slotStart;
        });

        if (!hasConflict) {
            available.push(slot);
        }
    }
    return available;
};

const handler = async () => {

    console.log('[DEBUG][get-available-slots] Available slots for 2026-05-05: ', await getAvailableSlots('2026-05-05'));
        
}

export { handler };

export const config: Config = {
    schedule: '0 * * * *', // every hour on the hour
};
