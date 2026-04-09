'use server';

import { getAppointmentsByDateRange } from '@/lib/services/appointments';

/** Fetch all non-cancelled appointments for the Sun–Sat week starting at `weekStart`. */
export async function getWeekAppointments(weekStart: string) {
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7); // Sun → next Sun (exclusive)
    end.setHours(0, 0, 0, 0);

    try {
        return await getAppointmentsByDateRange(start.toISOString(), end.toISOString());
    } catch {
        return [];
    }
}
