import type { NextRequest } from 'next/server';
import { getAppointmentById, cancelAppointment } from '@/lib/services/appointments';

export async function PATCH(
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
