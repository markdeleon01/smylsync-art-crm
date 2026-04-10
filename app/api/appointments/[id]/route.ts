import type { NextRequest } from 'next/server';
import { getAppointmentById, cancelAppointment, rebookAppointment } from '@/lib/services/appointments';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const appointment = await getAppointmentById(id);
        if (!appointment) {
            return Response.json({ error: `Appointment '${id}' not found` }, { status: 404 });
        }
        return Response.json(appointment);
    } catch (err) {
        console.error(`GET /api/appointments/${id} error:`, err);
        return Response.json({ error: 'Failed to fetch appointment' }, { status: 500 });
    }
}

export async function DELETE(
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
        return Response.json(cancelled);
    } catch (err) {
        console.error(`DELETE /api/appointments/${id} error:`, err);
        return Response.json({ error: 'Failed to delete appointment' }, { status: 500 });
    }
}
