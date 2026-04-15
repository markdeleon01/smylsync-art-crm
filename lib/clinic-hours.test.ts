import { afterEach, describe, expect, it } from 'vitest';
import {
    getBusinessHoursBounds,
    getClinicBusinessHours,
    getOrderedBusinessHours
} from './clinic-hours';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
});

describe('getClinicBusinessHours', () => {
    it('uses the default 8:00 AM to 8:00 PM hours when no env vars are set', () => {
        delete process.env.CLINIC_HOURS_MONDAY;

        const hours = getClinicBusinessHours();

        expect(hours.monday?.startMinutes).toBe(8 * 60);
        expect(hours.monday?.endMinutes).toBe(20 * 60);
        expect(hours.monday?.label).toBe('8:00 AM - 8:00 PM');
    });

    it('parses configured hours for individual weekdays', () => {
        process.env.CLINIC_HOURS_MONDAY = '09:30-18:00';

        const hours = getClinicBusinessHours();

        expect(hours.monday?.startMinutes).toBe(9 * 60 + 30);
        expect(hours.monday?.endMinutes).toBe(18 * 60);
        expect(hours.monday?.label).toBe('9:30 AM - 6:00 PM');
    });

    it('supports marking a day as closed', () => {
        process.env.CLINIC_HOURS_SUNDAY = 'closed';

        const hours = getClinicBusinessHours();

        expect(hours.sunday).toBeNull();
    });

    it('falls back to defaults for invalid values', () => {
        process.env.CLINIC_HOURS_FRIDAY = 'not-a-time';

        const hours = getClinicBusinessHours();

        expect(hours.friday?.label).toBe('8:00 AM - 8:00 PM');
    });
});

describe('business hours helpers', () => {
    it('derives the earliest open and latest close time across the week', () => {
        process.env.CLINIC_HOURS_MONDAY = '07:30-16:00';
        process.env.CLINIC_HOURS_THURSDAY = '10:00-19:00';

        const bounds = getBusinessHoursBounds(getClinicBusinessHours());

        expect(bounds).toEqual({
            startMinutes: 7 * 60 + 30,
            endMinutes: 20 * 60
        });
    });

    it('returns display-ready ordered business hours', () => {
        process.env.CLINIC_HOURS_SATURDAY = 'closed';

        const ordered = getOrderedBusinessHours(getClinicBusinessHours());

        expect(ordered[0]).toEqual({
            day: 'monday',
            label: 'Monday',
            hoursLabel: '8:00 AM - 8:00 PM'
        });
        expect(ordered[5]).toEqual({
            day: 'saturday',
            label: 'Saturday',
            hoursLabel: 'Closed'
        });
    });
});
