import type { NextRequest } from 'next/server'
import { getPatientById } from "@/lib/services/patients";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    try {
        const patient = await getPatientById(id);
        if (!patient) {
            return Response.json({ error: `Patient '${id}' not found` }, { status: 404 });
        }
        return Response.json({ patient });
    } catch (err) {
        console.error(`GET /api/patients/${id} error:`, err);
        return Response.json({ error: 'Failed to fetch patient' }, { status: 500 });
    }

}