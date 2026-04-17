import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { getAllPatients, getPatientById, updatePatientFirstName, updatePatientLastName, updatePatientEmail, updatePatientPhone, getPatientsByFirstName, getPatientsByLastName, getPatientByEmail, createPatient, deletePatientById, deletePatientByLastName, deletePatientByFirstName, deletePatientByEmail } from "@/lib/services/patients";
import { getAllAppointments, getAppointmentById, getAppointmentsByPatientId, getAppointmentsOnDate, bookAppointment, rebookAppointment, cancelAppointment, completeAppointment, getAvailableSlots, autofillSchedule, markReminderSent } from "@/lib/services/appointments";
import { APPOINTMENT_TYPES } from "@/lib/types";
import type { Appointment } from "@/lib/types";
import { sendBookingConfirmation, sendReschedulingNotification, sendCancellationNotice, sendReminderEmail } from '@/lib/services/email';

// Define schemas outside to help with type inference
const patientIdSchema = z.object({ id: z.string() });
const patientEmailSchema = z.object({ email: z.string() });
const patientFirstNameSchema = z.object({ firstname: z.string().max(255) });
const patientLastNameSchema = z.object({ lastname: z.string().max(255) });
const updateFirstNameSchema = z.object({ id: z.string(), firstname: z.string().max(255) });
const updateLastNameSchema = z.object({ id: z.string(), lastname: z.string().max(255) });
const updateEmailSchema = z.object({ id: z.string(), email: z.string().max(255) });
const updatePhoneSchema = z.object({ id: z.string(), phone: z.string().max(20) });
const createPatientSchema = z.object({ firstname: z.string().max(255), lastname: z.string().max(255), email: z.string().max(255), phone: z.string().max(20).optional() });

// Appointment schemas
const appointmentIdSchema = z.object({ id: z.string() });
const bookAppointmentSchema = z.object({
    patient_id: z.string(),
    start_time: z.string().describe('ISO 8601 datetime string, e.g. 2026-04-10T09:00:00Z'),
    appointment_type: z.enum(APPOINTMENT_TYPES),
    notes: z.string().optional()
});
const rebookAppointmentSchema = z.object({
    id: z.string(),
    new_start_time: z.string().describe('ISO 8601 datetime string for the new appointment time')
});
const getByPatientIdSchema = z.object({ patient_id: z.string() });
const getAvailableSlotsSchema = z.object({
    date: z.string().describe('Date in YYYY-MM-DD format'),
    appointment_type: z.enum(APPOINTMENT_TYPES).optional()
});
const autofillSchema = z.object({
    weeks_ahead: z.number().int().min(1).max(12).optional().describe('How many weeks ahead to look for slots (default: 4)'),
    max_bookings: z.number().int().min(1).max(50).optional().describe('Maximum number of appointments to book (default: 20)')
});
const getAppointmentsByDateSchema = z.object({
    date: z.string().describe('Date in YYYY-MM-DD format')
});

