import type { NextRequest } from 'next/server'
import { getPatientById } from "@/lib/services/patients";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;
    const patient = await getPatientById(id);
    return Response.json({ patient });

}