import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Appointment } from '@/lib/types';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransport = vi.fn(() => ({ sendMail: mockSendMail }));

vi.mock('nodemailer', () => ({
    default: { createTransport: mockCreateTransport },
}));

// Helper to import fresh module after env changes
async function importEmail() {
    vi.resetModules();
    // Re-mock after resetModules
    vi.mock('nodemailer', () => ({
        default: { createTransport: mockCreateTransport },
    }));
    return import('@/lib/email');
}

// ── Fixtures ───────────────────────────────────────────────────────────────

const APPT: Appointment = {
    id: 'appt-1',
    patient_id: 'p-1',
    start_time: '2026-06-01T09:00:00.000Z',
    end_time: '2026-06-01T09:30:00.000Z',
    appointment_type: 'checkup',
    status: 'scheduled',
    notes: null,
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('lib/email – CI-safe no-op (SMTP_HOST absent)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.SMTP_HOST;
    });

    it('sendBookingConfirmation does not call sendMail when SMTP_HOST is unset', async () => {
        const { sendBookingConfirmation } = await importEmail();
        await sendBookingConfirmation(APPT, 'Jane', 'Doe', 'jane@example.com');
        expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('sendReschedulingNotification does not call sendMail when SMTP_HOST is unset', async () => {
        const { sendReschedulingNotification } = await importEmail();
        await sendReschedulingNotification(APPT, 'Jane', 'Doe', 'jane@example.com');
        expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('sendCancellationNotice does not call sendMail when SMTP_HOST is unset', async () => {
        const { sendCancellationNotice } = await importEmail();
        await sendCancellationNotice(APPT, 'Jane', 'Doe', 'jane@example.com');
        expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('sendReminderEmail does not call sendMail when SMTP_HOST is unset', async () => {
        const { sendReminderEmail } = await importEmail();
        await sendReminderEmail(APPT, 'Jane', 'Doe', 'jane@example.com');
        expect(mockSendMail).not.toHaveBeenCalled();
    });
});

describe('lib/email – sends mail when SMTP_HOST is configured', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.SMTP_HOST = 'smtp.example.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'user@example.com';
        process.env.SMTP_PASS = 'secret';
        process.env.SMTP_FROM = 'noreply@example.com';
    });

    afterEach(() => {
        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
        delete process.env.SMTP_USER;
        delete process.env.SMTP_PASS;
        delete process.env.SMTP_FROM;
    });

    it('sendBookingConfirmation calls sendMail with correct recipient and subject', async () => {
        const { sendBookingConfirmation } = await importEmail();
        await sendBookingConfirmation(APPT, 'Jane', 'Doe', 'jane@example.com');

        expect(mockSendMail).toHaveBeenCalledOnce();
        const [mailOptions] = mockSendMail.mock.calls[0];
        expect(mailOptions.to).toBe('jane@example.com');
        expect(mailOptions.subject).toContain('Confirmation');
        expect(mailOptions.html).toContain('Jane Doe');
        expect(mailOptions.html).toContain('Checkup');
    });

    it('sendReschedulingNotification calls sendMail with correct recipient and subject', async () => {
        const { sendReschedulingNotification } = await importEmail();
        await sendReschedulingNotification(APPT, 'John', 'Smith', 'john@example.com');

        expect(mockSendMail).toHaveBeenCalledOnce();
        const [mailOptions] = mockSendMail.mock.calls[0];
        expect(mailOptions.to).toBe('john@example.com');
        expect(mailOptions.subject).toContain('Rescheduled');
        expect(mailOptions.html).toContain('John Smith');
    });

    it('sendCancellationNotice calls sendMail with correct recipient and subject', async () => {
        const { sendCancellationNotice } = await importEmail();
        await sendCancellationNotice(APPT, 'Jane', 'Doe', 'jane@example.com');

        expect(mockSendMail).toHaveBeenCalledOnce();
        const [mailOptions] = mockSendMail.mock.calls[0];
        expect(mailOptions.to).toBe('jane@example.com');
        expect(mailOptions.subject).toContain('Cancellation');
        expect(mailOptions.html).toContain('Jane Doe');
    });

    it('sendReminderEmail calls sendMail with correct recipient and subject', async () => {
        const { sendReminderEmail } = await importEmail();
        await sendReminderEmail(APPT, 'Jane', 'Doe', 'jane@example.com');

        expect(mockSendMail).toHaveBeenCalledOnce();
        const [mailOptions] = mockSendMail.mock.calls[0];
        expect(mailOptions.to).toBe('jane@example.com');
        expect(mailOptions.subject).toContain('Reminder');
        expect(mailOptions.html).toContain('Jane Doe');
        expect(mailOptions.html).toContain('tomorrow');
    });

    it('sendBookingConfirmation does not throw when sendMail rejects (swallows error)', async () => {
        mockSendMail.mockRejectedValueOnce(new Error('SMTP timeout'));
        const { sendBookingConfirmation } = await importEmail();
        await expect(
            sendBookingConfirmation(APPT, 'Jane', 'Doe', 'jane@example.com')
        ).resolves.not.toThrow();
    });
});
