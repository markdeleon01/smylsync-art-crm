'use server';

import { getAppointmentsByDateRange } from '@/lib/services/appointments';

/**
 * Parse a 'YYYY-MM-DD' local date string into a UTC midnight Date using
 * Date.UTC() so the result is independent of the server's local timezone.
 */
function utcMidnight(yyyyMmDd: string): Date {
    const [y, m, d] = yyyyMmDd.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

/** Fetch all non-cancelled appointments for the Mon–Sun week starting at `weekStart` (YYYY-MM-DD). */
export async function getWeekAppointments(weekStart: string) {
    const start = utcMidnight(weekStart);
    const end = new Date(Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate() + 7
    ));

    try {
        return await getAppointmentsByDateRange(start.toISOString(), end.toISOString());
    } catch {
        return [];
    }
}

/** Fetch all non-cancelled appointments for the calendar month containing `date` (YYYY-MM-DD). */
export async function getMonthAppointments(date: string) {
    const [y, m] = date.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1)); // exclusive first day of next month

    try {
        return await getAppointmentsByDateRange(start.toISOString(), end.toISOString());
    } catch {
        return [];
    }
}

/** Fetch all non-cancelled appointments for a single calendar day (YYYY-MM-DD). */
export async function getDayAppointments(date: string) {
    const start = utcMidnight(date);
    const end = new Date(Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate() + 1
    ));

    try {
        return await getAppointmentsByDateRange(start.toISOString(), end.toISOString());
    } catch {
        return [];
    }
}
