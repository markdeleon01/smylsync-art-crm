import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock the appointments service – tests run offline, no real DB required
// ---------------------------------------------------------------------------
const mockGetRange = vi.fn();
vi.mock('@/lib/services/appointments', () => ({
    getAppointmentsByDateRange: (...args: unknown[]) => mockGetRange(...args)
}));

// Server action imports (after mocking)
import { getWeekAppointments, getMonthAppointments, getDayAppointments } from './actions';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const makeAppt = (overrides: Record<string, unknown> = {}) => ({
    id: 'appt-001',
    patient_id: 'patient-001',
    start_time: '2026-05-05T09:00:00.000Z',
    end_time: '2026-05-05T09:30:00.000Z',
    appointment_type: 'checkup',
    status: 'scheduled',
    notes: null,
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    ...overrides
});

beforeEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// getWeekAppointments
// ---------------------------------------------------------------------------

describe('getWeekAppointments', () => {
    it('fetches appointments for the full Mon–Sun week', async () => {
        const rows = [makeAppt()];
        mockGetRange.mockResolvedValueOnce(rows);

        // Monday 2026-05-04 (YYYY-MM-DD)
        const result = await getWeekAppointments('2026-05-04');
        expect(mockGetRange).toHaveBeenCalledOnce();

        // Verify that start is UTC midnight Monday and end is UTC midnight 7 days later
        const [rangeStart, rangeEnd] = mockGetRange.mock.calls[0] as [string, string];
        const startDate = new Date(rangeStart);
        const endDate = new Date(rangeEnd);
        expect(startDate.getUTCDay()).toBe(1);     // Monday
        const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBe(7);
        expect(result).toEqual(rows);
    });

    it('always produces a UTC-midnight start', async () => {
        mockGetRange.mockResolvedValueOnce([]);
        await getWeekAppointments('2026-05-05'); // Tuesday
        const [rangeStart] = mockGetRange.mock.calls[0] as [string, string];
        const d = new Date(rangeStart);
        expect(d.getUTCHours()).toBe(0);
        expect(d.getUTCMinutes()).toBe(0);
        expect(d.getUTCSeconds()).toBe(0);
    });

    it('returns empty array when service throws', async () => {
        mockGetRange.mockRejectedValueOnce(new Error('DB error'));
        const result = await getWeekAppointments('2026-05-03');
        expect(result).toEqual([]);
    });

    it('returns empty array when no appointments exist', async () => {
        mockGetRange.mockResolvedValueOnce([]);
        const result = await getWeekAppointments('2026-05-03');
        expect(result).toEqual([]);
    });

    it('returns multiple appointments', async () => {
        const rows = [makeAppt(), makeAppt({ id: 'appt-002', start_time: '2026-05-04T10:00:00.000Z' })];
        mockGetRange.mockResolvedValueOnce(rows);
        const result = await getWeekAppointments('2026-05-03');
        expect(result).toHaveLength(2);
    });
});

// ---------------------------------------------------------------------------
// getMonthAppointments
// ---------------------------------------------------------------------------

