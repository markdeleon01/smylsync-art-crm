import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the neon DB client ────────────────────────────────────────────────

const mockSql = vi.fn();
vi.mock('@neondatabase/serverless', () => ({
    neon: vi.fn(() => mockSql),
}));

// crypto.randomUUID is available in the test environment (Node 19+/vitest jsdom)
// but let's stub it for deterministic IDs
vi.stubGlobal('crypto', {
    randomUUID: vi.fn(() => 'test-uuid-1234'),
});

import {
    getAllPatients,
    getPatientById,
    createPatient,
    updatePatientFirstName,
    updatePatientLastName,
    updatePatientEmail,
    updatePatientPhone,
    deletePatientById,
} from '@/lib/services/patients';

// ── Fixtures ───────────────────────────────────────────────────────────────

const PATIENT = {
    id: 'test-uuid-1234',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    phone: null,
};

// Make mockSql behave like a tagged-template-literal function
function makeSqlMock(returnValue: unknown[]) {
    const fn = vi.fn(() => Promise.resolve(returnValue)) as any;
    // Neon returns a function that also works as a tagged template
    fn.mockImplementation(() => Promise.resolve(returnValue));
    return fn;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('lib/services/patients – getAllPatients', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns an array of patients from the DB', async () => {
        mockSql.mockResolvedValue([PATIENT]);
        const result = await getAllPatients();
        expect(result).toEqual([PATIENT]);
        expect(mockSql).toHaveBeenCalledOnce();
    });

    it('returns an empty array when no patients exist', async () => {
        mockSql.mockResolvedValue([]);
        const result = await getAllPatients();
        expect(result).toEqual([]);
    });
});

describe('lib/services/patients – getPatientById', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns the patient when found', async () => {
        mockSql.mockResolvedValue([PATIENT]);
        const result = await getPatientById('test-uuid-1234');
        expect(result).toEqual(PATIENT);
    });

    it('returns undefined when patient is not found', async () => {
        mockSql.mockResolvedValue([]);
        const result = await getPatientById('does-not-exist');
        expect(result).toBeUndefined();
    });
});

describe('lib/services/patients – createPatient', () => {
    beforeEach(() => vi.clearAllMocks());

    it('inserts and returns the new patient', async () => {
        mockSql.mockResolvedValue([PATIENT]);
        const result = await createPatient('Jane', 'Doe', 'jane@example.com');
        expect(result).toEqual(PATIENT);
        expect(mockSql).toHaveBeenCalledOnce();
    });

    it('inserts with phone when provided', async () => {
        const withPhone = { ...PATIENT, phone: '555-1234' };
        mockSql.mockResolvedValue([withPhone]);
        const result = await createPatient('Jane', 'Doe', 'jane@example.com', '555-1234');
        expect(result.phone).toBe('555-1234');
    });

    it('inserts with null phone when phone is omitted', async () => {
        mockSql.mockResolvedValue([PATIENT]);
        const result = await createPatient('Jane', 'Doe', 'jane@example.com');
        expect(result.phone).toBeNull();
    });
});

describe('lib/services/patients – updatePatientPhone', () => {
    beforeEach(() => vi.clearAllMocks());

    it('updates and returns the patient with new phone', async () => {
        const updated = { ...PATIENT, phone: '555-9999' };
        mockSql.mockResolvedValue([updated]);
        const result = await updatePatientPhone('test-uuid-1234', '555-9999');
        expect(result.phone).toBe('555-9999');
        expect(mockSql).toHaveBeenCalledOnce();
    });
});

describe('lib/services/patients – other updates', () => {
    beforeEach(() => vi.clearAllMocks());

    it('updatePatientFirstName returns updated patient', async () => {
        mockSql.mockResolvedValue([{ ...PATIENT, firstname: 'Janet' }]);
        const result = await updatePatientFirstName('test-uuid-1234', 'Janet');
        expect(result.firstname).toBe('Janet');
    });

    it('updatePatientLastName returns updated patient', async () => {
        mockSql.mockResolvedValue([{ ...PATIENT, lastname: 'Smith' }]);
        const result = await updatePatientLastName('test-uuid-1234', 'Smith');
        expect(result.lastname).toBe('Smith');
    });

    it('updatePatientEmail returns updated patient', async () => {
        mockSql.mockResolvedValue([{ ...PATIENT, email: 'new@example.com' }]);
        const result = await updatePatientEmail('test-uuid-1234', 'new@example.com');
        expect(result.email).toBe('new@example.com');
    });
});

describe('lib/services/patients – deletePatientById', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns the deleted patient record', async () => {
        mockSql.mockResolvedValue([PATIENT]);
        const result = await deletePatientById('test-uuid-1234');
        expect(result).toEqual(PATIENT);
        expect(mockSql).toHaveBeenCalledOnce();
    });
});
