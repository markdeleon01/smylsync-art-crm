import { getAllPatients } from "@/lib/services/patients";

export async function GET() {
    try {
        const patients = await getAllPatients();
        return Response.json(patients);
    } catch (err) {
        console.error('GET /api/patients error:', err);
        return Response.json({ error: 'Failed to fetch patients' }, { status: 500 });
    }
}