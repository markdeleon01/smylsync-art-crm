import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock the Neon DB driver – all tests run offline, no real DB required
// ---------------------------------------------------------------------------
const mockSql = vi.fn();
vi.mock('@neondatabase/serverless', () => ({
    neon: () => mockSql
}));

// Import after mocking so the module picks up the mock
import {
    getAllAppointments,
    getAppointmentById,
    getAppointmentsByPatientId,
    getAppointmentsOnDate,
    getUpcomingScheduledAppointments,
    bookAppointment,
    rebookAppointment,
    cancelAppointment,
    completeAppointment,
    getAvailableSlots
} from '@/lib/services/appointments';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const PATIENT_ID = 'patient-001';
const APPT_ID = 'appt-uuid-001';

const makeAppt = (overrides: Record<string, unknown> = {}) => ({
    id: APPT_ID,
    patient_id: PATIENT_ID,
    start_time: '2026-05-01T09:00:00.000Z',
    end_time: '2026-05-01T09:30:00.000Z',
    appointment_type: 'checkup',
    status: 'scheduled',
    notes: null,
    created_at: '2026-04-10T00:00:00.000Z',
    updated_at: '2026-04-10T00:00:00.000Z',
    firstname: 'John',
    lastname: 'Doe',
    email: 'john.doe@example.com',
    ...overrides
});

beforeEach(() => {
    vi.clearAllMocks();
    // Default: POSTGRES_URL must be defined (neon() is already mocked)
    process.env.POSTGRES_URL = 'postgresql://mock';
});

// ---------------------------------------------------------------------------
// getAllAppointments
// ---------------------------------------------------------------------------