export function createMcpServer() {
    const server = new McpServer({ name: "smylsync-mcp", version: "1.0.0" });

    // -----------------------------------------------------------------------
    // Patient tools
    // -----------------------------------------------------------------------

    server.registerTool(
        "get_all_patients",
        {
            title: "Get All Patients Information",
            description: "Use this tool to retrieve information about all patients.",
            annotations: { readOnlyHint: true },
        },
        async () => {
            try {
                const patients = await getAllPatients();
                let patientsInfos = '';
                if (patients.length > 0) {
                    patientsInfos += `All patients information retrieved successfully.\n\n`;
                    for (const patient of patients) {
                        patientsInfos += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                    }
                } else {
                    patientsInfos += `No patients were found.`;
                }
                return { content: [{ type: "text", text: patientsInfos }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to retrieve patients: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "get_patient_by_id",
        {
            title: "Get Patient Information by ID",
            description: "Use this tool to retrieve information about a patient given their ID.",
            inputSchema: patientIdSchema,
            annotations: { readOnlyHint: true },
        },
        async ({ id }: { id: string }) => {
            try {
                const patient = await getPatientById(id);
                let patientInfo = '';
                if (patient) {
                    patientInfo = `Patient with id '${id}' information retrieved successfully.\nPatient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n`;
                } else {
                    patientInfo = `No patient with id '${id}' was found.`;
                }
                return { content: [{ type: "text", text: patientInfo }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to retrieve patient: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "get_patients_by_lastname",
        {
            title: "Get Patients by Last Name",
            description: "Use this tool to retrieve information about patients given their last name.",
            inputSchema: patientLastNameSchema,
            annotations: { readOnlyHint: true },
        },
        async ({ lastname }: { lastname: string }) => {
            try {
                const patients = await getPatientsByLastName(lastname);
                let patientsInfos = '';
                if (patients.length > 0) {
                    patientsInfos += `All patients with last name '${lastname}' information retrieved successfully.\n\n`;
                    for (const patient of patients) {
                        patientsInfos += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                    }
                } else {
                    patientsInfos = `No patients were found.`;
                }
                return { content: [{ type: "text", text: patientsInfos }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to retrieve patients: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "get_patients_by_firstname",
        {
            title: "Get Patients by First Name",
            description: "Use this tool to retrieve information about patients given their first name.",
            inputSchema: patientFirstNameSchema,
            annotations: { readOnlyHint: true },
        },
        async ({ firstname }: { firstname: string }) => {
            try {
                const patients = await getPatientsByFirstName(firstname);
                let patientsInfos = '';
                if (patients.length > 0) {
                    patientsInfos += `All patients with first name '${firstname}' information retrieved successfully.\n\n`;
                    for (const patient of patients) {
                        patientsInfos += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                    }
                } else {
                    patientsInfos = `No patients were found.`;
                }
                return { content: [{ type: "text", text: patientsInfos }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to retrieve patients: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "get_patient_by_email",
        {
            title: "Get Patient Information by Email",
            description: "Use this tool to retrieve information about a patient given their email address.",
            inputSchema: patientEmailSchema,
            annotations: { readOnlyHint: true },
        },
        async ({ email }: { email: string }) => {
            try {
                const patient = await getPatientByEmail(email);
                let patientInfo = '';
                if (patient) {
                    patientInfo = `Patient with email '${email}' information retrieved successfully.\nPatient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n`;
                } else {
                    patientInfo = `No patient with email '${email}' was found.`;
                }
                return { content: [{ type: "text", text: patientInfo }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to retrieve patient: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "update_patient_firstname",
        {
            title: "Update Patient First Name",
            description: "Use this tool when a user asks to change or correct a patient's first name given their ID.",
            inputSchema: updateFirstNameSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ id, firstname }: { id: string; firstname: string }) => {
            try {
                const updatedPatient = await updatePatientFirstName(id, firstname);
                return { content: [{ type: "text", text: `Patient first name updated successfully.\nPatient ID: ${updatedPatient.id}\nNew First Name: ${updatedPatient.firstname}` }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to update patient first name: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "update_patient_lastname",
        {
            title: "Update Patient Last Name",
            description: "Use this tool when a user asks to change or correct a patient's last name given their ID.",
            inputSchema: updateLastNameSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ id, lastname }: { id: string; lastname: string }) => {
            try {
                const updatedPatient = await updatePatientLastName(id, lastname);
                return { content: [{ type: "text", text: `Patient last name updated successfully.\nPatient ID: ${updatedPatient.id}\nNew Last Name: ${updatedPatient.lastname}` }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to update patient last name: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "update_patient_email",
        {
            title: "Update Patient Email",
            description: "Use this tool when a user asks to change or correct a patient's email given their ID.",
            inputSchema: updateEmailSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ id, email }: { id: string; email: string }) => {
            try {
                const updatedPatient = await updatePatientEmail(id, email);
                return { content: [{ type: "text", text: `Patient email updated successfully.\nPatient ID: ${updatedPatient.id}\nNew Email: ${updatedPatient.email}` }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to update patient email: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "update_patient_phone",
        {
            title: "Update Patient Phone",
            description: "Use this tool when a user asks to change or correct a patient's phone number given their ID.",
            inputSchema: updatePhoneSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ id, phone }: { id: string; phone: string }) => {
            try {
                const updatedPatient = await updatePatientPhone(id, phone);
                return { content: [{ type: "text", text: `Patient phone updated successfully.\nPatient ID: ${updatedPatient.id}\nNew Phone: ${updatedPatient.phone}` }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to update patient phone: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "create_new_patient",
        {
            title: "Create New Patient",
            description: "Use this tool when a user asks to create a new patient.  Ask for confirmation before creating a new patient.",
            inputSchema: createPatientSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
        },
        async ({ firstname, lastname, email, phone }: { firstname: string; lastname: string; email: string; phone?: string }) => {
            try {
                const newPatient = await createPatient(firstname, lastname, email, phone);
                return { content: [{ type: "text", text: `Patient created successfully.\nPatient ID: ${newPatient.id}\nFirst Name: ${newPatient.firstname}\nLast Name: ${newPatient.lastname}\nEmail: ${newPatient.email}\nPhone: ${newPatient.phone ?? 'N/A'}` }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to create patient: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "delete_patient_by_id",
        {
            title: "Delete Patient Information by ID",
            description: "Use this tool to delete or remove a patient given their ID.  Ask for confirmation before deleting a patient.",
            inputSchema: patientIdSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ id }: { id: string }) => {
            try {
                const patient = await deletePatientById(id);
                return { content: [{ type: "text", text: `Patient with id '${id}' deleted successfully.\nPatient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n` }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to delete patient: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "delete_patient_by_lastname",
        {
            title: "Delete Patient Information by Last Name",
            description: "Use this tool to delete or remove a patient given their last name.  Ask for confirmation before deleting a patient.",
            inputSchema: patientLastNameSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ lastname }: { lastname: string }) => {
            try {
                const patients = await deletePatientByLastName(lastname);
                let result = '';
                if (Array.isArray(patients) && patients.length > 0) {
                    result = `${patients.length} patient(s) with last name '${lastname}' deleted successfully.\n`;
                    for (const patient of patients) {
                        result += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                    }
                } else {
                    result = `No patients with last name '${lastname}' were found to delete.`;
                }
                return { content: [{ type: "text", text: result }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to delete patients: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "delete_patient_by_firstname",
        {
            title: "Delete Patient Information by First Name",
            description: "Use this tool to delete or remove a patient given their first name.  Ask for confirmation before deleting a patient.",
            inputSchema: patientFirstNameSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ firstname }: { firstname: string }) => {
            try {
                const patients = await deletePatientByFirstName(firstname);
                let result = '';
                if (Array.isArray(patients) && patients.length > 0) {
                    result = `${patients.length} patient(s) with first name '${firstname}' deleted successfully.\n`;
                    for (const patient of patients) {
                        result += `Patient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n\n`;
                    }
                } else {
                    result = `No patients with first name '${firstname}' were found to delete.`;
                }
                return { content: [{ type: "text", text: result }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to delete patients: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "delete_patient_by_email",
        {
            title: "Delete Patient Information by Email",
            description: "Use this tool to delete or remove a patient given their email address.  Ask for confirmation before deleting a patient.",
            inputSchema: patientEmailSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        },
        async ({ email }: { email: string }) => {
            try {
                const patient = await deletePatientByEmail(email);
                let result = '';
                if (patient) {
                    result = `Patient with email '${email}' deleted successfully.\nPatient ID: ${patient.id}\nFirst Name: ${patient.firstname}\nLast Name: ${patient.lastname}\nEmail: ${patient.email}\n`;
                } else {
                    result = `No patient with email '${email}' was found to delete.`;
                }
                return { content: [{ type: "text", text: result }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to delete patient: ${msg}` }], isError: true };
            }
        }
    );

    // -----------------------------------------------------------------------
    // Appointment tools
    // -----------------------------------------------------------------------

    server.registerTool(
        "get_all_appointments",
        {
            title: "Get All Appointments",
            description: "Retrieve all appointments across all patients, including patient names.",
            annotations: { readOnlyHint: true }
        },
        async () => {
            try {
                const appointments = await getAllAppointments();
                if (appointments.length === 0) {
                    return { content: [{ type: "text", text: "No appointments found." }] };
                }
                let text = `${appointments.length} appointment(s) found.\n\n`;
                for (const a of appointments) {
                    text += `Appointment ID: ${a.id}\nPatient: ${a.firstname} ${a.lastname} (${a.patient_id})\nType: ${a.appointment_type}\nStart: ${a.start_time}\nEnd: ${a.end_time}\nStatus: ${a.status}\nNotes: ${a.notes ?? 'None'}\n\n`;
                }
                return { content: [{ type: "text", text }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to retrieve appointments: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "get_appointment_by_id",
        {
            title: "Get Appointment by ID",
            description: "Retrieve details of a single appointment given its ID.",
            inputSchema: appointmentIdSchema,
            annotations: { readOnlyHint: true }
        },
        async ({ id }: { id: string }) => {
            try {
                const a = await getAppointmentById(id);
                if (!a) return { content: [{ type: "text", text: `No appointment with id '${id}' was found.` }] };
                const text = `Appointment ID: ${a.id}\nPatient: ${a.firstname} ${a.lastname} (${a.patient_id})\nType: ${a.appointment_type}\nStart: ${a.start_time}\nEnd: ${a.end_time}\nStatus: ${a.status}\nNotes: ${a.notes ?? 'None'}`;
                return { content: [{ type: "text", text }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to retrieve appointment: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "get_appointments_by_patient",
        {
            title: "Get Appointments by Patient ID",
            description: "Retrieve all appointments for a specific patient given their patient ID.",
            inputSchema: getByPatientIdSchema,
            annotations: { readOnlyHint: true }
        },
        async ({ patient_id }: { patient_id: string }) => {
            try {
                const appointments = await getAppointmentsByPatientId(patient_id);
                if (appointments.length === 0) {
                    return { content: [{ type: "text", text: `No appointments found for patient '${patient_id}'.` }] };
                }
                let text = `${appointments.length} appointment(s) for patient '${patient_id}'.\n\n`;
                for (const a of appointments) {
                    text += `ID: ${a.id} | Type: ${a.appointment_type} | Start: ${a.start_time} | Status: ${a.status}\n`;
                }
                return { content: [{ type: "text", text }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to retrieve appointments: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "get_appointments_by_date",
        {
            title: "Get Appointments by Date",
            description: "Retrieve all appointments scheduled on a specific date (YYYY-MM-DD).",
            inputSchema: getAppointmentsByDateSchema,
            annotations: { readOnlyHint: true }
        },
        async ({ date }: { date: string }) => {
            try {
                const appointments = await getAppointmentsOnDate(date);
                if (appointments.length === 0) {
                    return { content: [{ type: "text", text: `No appointments found on ${date}.` }] };
                }
                let text = `${appointments.length} appointment(s) on ${date}.\n\n`;
                for (const a of appointments) {
                    text += `ID: ${a.id} | Patient: ${a.firstname} ${a.lastname} | Type: ${a.appointment_type} | Start: ${a.start_time} | Status: ${a.status}\n`;
                }
                return { content: [{ type: "text", text }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to retrieve appointments: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "get_available_slots",
        {
            title: "Get Available Time Slots",
            description: "Return all open 30-minute time slots on a given date for a specified appointment type. Use this before booking to find valid start times.",
            inputSchema: getAvailableSlotsSchema,
            annotations: { readOnlyHint: true }
        },
        async ({ date, appointment_type }: { date: string; appointment_type?: typeof APPOINTMENT_TYPES[number] }) => {
            try {
                const slots = await getAvailableSlots(date, appointment_type ?? 'checkup');
                if (slots.length === 0) {
                    return { content: [{ type: "text", text: `No available slots on ${date} for a '${appointment_type ?? 'checkup'}' appointment.` }] };
                }
                const formatted = slots.map(s => new Date(s).toISOString()).join('\n');
                return { content: [{ type: "text", text: `Available slots on ${date} (${slots.length} found):\n${formatted}` }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to retrieve available slots: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "book_appointment",
        {
            title: "Book Appointment",
            description: "Book a dental appointment for a patient. IMPORTANT: You must use get_all_patients, get_patient_by_email, or get_patients_by_lastname FIRST to retrieve the exact patient_id (e.g. 'patient-001') before calling this tool. Do NOT guess or fabricate the patient_id. Use get_available_slots to find a valid start_time. Ask for confirmation before booking.",
            inputSchema: bookAppointmentSchema,
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
        },
        async ({ patient_id, start_time, appointment_type, notes }: { patient_id: string; start_time: string; appointment_type: typeof APPOINTMENT_TYPES[number]; notes?: string }) => {
            try {
                // Pre-validate: confirm the patient actually exists before attempting the insert
                const patient = await getPatientById(patient_id);
                if (!patient) {
                    return {
                        content: [{ type: "text", text: `Cannot book appointment: no patient found with id '${patient_id}'. Use get_all_patients, get_patient_by_email, or get_patients_by_lastname to find the correct patient_id, then try again.` }],
                        isError: true
                    };
                }

                const appt = await bookAppointment(patient_id, start_time, appointment_type, notes);
                const text = `Appointment booked successfully.\nID: ${appt.id}\nPatient: ${patient.firstname} ${patient.lastname}\nType: ${appt.appointment_type}\nStart: ${appt.start_time}\nEnd: ${appt.end_time}\nStatus: ${appt.status}`;
                return { content: [{ type: "text", text }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to book appointment: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "rebook_appointment",
        {
            title: "Rebook Appointment",
            description: "Move an existing appointment to a new date and time. The appointment type and duration are preserved. Ask for confirmation before rebooking.",
            inputSchema: rebookAppointmentSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true }
        },
        async ({ id, new_start_time }: { id: string; new_start_time: string }) => {
            try {
                const appt = await rebookAppointment(id, new_start_time);
                if (!appt) return { content: [{ type: "text", text: `Appointment '${id}' not found.` }] };
                const text = `Appointment rebooked successfully.\nID: ${appt.id}\nNew Start: ${appt.start_time}\nNew End: ${appt.end_time}\nStatus: ${appt.status}`;
                return { content: [{ type: "text", text }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to rebook appointment: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "cancel_appointment",
        {
            title: "Cancel Appointment",
            description: "Cancel an existing appointment by ID. The slot is freed for other patients. Ask for confirmation before cancelling.",
            inputSchema: appointmentIdSchema,
            annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true }
        },
        async ({ id }: { id: string }) => {
            try {
                const appt = await cancelAppointment(id);
                if (!appt) return { content: [{ type: "text", text: `Appointment '${id}' not found.` }] };
                return { content: [{ type: "text", text: `Appointment '${id}' has been cancelled.` }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to cancel appointment: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "complete_appointment",
        {
            title: "Mark Appointment as Completed",
            description: "Mark an appointment as completed. This also updates the patient's last visit date, which is used for recall scheduling.",
            inputSchema: appointmentIdSchema,
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true }
        },
        async ({ id }: { id: string }) => {
            try {
                const appt = await completeAppointment(id);
                if (!appt) return { content: [{ type: "text", text: `Appointment '${id}' not found.` }] };
                return { content: [{ type: "text", text: `Appointment '${id}' marked as completed. Patient's last visit date has been updated.` }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to complete appointment: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "send_reminder",
        {
            title: "Send Appointment Reminder",
            description: "Manually send a reminder email to a patient for a specific appointment. Use this when a user asks to remind a patient about an upcoming appointment. Ask for confirmation before sending.",
            inputSchema: appointmentIdSchema,
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
        },
        async ({ id }: { id: string }) => {
            try {
                const appt = await getAppointmentById(id);
                if (!appt) return { content: [{ type: "text", text: `Appointment '${id}' not found.` }] };
                if (!appt.email) return { content: [{ type: "text", text: `No email address on file for the patient linked to appointment '${id}'.` }] };
                await sendReminderEmail(
                    appt as Appointment,
                    appt.firstname as string,
                    appt.lastname as string,
                    appt.email as string
                );
                await markReminderSent(id);
                const text = `Reminder email sent to ${appt.firstname} ${appt.lastname} (${appt.email}) for their ${appt.appointment_type} appointment on ${new Date(appt.start_time as string).toLocaleString()}.`;
                return { content: [{ type: "text", text }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to send reminder: ${msg}` }], isError: true };
            }
        }
    );

    // -----------------------------------------------------------------------
    // Email notification tools  (called independently for atomic execution)
    // -----------------------------------------------------------------------

    server.registerTool(
        "send_booking_confirmation",
        {
            title: "Send Booking Confirmation Email",
            description: "Send a booking confirmation email to the patient for a given appointment. Call this after book_appointment to notify the patient atomically as a separate step.",
            inputSchema: appointmentIdSchema,
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
        },
        async ({ id }: { id: string }) => {
            try {
                const appt = await getAppointmentById(id);
                if (!appt) return { content: [{ type: "text", text: `Appointment '${id}' not found.` }], isError: true };
                if (!appt.email) return { content: [{ type: "text", text: `No email address on file for the patient linked to appointment '${id}'.` }], isError: true };
                await sendBookingConfirmation(
                    appt as Appointment,
                    appt.firstname as string,
                    appt.lastname as string,
                    appt.email as string
                );
                return { content: [{ type: "text", text: `Booking confirmation sent to ${appt.firstname} ${appt.lastname} (${appt.email}).` }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to send booking confirmation: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "send_rescheduling_notification",
        {
            title: "Send Rescheduling Notification Email",
            description: "Send a rescheduling notification email to the patient for a given appointment. Call this after rebook_appointment to notify the patient atomically as a separate step.",
            inputSchema: appointmentIdSchema,
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
        },
        async ({ id }: { id: string }) => {
            try {
                const appt = await getAppointmentById(id);
                if (!appt) return { content: [{ type: "text", text: `Appointment '${id}' not found.` }], isError: true };
                if (!appt.email) return { content: [{ type: "text", text: `No email address on file for the patient linked to appointment '${id}'.` }], isError: true };
                await sendReschedulingNotification(
                    appt as Appointment,
                    appt.firstname as string,
                    appt.lastname as string,
                    appt.email as string
                );
                return { content: [{ type: "text", text: `Rescheduling notification sent to ${appt.firstname} ${appt.lastname} (${appt.email}).` }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to send rescheduling notification: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "send_cancellation_notice",
        {
            title: "Send Cancellation Notice Email",
            description: "Send a cancellation notice email to the patient for a given appointment. Call this after cancel_appointment to notify the patient atomically as a separate step.",
            inputSchema: appointmentIdSchema,
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
        },
        async ({ id }: { id: string }) => {
            try {
                const appt = await getAppointmentById(id);
                if (!appt) return { content: [{ type: "text", text: `Appointment '${id}' not found.` }], isError: true };
                if (!appt.email) return { content: [{ type: "text", text: `No email address on file for the patient linked to appointment '${id}'.` }], isError: true };
                await sendCancellationNotice(
                    appt as Appointment,
                    appt.firstname as string,
                    appt.lastname as string,
                    appt.email as string
                );
                return { content: [{ type: "text", text: `Cancellation notice sent to ${appt.firstname} ${appt.lastname} (${appt.email}).` }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to send cancellation notice: ${msg}` }], isError: true };
            }
        }
    );

    server.registerTool(
        "autofill_schedule",
        {
            title: "Auto-fill Schedule",
            description: "Automatically book overdue or never-seen patients into the earliest available slots over the coming weeks, packing appointments from the start of each day to minimise gaps. Ask for confirmation before running.",
            inputSchema: autofillSchema,
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
        },
        async ({ weeks_ahead, max_bookings }: { weeks_ahead?: number; max_bookings?: number }) => {
            try {
                const result = await autofillSchedule(weeks_ahead ?? 4, max_bookings ?? 20);
                let text = result.message + '\n\n';
                for (const b of result.booked) {
                    text += `• ${b.patientName} → ${new Date(b.scheduledAt).toLocaleString()} (appt ID: ${b.appointmentId})\n`;
                }
                return { content: [{ type: "text", text: text.trim() }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: "text", text: `Failed to autofill schedule: ${msg}` }], isError: true };
            }
        }
    );

    return server;
}
