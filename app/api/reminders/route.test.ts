import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────

const {
    mockGetAppointmentsDueForReminder,
    mockMarkReminderSent,
    mockSendReminderEmail,
} = vi.hoisted(() => ({
    mockGetAppointmentsDueForReminder: vi.fn(),
    mockMarkReminderSent: vi.fn(),
    mockSendReminderEmail: vi.fn(),
}));

vi.mock('@/lib/services/appointments', () => ({
    getAppointmentsDueForReminder: mockGetAppointmentsDueForReminder,
    markReminderSent: mockMarkReminderSent,
}));

vi.mock('@/lib/email', () => ({
    sendReminderEmail: mockSendReminderEmail,
}));

// Import after mocks
import { GET } from '@/app/api/reminders/route';

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeRequest(authHeader?: string): Request {
    return new Request('http://localhost/api/reminders', {
        method: 'GET',
        headers: authHeader ? { authorization: authHeader } : {},
    });
}

const DUE_APPT = {
    id: 'appt-1',
    patient_id: 'p-1',
    start_time: '2026-06-01T09:00:00.000Z',
    end_time: '2026-06-01T09:30:00.000Z',
    appointment_type: 'checkup',
    status: 'scheduled',
    notes: null,
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/reminders – auth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.CRON_SECRET = 'test-secret-123';
    });

    afterEach(() => {
        delete process.env.CRON_SECRET;
    });

    it('returns 401 when Authorization header is missing', async () => {
        const res = await GET(makeRequest());
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toMatch(/unauthorized/i);
    });

    it('returns 401 when bearer token is wrong', async () => {
        const res = await GET(makeRequest('Bearer wrong-secret'));
        expect(res.status).toBe(401);
    });

    it('returns 500 when CRON_SECRET env var is not set', async () => {
        delete process.env.CRON_SECRET;
        const res = await GET(makeRequest('Bearer anything'));
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toMatch(/configuration/i);
    });
});

describe('GET /api/reminders – processing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.CRON_SECRET = 'test-secret-123';
        mockSendReminderEmail.mockResolvedValue(undefined);
        mockMarkReminderSent.mockResolvedValue(undefined);
    });

    afterEach(() => {
        delete process.env.CRON_SECRET;
    });

    it('returns { sent: 0, skipped: 0 } when no appointments are due', async () => {
        mockGetAppointmentsDueForReminder.mockResolvedValue([]);
        const res = await GET(makeRequest('Bearer test-secret-123'));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({ sent: 0, skipped: 0 });
    });

    it('sends a reminder and marks it sent for each due appointment', async () => {
        mockGetAppointmentsDueForReminder.mockResolvedValue([DUE_APPT]);
        const res = await GET(makeRequest('Bearer test-secret-123'));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({ sent: 1, skipped: 0 });
        expect(mockSendReminderEmail).toHaveBeenCalledOnce();
        expect(mockMarkReminderSent).toHaveBeenCalledWith('appt-1');
    });

    it('increments skipped for appointments with no email', async () => {
        mockGetAppointmentsDueForReminder.mockResolvedValue([
            { ...DUE_APPT, email: undefined },
        ]);
        const res = await GET(makeRequest('Bearer test-secret-123'));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({ sent: 0, skipped: 1 });
        expect(mockSendReminderEmail).not.toHaveBeenCalled();
    });

    it('handles multiple appointments – some with email, some without', async () => {
        mockGetAppointmentsDueForReminder.mockResolvedValue([
            DUE_APPT,
            { ...DUE_APPT, id: 'appt-2', email: undefined },
            { ...DUE_APPT, id: 'appt-3', email: 'other@example.com' },
        ]);
        const res = await GET(makeRequest('Bearer test-secret-123'));
        const body = await res.json();
        expect(body).toEqual({ sent: 2, skipped: 1 });
        expect(mockSendReminderEmail).toHaveBeenCalledTimes(2);
        expect(mockMarkReminderSent).toHaveBeenCalledTimes(2);
    });

    it('returns 500 when the DB call throws', async () => {
        mockGetAppointmentsDueForReminder.mockRejectedValue(new Error('DB error'));
        const res = await GET(makeRequest('Bearer test-secret-123'));
        expect(res.status).toBe(500);
    });
});
