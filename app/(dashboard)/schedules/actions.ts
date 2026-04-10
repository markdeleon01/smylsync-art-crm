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

/** Fetch all non-cancelled appointments for the calendar month containing `date`. */
export async function getMonthAppointments(date: string) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1); // exclusive

    try {
        return await getAppointmentsByDateRange(start.toISOString(), end.toISOString());
    } catch {
        return [];
    }
}

/** Fetch all non-cancelled appointments for a single calendar day. */
export async function getDayAppointments(date: string) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const start = new Date(d);
    const end = new Date(d);
    end.setDate(end.getDate() + 1);

    try {
        return await getAppointmentsByDateRange(start.toISOString(), end.toISOString());
    } catch {
        return [];
    }
}
