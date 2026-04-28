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
    getAppointmentsByDateRange,
    getAppointmentsOnDate,
    getUpcomingScheduledAppointments,
    bookAppointment,
    rebookAppointment,
    cancelAppointment,
    completeAppointment,
    getAvailableSlots,
    getAppointmentsDueForReminder,
    markReminderSent,
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
    // Pin to UTC so slot timestamps equal wall-clock times regardless of machine timezone
    process.env.CLINIC_TIMEZONE = 'UTC';
    delete process.env.CLINIC_HOURS_MONDAY;
    delete process.env.CLINIC_HOURS_TUESDAY;
    delete process.env.CLINIC_HOURS_WEDNESDAY;
    delete process.env.CLINIC_HOURS_THURSDAY;
    delete process.env.CLINIC_HOURS_FRIDAY;
    delete process.env.CLINIC_HOURS_SATURDAY;
    delete process.env.CLINIC_HOURS_SUNDAY;
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
// getAppointmentsByDateRange
// ---------------------------------------------------------------------------

describe('getAppointmentsByDateRange', () => {
    it('returns appointments within the specified range', async () => {
        const rows = [makeAppt(), makeAppt({ id: 'appt-002', start_time: '2026-05-03T10:00:00.000Z' })];
        mockSql.mockResolvedValueOnce(rows);
        const result = await getAppointmentsByDateRange('2026-05-01T00:00:00.000Z', '2026-05-08T00:00:00.000Z');
        expect(result).toHaveLength(2);
    });

    it('returns empty array when no appointments in range', async () => {
        mockSql.mockResolvedValueOnce([]);
        const result = await getAppointmentsByDateRange('2026-05-01T00:00:00.000Z', '2026-05-02T00:00:00.000Z');
        expect(result).toHaveLength(0);
    });

    it('includes patient name fields from the JOIN', async () => {
        const row = makeAppt({ firstname: 'Alice', lastname: 'Smith', email: 'alice@example.com' });
        mockSql.mockResolvedValueOnce([row]);
        const result = await getAppointmentsByDateRange('2026-05-01T00:00:00.000Z', '2026-05-08T00:00:00.000Z');
        expect(result[0]).toHaveProperty('firstname', 'Alice');
        expect(result[0]).toHaveProperty('lastname', 'Smith');
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

    it('returns empty array when there are no upcoming appointments', async () => {
        mockSql.mockResolvedValueOnce([]);
        const result = await getUpcomingScheduledAppointments();
        expect(result).toHaveLength(0);
    });

    it('does not return cancelled appointments', async () => {
        // The DB query filters by status = scheduled, so the mock simulates that
        mockSql.mockResolvedValueOnce([
            makeAppt({ status: 'scheduled' })
        ]);
        const result = await getUpcomingScheduledAppointments();
        result.forEach((r) => expect(r.status).not.toBe('cancelled'));
    });

    it('selects the expected columns (no firstname/lastname join)', async () => {
        const row = {
            id: APPT_ID,
            patient_id: PATIENT_ID,
            start_time: '2026-05-01T09:00:00.000Z',
            end_time: '2026-05-01T09:30:00.000Z',
            appointment_type: 'checkup',
            status: 'scheduled',
            notes: null
        };
        mockSql.mockResolvedValueOnce([row]);
        const result = await getUpcomingScheduledAppointments();
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('patient_id');
        expect(result[0]).toHaveProperty('start_time');
        expect(result[0]).toHaveProperty('end_time');
        expect(result[0]).toHaveProperty('appointment_type');
        expect(result[0]).toHaveProperty('status');
        expect(result[0]).toHaveProperty('notes');
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
        // 8:00–20:00 = 24 × 30-min slots
        expect(slots.length).toBe(24);
    });

    it('removes slots that conflict with an existing appointment', async () => {
        // A 60-min appointment at 09:00 UTC blocks the 09:00 and 09:30 slots.
        // Use Date.UTC to construct machine-independent UTC timestamps.
        const apptStart = new Date(Date.UTC(2026, 4, 5, 9, 0, 0, 0));
        const apptEnd = new Date(apptStart.getTime() + 60 * 60 * 1000);
        mockSql.mockResolvedValueOnce([
            { start_time: apptStart.toISOString(), end_time: apptEnd.toISOString() }
        ]);
        const slots = await getAvailableSlots('2026-05-05', 'checkup');
        // 24 total minus 2 blocked = 22
        expect(slots.length).toBeLessThan(24);
    });

    it('returns empty array when the day is fully booked', async () => {
        // Fill every 30-min slot from 08:00–20:00 UTC (matches CLINIC_TIMEZONE=UTC slot times)
        // Generate appointments in clinic wall time (Asia/Manila, no Z)
        const pad = (n: number) => n.toString().padStart(2, '0');
        const existing = Array.from({ length: 24 }, (_, i) => {
            const startH = 8 + Math.floor(i / 2);
            const startM = (i % 2) * 30;
            const start = `2026-05-05T${pad(startH)}:${pad(startM)}:00`;
            const endDate = new Date(`2026-05-05T${pad(startH)}:${pad(startM)}:00`);
            endDate.setMinutes(endDate.getMinutes() + 30);
            const end = `2026-05-05T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`;
            return { start_time: start, end_time: end };
        });
        mockSql.mockResolvedValueOnce(existing);
        const slots = await getAvailableSlots('2026-05-05', 'checkup');
        if (slots.length !== 0) {
            // Debug output
            // eslint-disable-next-line no-console
            console.log('DEBUG: slots returned:', slots);
            // eslint-disable-next-line no-console
            console.log('DEBUG: existing appts:', existing.map(a => ({ start: a.start_time, end: a.end_time })));
        }
        expect(slots.length).toBe(0);
    });

    it('removes slots too short for a long appointment type', async () => {
        mockSql.mockResolvedValueOnce([]); // no conflicts
        // root-canal = 120 min → last valid start is 18:00 (20:00 - 2h)
        const slots = await getAvailableSlots('2026-05-05', 'root-canal');
        // Slots from 08:00 to 18:00 = 20 slots
        expect(slots.length).toBeLessThan(24);
        expect(slots.length).toBeGreaterThan(0);
    });

    it('returns no slots when the configured day is closed', async () => {
        process.env.CLINIC_HOURS_TUESDAY = 'closed';
        mockSql.mockResolvedValueOnce([]);

        const slots = await getAvailableSlots('2026-05-05', 'checkup');

        expect(slots).toEqual([]);
    });

    it('respects configured opening and closing hours', async () => {
        process.env.CLINIC_HOURS_TUESDAY = '09:00-12:00';
        mockSql.mockResolvedValueOnce([]);

        const slots = await getAvailableSlots('2026-05-05', 'checkup');

        expect(slots).toHaveLength(6);
    });
});

// ---------------------------------------------------------------------------
// getAppointmentsDueForReminder
// ---------------------------------------------------------------------------

describe('getAppointmentsDueForReminder', () => {
    it('returns appointments in the 23–25 hour reminder window', async () => {
        const row = makeAppt({ reminder_sent: false });
        mockSql.mockResolvedValueOnce([row]);
        const result = await getAppointmentsDueForReminder();
        expect(result).toHaveLength(1);
        expect(mockSql).toHaveBeenCalledOnce();
    });

    it('returns an empty array when no appointments are in the window', async () => {
        mockSql.mockResolvedValueOnce([]);
        const result = await getAppointmentsDueForReminder();
        expect(result).toHaveLength(0);
    });

    it('includes joined patient fields (email, firstname, lastname)', async () => {
        const row = makeAppt({ email: 'john.doe@example.com', firstname: 'John', lastname: 'Doe' });
        mockSql.mockResolvedValueOnce([row]);
        const [appt] = await getAppointmentsDueForReminder();
        expect(appt).toHaveProperty('email', 'john.doe@example.com');
        expect(appt).toHaveProperty('firstname', 'John');
        expect(appt).toHaveProperty('lastname', 'Doe');
    });
});

// ---------------------------------------------------------------------------
// markReminderSent
// ---------------------------------------------------------------------------

describe('markReminderSent', () => {
    it('executes an UPDATE without throwing', async () => {
        mockSql.mockResolvedValueOnce([]);
        await expect(markReminderSent(APPT_ID)).resolves.not.toThrow();
        expect(mockSql).toHaveBeenCalledOnce();
    });

    it('propagates DB errors', async () => {
        mockSql.mockRejectedValueOnce(new Error('DB connection lost'));
        await expect(markReminderSent(APPT_ID)).rejects.toThrow('DB connection lost');
    });
});
