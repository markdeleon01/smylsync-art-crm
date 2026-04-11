import { NextRequest } from 'next/server';
import { getAllAppointments, bookAppointment } from '@/lib/services/appointments';
import { getPatientById } from '@/lib/services/patients';
import { APPOINTMENT_TYPES } from '@/lib/types';
import type { Appointment } from '@/lib/types';
import { sendBookingConfirmation } from '@/lib/email';

export async function GET() {
    try {
        const appointments = await getAllAppointments();
        return Response.json(appointments);
    } catch (err) {
        console.error('GET /api/appointments error:', err);
        return Response.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    let body: { patient_id?: string; start_time?: string; appointment_type?: string; notes?: string };
    try {
        body = await req.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { patient_id, start_time, appointment_type, notes } = body;

    if (!patient_id || !start_time || !appointment_type) {
        return Response.json(
            { error: 'patient_id, start_time, and appointment_type are required' },
            { status: 400 }
        );
    }

    if (!(APPOINTMENT_TYPES as readonly string[]).includes(appointment_type)) {
        return Response.json(
            { error: `Invalid appointment_type. Must be one of: ${APPOINTMENT_TYPES.join(', ')}` },
            { status: 400 }
        );
    }

    try {
        const patient = await getPatientById(patient_id);
        if (!patient) {
            return Response.json({ error: `No patient found with id '${patient_id}'` }, { status: 404 });
        }

        const appointment = await bookAppointment(patient_id, start_time, appointment_type, notes);
        void sendBookingConfirmation(
            appointment as Appointment,
            patient.firstname as string,
            patient.lastname as string,
            patient.email as string
        );
        return Response.json(appointment, { status: 201 });
    } catch (err) {
        console.error('POST /api/appointments error:', err);
        return Response.json({ error: 'Failed to create appointment' }, { status: 500 });
    }
}
