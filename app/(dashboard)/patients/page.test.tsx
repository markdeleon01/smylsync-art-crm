import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import PatientsPage from './page';

// Mock the patients and appointments services
vi.mock('@/lib/services/patients', () => ({
  getAllPatients: vi.fn()
}));
vi.mock('@/lib/services/appointments', () => ({
  getUpcomingScheduledAppointments: vi.fn()
}));

import { getAllPatients } from '@/lib/services/patients';
import { getUpcomingScheduledAppointments } from '@/lib/services/appointments';

describe('Patients Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUpcomingScheduledAppointments as any).mockResolvedValue([]);
  });

  it('should render patients page', async () => {
    (getAllPatients as any).mockResolvedValue([]);

    const result = await PatientsPage();
    const { container } = render(result as any);

    expect(container).toBeDefined();
  });

  it('should display patients heading', async () => {
    (getAllPatients as any).mockResolvedValue([]);

    const result = await PatientsPage();
    const { container } = render(result as any);

    expect(container.textContent).toContain('Patients');
  });

  it('should display description', async () => {
    (getAllPatients as any).mockResolvedValue([]);

    const result = await PatientsPage();
    const { container } = render(result as any);

    expect(container.textContent).toContain('Browse all patient records');
  });

  it('should render patient cards when patients exist', async () => {
    const mockPatients = [
      {
        id: '1',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        phone: '555-1234'
      }
    ];
    (getAllPatients as any).mockResolvedValue(mockPatients);

    const result = await PatientsPage();
    const { container } = render(result as any);

    expect(container.textContent).toContain('John');
    expect(container.textContent).toContain('Doe');
  });

  it('should handle empty patient list', async () => {
    (getAllPatients as any).mockResolvedValue([]);

    const result = await PatientsPage();
    const { container } = render(result as any);

    expect(container).toBeDefined();
  });

  it('should display patient information correctly', async () => {
    const mockPatients = [
      {
        id: '123',
        firstname: 'Jane',
        lastname: 'Smith',
        email: 'jane@example.com',
        phone: '555-5678'
      }
    ];
    (getAllPatients as any).mockResolvedValue(mockPatients);

    const result = await PatientsPage();
    const { container } = render(result as any);

    expect(container.textContent).toContain('Jane');
    expect(container.textContent).toContain('Smith');
    expect(container.textContent).toContain('123');
  });
});