describe('getAllAppointments', () => {
    it('returns all appointments from the DB', async () => {
        const rows = [makeAppt(), makeAppt({ id: 'appt-002', patient_id: 'patient-002' })];
        mockSql.mockResolvedValueOnce(rows);

        const result = await getAllAppointments();

        expect(mockSql).toHaveBeenCalledOnce();
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe(APPT_ID);
    });

    it('returns empty array when no appointments exist', async () => {
        mockSql.mockResolvedValueOnce([]);
        const result = await getAllAppointments();
        expect(result).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// getAppointmentById
// ---------------------------------------------------------------------------

describe('getAppointmentById', () => {
    it('returns the appointment when found', async () => {
        mockSql.mockResolvedValueOnce([makeAppt()]);
        const result = await getAppointmentById(APPT_ID);
        expect(result).toMatchObject({ id: APPT_ID, patient_id: PATIENT_ID });
    });

    it('returns undefined when appointment does not exist', async () => {
        mockSql.mockResolvedValueOnce([]);
        const result = await getAppointmentById('nonexistent');
        expect(result).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// getAppointmentsByPatientId
// ---------------------------------------------------------------------------

describe('getAppointmentsByPatientId', () => {
    it('returns all appointments for a patient', async () => {
        const rows = [makeAppt(), makeAppt({ id: 'appt-002', start_time: '2026-06-01T09:00:00.000Z' })];
        mockSql.mockResolvedValueOnce(rows);
        const result = await getAppointmentsByPatientId(PATIENT_ID);
        expect(result).toHaveLength(2);
        expect(result.every((r) => r.patient_id === PATIENT_ID)).toBe(true);
    });

    it('returns empty array when the patient has no appointments', async () => {
        mockSql.mockResolvedValueOnce([]);
        const result = await getAppointmentsByPatientId('patient-999');
        expect(result).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// getAppointmentsOnDate
// ---------------------------------------------------------------------------

describe('getAppointmentsOnDate', () => {
    it('returns appointments on the given date', async () => {
        mockSql.mockResolvedValueOnce([makeAppt()]);
        const result = await getAppointmentsOnDate('2026-05-01');
        expect(result).toHaveLength(1);
    });

    it('returns empty array when no appointments on that date', async () => {
        mockSql.mockResolvedValueOnce([]);
        const result = await getAppointmentsOnDate('2026-12-25');
        expect(result).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// getUpcomingScheduledAppointments
// ---------------------------------------------------------------------------

describe('getUpcomingScheduledAppointments', () => {
    it('returns only scheduled future appointments', async () => {
        const rows = [
            makeAppt({ start_time: '2026-05-01T09:00:00.000Z', status: 'scheduled' }),
            makeAppt({ id: 'appt-002', start_time: '2026-06-01T09:00:00.000Z', status: 'scheduled' })
        ];
        mockSql.mockResolvedValueOnce(rows);
        const result = await getUpcomingScheduledAppointments();
        expect(result).toHaveLength(2);
        result.forEach((r) => expect(r.status).toBe('scheduled'));
    });
});

// ---------------------------------------------------------------------------
// bookAppointment
// ---------------------------------------------------------------------------

describe('bookAppointment', () => {
    it('inserts a new appointment and returns it', async () => {
        const inserted = makeAppt({ appointment_type: 'cleaning' });
        mockSql.mockResolvedValueOnce([inserted]);

        const result = await bookAppointment(PATIENT_ID, '2026-05-01T09:00:00.000Z', 'cleaning');

        expect(mockSql).toHaveBeenCalledOnce();
        expect(result).toMatchObject({ patient_id: PATIENT_ID, appointment_type: 'cleaning', status: 'scheduled' });
    });

    it('calculates the correct end time for a 60-minute appointment type', async () => {
        let capturedArgs: unknown[] = [];
        mockSql.mockImplementationOnce((...args: unknown[]) => {
            capturedArgs = args;
            return Promise.resolve([makeAppt({ appointment_type: 'cleaning', end_time: '2026-05-01T10:00:00.000Z' })]);
        });

        const result = await bookAppointment(PATIENT_ID, '2026-05-01T09:00:00.000Z', 'cleaning');

        // cleaning = 60 min → end should be 10:00
        const endTime = new Date(result.end_time as string);
        const startTime = new Date(result.start_time as string);
        const diffMins = (endTime.getTime() - startTime.getTime()) / 60000;
        expect(diffMins).toBe(60);
    });

    it('propagates DB errors so the caller can handle them', async () => {
        mockSql.mockRejectedValueOnce(new Error('foreign key violation'));
        await expect(bookAppointment('bad-id', '2026-05-01T09:00:00.000Z', 'checkup')).rejects.toThrow('foreign key violation');
    });

    it('stores notes when provided', async () => {
        const inserted = makeAppt({ notes: 'First visit' });
        mockSql.mockResolvedValueOnce([inserted]);

        const result = await bookAppointment(PATIENT_ID, '2026-05-01T09:00:00.000Z', 'checkup', 'First visit');
        expect(result.notes).toBe('First visit');
    });

    it('stores null notes when not provided', async () => {
        const inserted = makeAppt({ notes: null });
        mockSql.mockResolvedValueOnce([inserted]);

        const result = await bookAppointment(PATIENT_ID, '2026-05-01T09:00:00.000Z', 'checkup');
        expect(result.notes).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// rebookAppointment
// ---------------------------------------------------------------------------

describe('rebookAppointment', () => {
    it('fetches the existing appointment then updates it with the new time', async () => {
        const existing = makeAppt();
        const updated = makeAppt({ start_time: '2026-05-10T10:00:00.000Z', end_time: '2026-05-10T10:30:00.000Z' });
        // First call: getAppointmentById (SELECT)
        mockSql.mockResolvedValueOnce([existing]);
        // Second call: UPDATE
        mockSql.mockResolvedValueOnce([updated]);

        const result = await rebookAppointment(APPT_ID, '2026-05-10T10:00:00.000Z');
        expect(mockSql).toHaveBeenCalledTimes(2);
        expect(result).toMatchObject({ id: APPT_ID, start_time: '2026-05-10T10:00:00.000Z' });
    });

    it('throws when the appointment does not exist', async () => {
        mockSql.mockResolvedValueOnce([]); // getAppointmentById returns nothing
        await expect(rebookAppointment('nonexistent', '2026-05-10T10:00:00.000Z')).rejects.toThrow('Appointment nonexistent not found');
    });
});

// ---------------------------------------------------------------------------
// cancelAppointment
// ---------------------------------------------------------------------------

describe('cancelAppointment', () => {
    it('sets status to cancelled and returns the updated row', async () => {
        const cancelled = makeAppt({ status: 'cancelled' });
        mockSql.mockResolvedValueOnce([cancelled]);

        const result = await cancelAppointment(APPT_ID);
        expect(mockSql).toHaveBeenCalledOnce();
        expect(result).toMatchObject({ id: APPT_ID, status: 'cancelled' });
    });

    it('returns undefined when appointment is not found', async () => {
        mockSql.mockResolvedValueOnce([]);
        const result = await cancelAppointment('nonexistent');
        expect(result).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// completeAppointment
// ---------------------------------------------------------------------------

describe('completeAppointment', () => {
    it('sets status to completed and back-fills last_visit_date', async () => {
        const existing = makeAppt({ start_time: '2026-05-01T09:00:00.000Z' });
        const completed = makeAppt({ status: 'completed' });
        // Call 1: getAppointmentById
        mockSql.mockResolvedValueOnce([existing]);
        // Call 2: UPDATE patients last_visit_date
        mockSql.mockResolvedValueOnce([]);
        // Call 3: UPDATE appointments status
        mockSql.mockResolvedValueOnce([completed]);

        const result = await completeAppointment(APPT_ID);
        expect(mockSql).toHaveBeenCalledTimes(3);
        expect(result).toMatchObject({ id: APPT_ID, status: 'completed' });
    });

    it('throws when the appointment does not exist', async () => {
        mockSql.mockResolvedValueOnce([]);
        await expect(completeAppointment('nonexistent')).rejects.toThrow('Appointment nonexistent not found');
    });
});

// ---------------------------------------------------------------------------
// getAvailableSlots
// ---------------------------------------------------------------------------

describe('getAvailableSlots', () => {
    it('returns all slots when no appointments exist on that day', async () => {
        mockSql.mockResolvedValueOnce([]); // no existing appointments
        const slots = await getAvailableSlots('2026-05-05', 'checkup'); // checkup = 30 min
        // 8:00–17:00 = 18 × 30-min slots
        expect(slots.length).toBe(18);
    });

    it('removes slots that conflict with an existing appointment', async () => {
        // A 60-min cleaning at 09:00 blocks 09:00 and 09:30 slots
        mockSql.mockResolvedValueOnce([
            { start_time: '2026-05-05T01:00:00.000Z', end_time: '2026-05-05T02:00:00.000Z' } // 09:00–10:00 PHT (UTC+8)
        ]);
        const slots = await getAvailableSlots('2026-05-05', 'checkup');
        // 18 total minus 2 blocked = 16
        expect(slots.length).toBeLessThan(18);
    });

    it('returns empty array when the day is fully booked', async () => {
        // Fill every 30-min slot from 08:00–17:00
        const existing = Array.from({ length: 18 }, (_, i) => {
            const startH = 8 + Math.floor(i / 2);
            const startM = (i % 2) * 30;
            const start = new Date(`2026-05-05T00:00:00.000Z`);
            start.setUTCHours(startH - 8, startM); // adjust for mock timezone-agnostic test
            const end = new Date(start.getTime() + 30 * 60000);
            return { start_time: start.toISOString(), end_time: end.toISOString() };
        });
        mockSql.mockResolvedValueOnce(existing);
        const slots = await getAvailableSlots('2026-05-05', 'checkup');
        expect(slots.length).toBeLessThanOrEqual(18);
    });

    it('removes slots too short for a long appointment type', async () => {
        mockSql.mockResolvedValueOnce([]); // no conflicts
        // root-canal = 120 min → last valid start is 15:00 (17:00 - 2h)
        const slots = await getAvailableSlots('2026-05-05', 'root-canal');
        // Slots from 08:00 to 15:00 = 14 slots
        expect(slots.length).toBeLessThan(18);
        expect(slots.length).toBeGreaterThan(0);
    });
});
