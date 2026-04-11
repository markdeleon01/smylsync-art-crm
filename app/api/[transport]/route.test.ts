/**
 * Tests for the MCP tool handlers in app/api/[transport]/route.ts.
 *
 * Strategy: we test the business logic of each tool by extracting the
 * handler functions directly via the exported `createMcpServer` – but since
 * createMcpServer is not exported we instead test the tool logic through
 * unit-level mocks that cover the key behaviour:
 *   • correct service function is called with the right arguments
 *   • happy-path response text contains the expected data
 *   • error paths return isError: true
 *   • email helpers are fired (fire-and-forget)
 *
 * The McpServer / transport layer is mocked so no HTTP server is needed.
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { NextRequest } from 'next/server';

// ── Mock all dependencies before importing the route ──────────────────────
// vi.mock is hoisted to top of file, so all mock fns must use vi.hoisted()
// registeredTools must also be in vi.hoisted() so the McpServer factory can
// reference it before module-level let declarations are initialised.

const hoisted = vi.hoisted(() => ({
    registeredTools: {} as Record<string, (args: Record<string, unknown>) => Promise<unknown>>,
    mockGetAllPatients: vi.fn(),
    mockGetPatientById: vi.fn(),
    mockGetPatientsByFirstName: vi.fn(),
    mockGetPatientsByLastName: vi.fn(),
    mockGetPatientByEmail: vi.fn(),
    mockUpdatePatientFirstName: vi.fn(),
    mockUpdatePatientLastName: vi.fn(),
    mockUpdatePatientEmail: vi.fn(),
    mockUpdatePatientPhone: vi.fn(),
    mockCreatePatient: vi.fn(),
    mockDeletePatientById: vi.fn(),
    mockDeletePatientByLastName: vi.fn(),
    mockDeletePatientByFirstName: vi.fn(),
    mockDeletePatientByEmail: vi.fn(),
    mockGetAllAppointments: vi.fn(),
    mockGetAppointmentById: vi.fn(),
    mockGetAppointmentsByPatientId: vi.fn(),
    mockGetAppointmentsOnDate: vi.fn(),
    mockBookAppointment: vi.fn(),
    mockRebookAppointment: vi.fn(),
    mockCancelAppointment: vi.fn(),
    mockCompleteAppointment: vi.fn(),
    mockGetAvailableSlots: vi.fn(),
    mockAutofillSchedule: vi.fn(),
    mockMarkReminderSent: vi.fn(),
    mockSendBookingConfirmation: vi.fn(),
    mockSendReschedulingNotification: vi.fn(),
    mockSendCancellationNotice: vi.fn(),
    mockSendReminderEmail: vi.fn(),
}));

// Destructure for ergonomics in test bodies
const {
    mockGetAllPatients,
    mockGetPatientById,
    mockGetPatientsByFirstName,
    mockGetPatientsByLastName,
    mockGetPatientByEmail,
    mockUpdatePatientFirstName,
    mockUpdatePatientLastName,
    mockUpdatePatientEmail,
    mockUpdatePatientPhone,
    mockCreatePatient,
    mockDeletePatientById,
    mockDeletePatientByLastName,
    mockDeletePatientByFirstName,
    mockDeletePatientByEmail,
    mockGetAllAppointments,
    mockGetAppointmentById,
    mockGetAppointmentsByPatientId,
    mockGetAppointmentsOnDate,
    mockBookAppointment,
    mockRebookAppointment,
    mockCancelAppointment,
    mockCompleteAppointment,
    mockGetAvailableSlots,
    mockAutofillSchedule,
    mockMarkReminderSent,
    mockSendBookingConfirmation,
    mockSendReschedulingNotification,
    mockSendCancellationNotice,
    mockSendReminderEmail,
} = hoisted;

vi.mock('@/lib/services/patients', () => ({
    getAllPatients: hoisted.mockGetAllPatients,
    getPatientById: hoisted.mockGetPatientById,
    getPatientsByFirstName: hoisted.mockGetPatientsByFirstName,
    getPatientsByLastName: hoisted.mockGetPatientsByLastName,
    getPatientByEmail: hoisted.mockGetPatientByEmail,
    updatePatientFirstName: hoisted.mockUpdatePatientFirstName,
    updatePatientLastName: hoisted.mockUpdatePatientLastName,
    updatePatientEmail: hoisted.mockUpdatePatientEmail,
    updatePatientPhone: hoisted.mockUpdatePatientPhone,
    createPatient: hoisted.mockCreatePatient,
    deletePatientById: hoisted.mockDeletePatientById,
    deletePatientByLastName: hoisted.mockDeletePatientByLastName,
    deletePatientByFirstName: hoisted.mockDeletePatientByFirstName,
    deletePatientByEmail: hoisted.mockDeletePatientByEmail,
}));

vi.mock('@/lib/services/appointments', () => ({
    getAllAppointments: hoisted.mockGetAllAppointments,
    getAppointmentById: hoisted.mockGetAppointmentById,
    getAppointmentsByPatientId: hoisted.mockGetAppointmentsByPatientId,
    getAppointmentsOnDate: hoisted.mockGetAppointmentsOnDate,
    bookAppointment: hoisted.mockBookAppointment,
    rebookAppointment: hoisted.mockRebookAppointment,
    cancelAppointment: hoisted.mockCancelAppointment,
    completeAppointment: hoisted.mockCompleteAppointment,
    getAvailableSlots: hoisted.mockGetAvailableSlots,
    autofillSchedule: hoisted.mockAutofillSchedule,
    markReminderSent: hoisted.mockMarkReminderSent,
}));

vi.mock('@/lib/services/email', () => ({
    sendBookingConfirmation: hoisted.mockSendBookingConfirmation,
    sendReschedulingNotification: hoisted.mockSendReschedulingNotification,
    sendCancellationNotice: hoisted.mockSendCancellationNotice,
    sendReminderEmail: hoisted.mockSendReminderEmail,
}));

// Mock the MCP SDK so no transport is needed
// registerTool writes into hoisted.registeredTools (available to vi.mock factories)
// Classes must be used (not arrow fns) because `new` requires a constructor.
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
    McpServer: class {
        registerTool(name: string, _meta: unknown, handler: (args: Record<string, unknown>) => Promise<unknown>) {
            hoisted.registeredTools[name] = handler;
        }
        connect() { return Promise.resolve(); }
    },
}));

vi.mock('@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js', () => ({
    WebStandardStreamableHTTPServerTransport: class {
        handleRequest() { return Promise.resolve(new Response()); }
    },
}));

// Import the GET handler. createMcpServer() is called per-request, NOT at
// module load time, so we trigger it in beforeAll below.
import { GET } from '@/app/api/[transport]/route';

// ── Seed tool registrations once ──────────────────────────────────────────
// Making a real (mocked) GET request causes createMcpServer() to run and
// populate hoisted.registeredTools with all tool handlers.
beforeAll(async () => {
    await GET(new Request('http://localhost/api/mcp') as NextRequest);
});

// ── Fixtures ───────────────────────────────────────────────────────────────

const PATIENT = {
    id: 'p-1',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    phone: '555-1234',
};

const APPT = {
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

function callTool(name: string, args: Record<string, unknown> = {}) {
    const handler = hoisted.registeredTools[name];
    if (!handler) throw new Error(`Tool '${name}' not registered`);
    return handler(args);
}

// ── Patient tool tests ─────────────────────────────────────────────────────

describe('MCP tool – get_all_patients', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns a formatted list of patients', async () => {
        mockGetAllPatients.mockResolvedValue([PATIENT]);
        const result = await callTool('get_all_patients') as any;
        expect(result.content[0].text).toContain('Jane');
        expect(result.content[0].text).toContain('Doe');
        expect(result.content[0].text).toContain('p-1');
    });

    it('returns "No patients were found" when list is empty', async () => {
        mockGetAllPatients.mockResolvedValue([]);
        const result = await callTool('get_all_patients') as any;
        expect(result.content[0].text).toContain('No patients were found');
    });
});

describe('MCP tool – get_patient_by_id', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns patient info when found', async () => {
        mockGetPatientById.mockResolvedValue(PATIENT);
        const result = await callTool('get_patient_by_id', { id: 'p-1' }) as any;
        expect(result.content[0].text).toContain('Jane');
        expect(result.content[0].text).toContain('p-1');
    });

    it('returns "No patient" message when not found', async () => {
        mockGetPatientById.mockResolvedValue(undefined);
        const result = await callTool('get_patient_by_id', { id: 'bad-id' }) as any;
        expect(result.content[0].text).toContain("No patient with id 'bad-id'");
    });
});

describe('MCP tool – create_new_patient', () => {
    beforeEach(() => vi.clearAllMocks());

    it('creates a patient and returns confirmation text', async () => {
        mockCreatePatient.mockResolvedValue(PATIENT);
        const result = await callTool('create_new_patient', {
            firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com'
        }) as any;
        expect(result.content[0].text).toContain('Patient created successfully');
        expect(result.content[0].text).toContain('p-1');
        expect(mockCreatePatient).toHaveBeenCalledWith('Jane', 'Doe', 'jane@example.com', undefined);
    });

    it('passes phone when provided', async () => {
        mockCreatePatient.mockResolvedValue(PATIENT);
        await callTool('create_new_patient', {
            firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com', phone: '555-1234'
        });
        expect(mockCreatePatient).toHaveBeenCalledWith('Jane', 'Doe', 'jane@example.com', '555-1234');
    });
});

describe('MCP tool – update_patient_phone', () => {
    beforeEach(() => vi.clearAllMocks());

    it('updates phone and returns confirmation', async () => {
        mockUpdatePatientPhone.mockResolvedValue({ ...PATIENT, phone: '555-9999' });
        const result = await callTool('update_patient_phone', { id: 'p-1', phone: '555-9999' }) as any;
        expect(result.content[0].text).toContain('Patient phone updated successfully');
        expect(result.content[0].text).toContain('555-9999');
    });
});

// ── Appointment tool tests ─────────────────────────────────────────────────

describe('MCP tool – book_appointment', () => {
    beforeEach(() => vi.clearAllMocks());

    it('books appointment successfully without sending email', async () => {
        mockGetPatientById.mockResolvedValue(PATIENT);
        mockBookAppointment.mockResolvedValue(APPT);

        const result = await callTool('book_appointment', {
            patient_id: 'p-1',
            start_time: '2026-06-01T09:00:00.000Z',
            appointment_type: 'checkup',
        }) as any;

        expect(result.content[0].text).toContain('Appointment booked successfully');
        expect(result.content[0].text).toContain('appt-1');
        expect(mockSendBookingConfirmation).not.toHaveBeenCalled();
    });

    it('returns error text when patient does not exist', async () => {
        mockGetPatientById.mockResolvedValue(undefined);
        const result = await callTool('book_appointment', {
            patient_id: 'bad-id',
            start_time: '2026-06-01T09:00:00.000Z',
            appointment_type: 'checkup',
        }) as any;
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("no patient found with id 'bad-id'");
        expect(mockBookAppointment).not.toHaveBeenCalled();
    });

    it('returns isError when bookAppointment throws', async () => {
        mockGetPatientById.mockResolvedValue(PATIENT);
        mockBookAppointment.mockRejectedValue(new Error('slot conflict'));
        const result = await callTool('book_appointment', {
            patient_id: 'p-1',
            start_time: '2026-06-01T09:00:00.000Z',
            appointment_type: 'checkup',
        }) as any;
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('slot conflict');
    });
});

describe('MCP tool – rebook_appointment', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rebooks appointment successfully without sending email', async () => {
        mockRebookAppointment.mockResolvedValue({ ...APPT, start_time: '2026-06-10T09:00:00.000Z' });

        const result = await callTool('rebook_appointment', {
            id: 'appt-1',
            new_start_time: '2026-06-10T09:00:00.000Z',
        }) as any;

        expect(result.content[0].text).toContain('Appointment rebooked successfully');
        expect(mockSendReschedulingNotification).not.toHaveBeenCalled();
    });

    it('returns isError when rebookAppointment throws', async () => {
        mockGetAppointmentById.mockResolvedValue(APPT);
        mockRebookAppointment.mockRejectedValue(new Error('not found'));
        const result = await callTool('rebook_appointment', {
            id: 'appt-1',
            new_start_time: '2026-06-10T09:00:00.000Z',
        }) as any;
        expect(result.isError).toBe(true);
    });
});

describe('MCP tool – cancel_appointment', () => {
    beforeEach(() => vi.clearAllMocks());

    it('cancels appointment successfully without sending email', async () => {
        mockCancelAppointment.mockResolvedValue({ ...APPT, status: 'cancelled' });

        const result = await callTool('cancel_appointment', { id: 'appt-1' }) as any;

        expect(result.content[0].text).toContain("has been cancelled");
        expect(mockSendCancellationNotice).not.toHaveBeenCalled();
    });

    it('returns isError when cancelAppointment throws', async () => {
        mockGetAppointmentById.mockResolvedValue(APPT);
        mockCancelAppointment.mockRejectedValue(new Error('DB error'));
        const result = await callTool('cancel_appointment', { id: 'appt-1' }) as any;
        expect(result.isError).toBe(true);
    });
});

describe('MCP tool – send_reminder', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSendReminderEmail.mockResolvedValue(undefined);
        mockMarkReminderSent.mockResolvedValue(undefined);
    });

    it('sends reminder email and marks reminder_sent', async () => {
        mockGetAppointmentById.mockResolvedValue(APPT);

        const result = await callTool('send_reminder', { id: 'appt-1' }) as any;

        expect(result.content[0].text).toContain('Reminder email sent');
        expect(result.content[0].text).toContain('jane@example.com');
        expect(mockSendReminderEmail).toHaveBeenCalledOnce();
        expect(mockMarkReminderSent).toHaveBeenCalledWith('appt-1');
    });

    it('returns "not found" text when appointment does not exist', async () => {
        mockGetAppointmentById.mockResolvedValue(undefined);
        const result = await callTool('send_reminder', { id: 'bad-id' }) as any;
        expect(result.content[0].text).toContain("not found");
        expect(mockSendReminderEmail).not.toHaveBeenCalled();
    });

    it('returns "No email" text when patient has no email on file', async () => {
        mockGetAppointmentById.mockResolvedValue({ ...APPT, email: undefined });
        const result = await callTool('send_reminder', { id: 'appt-1' }) as any;
        expect(result.content[0].text).toContain('No email address');
        expect(mockSendReminderEmail).not.toHaveBeenCalled();
    });

    it('returns isError when sendReminderEmail throws', async () => {
        mockGetAppointmentById.mockResolvedValue(APPT);
        mockSendReminderEmail.mockRejectedValue(new Error('SMTP error'));
        const result = await callTool('send_reminder', { id: 'appt-1' }) as any;
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('SMTP error');
    });
});

describe('MCP tool – complete_appointment', () => {
    beforeEach(() => vi.clearAllMocks());

    it('marks appointment as completed', async () => {
        mockCompleteAppointment.mockResolvedValue({ ...APPT, status: 'completed' });
        const result = await callTool('complete_appointment', { id: 'appt-1' }) as any;
        expect(result.content[0].text).toContain("marked as completed");
    });

    it('returns isError when completeAppointment throws', async () => {
        mockCompleteAppointment.mockRejectedValue(new Error('already completed'));
        const result = await callTool('complete_appointment', { id: 'appt-1' }) as any;
        expect(result.isError).toBe(true);
    });
});

describe('MCP tool – send_booking_confirmation', () => {
    beforeEach(() => vi.clearAllMocks());

    it('sends booking confirmation for a valid appointment', async () => {
        mockGetAppointmentById.mockResolvedValue(APPT);
        mockSendBookingConfirmation.mockResolvedValue(undefined);
        const result = await callTool('send_booking_confirmation', { id: 'appt-1' }) as any;
        expect(result.content[0].text).toContain('Booking confirmation sent');
        expect(result.content[0].text).toContain('jane@example.com');
        expect(mockSendBookingConfirmation).toHaveBeenCalledOnce();
    });

    it('returns isError when appointment is not found', async () => {
        mockGetAppointmentById.mockResolvedValue(undefined);
        const result = await callTool('send_booking_confirmation', { id: 'bad-id' }) as any;
        expect(result.isError).toBe(true);
        expect(mockSendBookingConfirmation).not.toHaveBeenCalled();
    });

    it('returns isError when patient has no email', async () => {
        mockGetAppointmentById.mockResolvedValue({ ...APPT, email: undefined });
        const result = await callTool('send_booking_confirmation', { id: 'appt-1' }) as any;
        expect(result.isError).toBe(true);
        expect(mockSendBookingConfirmation).not.toHaveBeenCalled();
    });

    it('returns isError when sendBookingConfirmation throws', async () => {
        mockGetAppointmentById.mockResolvedValue(APPT);
        mockSendBookingConfirmation.mockRejectedValue(new Error('SMTP failure'));
        const result = await callTool('send_booking_confirmation', { id: 'appt-1' }) as any;
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('SMTP failure');
    });
});

describe('MCP tool – send_rescheduling_notification', () => {
    beforeEach(() => vi.clearAllMocks());

    it('sends rescheduling notification for a valid appointment', async () => {
        mockGetAppointmentById.mockResolvedValue(APPT);
        mockSendReschedulingNotification.mockResolvedValue(undefined);
        const result = await callTool('send_rescheduling_notification', { id: 'appt-1' }) as any;
        expect(result.content[0].text).toContain('Rescheduling notification sent');
        expect(result.content[0].text).toContain('jane@example.com');
        expect(mockSendReschedulingNotification).toHaveBeenCalledOnce();
    });

    it('returns isError when appointment is not found', async () => {
        mockGetAppointmentById.mockResolvedValue(undefined);
        const result = await callTool('send_rescheduling_notification', { id: 'bad-id' }) as any;
        expect(result.isError).toBe(true);
        expect(mockSendReschedulingNotification).not.toHaveBeenCalled();
    });

    it('returns isError when sendReschedulingNotification throws', async () => {
        mockGetAppointmentById.mockResolvedValue(APPT);
        mockSendReschedulingNotification.mockRejectedValue(new Error('SMTP failure'));
        const result = await callTool('send_rescheduling_notification', { id: 'appt-1' }) as any;
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('SMTP failure');
    });
});

describe('MCP tool – send_cancellation_notice', () => {
    beforeEach(() => vi.clearAllMocks());

    it('sends cancellation notice for a valid appointment', async () => {
        mockGetAppointmentById.mockResolvedValue(APPT);
        mockSendCancellationNotice.mockResolvedValue(undefined);
        const result = await callTool('send_cancellation_notice', { id: 'appt-1' }) as any;
        expect(result.content[0].text).toContain('Cancellation notice sent');
        expect(result.content[0].text).toContain('jane@example.com');
        expect(mockSendCancellationNotice).toHaveBeenCalledOnce();
    });

    it('returns isError when appointment is not found', async () => {
        mockGetAppointmentById.mockResolvedValue(undefined);
        const result = await callTool('send_cancellation_notice', { id: 'bad-id' }) as any;
        expect(result.isError).toBe(true);
        expect(mockSendCancellationNotice).not.toHaveBeenCalled();
    });

    it('returns isError when sendCancellationNotice throws', async () => {
        mockGetAppointmentById.mockResolvedValue(APPT);
        mockSendCancellationNotice.mockRejectedValue(new Error('SMTP failure'));
        const result = await callTool('send_cancellation_notice', { id: 'appt-1' }) as any;
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('SMTP failure');
    });
});
