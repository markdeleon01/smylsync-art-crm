import type { NextRequest } from 'next/server';
import { getAppointmentById, cancelAppointment } from '@/lib/services/appointments';
import type { Appointment } from '@/lib/types';
import { sendCancellationNotice } from '@/lib/services/email';

export async function PATCH(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const appointment = await getAppointmentById(id);
        if (!appointment) {
            return Response.json({ error: `Appointment '${id}' not found` }, { status: 404 });
        }
        const cancelled = await cancelAppointment(id);
        void sendCancellationNotice(
            appointment as Appointment,
            appointment.firstname as string,
            appointment.lastname as string,
            appointment.email as string
        );
        return Response.json(cancelled);
    } catch (err) {
        console.error(`PATCH /api/appointments/${id}/cancel error:`, err);
        return Response.json({ error: 'Failed to cancel appointment' }, { status: 500 });
    }
}
