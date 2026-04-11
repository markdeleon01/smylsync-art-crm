import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// ── Mocks ──────────────────────────────────────────────────────────────────
// vi.mock is hoisted to top of file, so mocks must be created via vi.hoisted()

const { mockGetPatientById } = vi.hoisted(() => ({
    mockGetPatientById: vi.fn(),
}));

vi.mock('@/lib/services/patients', () => ({
    getAllPatients: vi.fn(),
    getPatientById: mockGetPatientById,
}));

import { GET } from '@/app/api/patients/[id]/route';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeReq(id: string): [NextRequest, { params: Promise<{ id: string }> }] {
    const req = new Request(`http://localhost/api/patients/${id}`) as NextRequest;
    const params = Promise.resolve({ id });
    return [req, { params }];
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/patients/[id]', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 200 with the patient when found', async () => {
        const patient = { id: 'p-1', firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com', phone: null };
        mockGetPatientById.mockResolvedValue(patient);

        const [req, ctx] = makeReq('p-1');
        const res = await GET(req, ctx);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.patient).toEqual(patient);
    });

    it('returns 404 when patient is not found', async () => {
        mockGetPatientById.mockResolvedValue(undefined);

        const [req, ctx] = makeReq('does-not-exist');
        const res = await GET(req, ctx);
        expect(res.status).toBe(404);
        const body = await res.json();
        expect(body.error).toContain('does-not-exist');
    });

    it('returns 500 when the service throws', async () => {
        mockGetPatientById.mockRejectedValue(new Error('DB error'));

        const [req, ctx] = makeReq('p-1');
        const res = await GET(req, ctx);
        expect(res.status).toBe(500);
    });
});