describe('getMonthAppointments', () => {
    it('fetches appointments spanning the full calendar month', async () => {
        const rows = [makeAppt()];
        mockGetRange.mockResolvedValueOnce(rows);

        const result = await getMonthAppointments('2026-05-15');
        expect(mockGetRange).toHaveBeenCalledOnce();

        const [rangeStart, rangeEnd] = mockGetRange.mock.calls[0] as [string, string];
        const startDate = new Date(rangeStart);
        const endDate = new Date(rangeEnd);

        // Start should be UTC 1st of May
        expect(startDate.getUTCDate()).toBe(1);
        expect(startDate.getUTCMonth()).toBe(4); // May = 4 (0-indexed)

        // End should be UTC 1st of June (exclusive)
        expect(endDate.getUTCDate()).toBe(1);
        expect(endDate.getUTCMonth()).toBe(5); // June = 5

        expect(result).toEqual(rows);
    });

    it('handles the first day of the month as input', async () => {
        mockGetRange.mockResolvedValueOnce([]);
        await getMonthAppointments('2026-01-01');
        const [rangeStart] = mockGetRange.mock.calls[0] as [string, string];
        expect(new Date(rangeStart).getUTCMonth()).toBe(0); // January
    });

    it('handles the last day of the month as input', async () => {
        mockGetRange.mockResolvedValueOnce([]);
        await getMonthAppointments('2026-01-31');
        const [rangeStart, rangeEnd] = mockGetRange.mock.calls[0] as [string, string];
        expect(new Date(rangeStart).getUTCMonth()).toBe(0);  // January
        expect(new Date(rangeEnd).getUTCMonth()).toBe(1);    // February
    });

    it('returns empty array when service throws', async () => {
        mockGetRange.mockRejectedValueOnce(new Error('DB error'));
        const result = await getMonthAppointments('2026-05-01');
        expect(result).toEqual([]);
    });

    it('returns empty array when no appointments in month', async () => {
        mockGetRange.mockResolvedValueOnce([]);
        const result = await getMonthAppointments('2026-05-01');
        expect(result).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// getDayAppointments
// ---------------------------------------------------------------------------

describe('getDayAppointments', () => {
    it('fetches appointments for exactly one calendar day', async () => {
        const rows = [makeAppt()];
        mockGetRange.mockResolvedValueOnce(rows);

        const result = await getDayAppointments('2026-05-05');
        expect(mockGetRange).toHaveBeenCalledOnce();

        const [rangeStart, rangeEnd] = mockGetRange.mock.calls[0] as [string, string];
        const startDate = new Date(rangeStart);
        const endDate = new Date(rangeEnd);

        const diffMs = endDate.getTime() - startDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        expect(diffHours).toBe(24);
        expect(result).toEqual(rows);
    });

    it('produces a UTC-midnight start', async () => {
        mockGetRange.mockResolvedValueOnce([]);
        await getDayAppointments('2026-05-05');
        const [rangeStart] = mockGetRange.mock.calls[0] as [string, string];
        const d = new Date(rangeStart);
        expect(d.getUTCHours()).toBe(0);
        expect(d.getUTCMinutes()).toBe(0);
        expect(d.getUTCSeconds()).toBe(0);
    });

    it('end range is the next calendar day at UTC midnight', async () => {
        mockGetRange.mockResolvedValueOnce([]);
        await getDayAppointments('2026-05-05');
        const [, rangeEnd] = mockGetRange.mock.calls[0] as [string, string];
        const endDate = new Date(rangeEnd);
        expect(endDate.getUTCDate()).toBe(6); // May 6
    });

    it('returns empty array when service throws', async () => {
        mockGetRange.mockRejectedValueOnce(new Error('DB error'));
        const result = await getDayAppointments('2026-05-05');
        expect(result).toEqual([]);
    });

    it('returns empty array when no appointments on the day', async () => {
        mockGetRange.mockResolvedValueOnce([]);
        const result = await getDayAppointments('2026-05-05');
        expect(result).toEqual([]);
    });

    it('returns multiple appointments in a day', async () => {
        const rows = [
            makeAppt({ start_time: '2026-05-05T09:00:00.000Z' }),
            makeAppt({ id: 'appt-002', start_time: '2026-05-05T11:00:00.000Z' }),
            makeAppt({ id: 'appt-003', start_time: '2026-05-05T14:00:00.000Z' })
        ];
        mockGetRange.mockResolvedValueOnce(rows);
        const result = await getDayAppointments('2026-05-05');
        expect(result).toHaveLength(3);
    });
});

// ---------------------------------------------------------------------------
// getAppointmentsByDateRange (underlying service) – covered via actions above
// but verify correct ISO strings are forwarded
// ---------------------------------------------------------------------------

describe('date range forwarding', () => {
    it('getWeekAppointments forwards valid ISO strings to the service', async () => {
        mockGetRange.mockResolvedValueOnce([]);
        await getWeekAppointments('2026-06-07'); // Sunday
        const [start, end] = mockGetRange.mock.calls[0] as [string, string];
        expect(() => new Date(start)).not.toThrow();
        expect(() => new Date(end)).not.toThrow();
        expect(new Date(start).getTime()).toBeLessThan(new Date(end).getTime());
    });

    it('getMonthAppointments forwards valid ISO strings to the service', async () => {
        mockGetRange.mockResolvedValueOnce([]);
        await getMonthAppointments('2026-06-15');
        const [start, end] = mockGetRange.mock.calls[0] as [string, string];
        expect(new Date(start).getTime()).toBeLessThan(new Date(end).getTime());
    });

    it('getDayAppointments forwards valid ISO strings to the service', async () => {
        mockGetRange.mockResolvedValueOnce([]);
        await getDayAppointments('2026-06-15');
        const [start, end] = mockGetRange.mock.calls[0] as [string, string];
        expect(new Date(start).getTime()).toBeLessThan(new Date(end).getTime());
    });
});
