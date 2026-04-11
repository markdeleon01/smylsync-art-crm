import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────
// vi.mock is hoisted to top of file, so mocks must be created via vi.hoisted()

const { mockGetAllPatients } = vi.hoisted(() => ({
    mockGetAllPatients: vi.fn(),
}));

vi.mock('@/lib/services/patients', () => ({
    getAllPatients: mockGetAllPatients,
    getPatientById: vi.fn(),
}));

import { GET } from '@/app/api/patients/route';

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/patients', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 200 with the patient array', async () => {
        const patients = [
            { id: 'p-1', firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com', phone: null },
        ];
        mockGetAllPatients.mockResolvedValue(patients);

        const res = await GET();
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual(patients);
    });

    it('returns 200 with an empty array when no patients exist', async () => {
        mockGetAllPatients.mockResolvedValue([]);
        const res = await GET();
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual([]);
    });

    it('returns 500 when the service throws', async () => {
        mockGetAllPatients.mockRejectedValue(new Error('DB connection error'));
        const res = await GET();
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toBeDefined();
    });
});
