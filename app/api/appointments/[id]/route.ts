import type { NextRequest } from 'next/server';
import { getAppointmentById, cancelAppointment, rebookAppointment } from '@/lib/services/appointments';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const appointment = await getAppointmentById(id);
    if (!appointment) {
        return Response.json({ error: `Appointment '${id}' not found` }, { status: 404 });
    }
    return Response.json(appointment);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const appointment = await getAppointmentById(id);
    if (!appointment) {
        return Response.json({ error: `Appointment '${id}' not found` }, { status: 404 });
    }
    const cancelled = await cancelAppointment(id);
    return Response.json(cancelled);
}
