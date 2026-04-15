import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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

const makeMockPatient = (overrides = {}) => ({
  id: 'p1',
  firstname: 'John',
  lastname: 'Doe',
  email: 'john@example.com',
  phone: null,
  ...overrides
});

const makeMockAppt = (overrides = {}) => ({
  id: 'a1',
  patient_id: 'p1',
  start_time: '2026-05-10T09:00:00.000Z',
  end_time: '2026-05-10T09:30:00.000Z',
  appointment_type: 'checkup',
  status: 'scheduled',
  notes: null,
  ...overrides
});

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
    (getAllPatients as any).mockResolvedValue([makeMockPatient()]);
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
    (getAllPatients as any).mockResolvedValue([
      makeMockPatient({
        id: '123',
        firstname: 'Jane',
        lastname: 'Smith',
        email: 'jane@example.com'
      })
    ]);
    const result = await PatientsPage();
    const { container } = render(result as any);
    // Name is visible in the card header in list view
    expect(container.textContent).toContain('Jane');
    expect(container.textContent).toContain('Smith');
    // Expand the card to reveal the patient ID
    const expandBtn = container.querySelector(
      'button[aria-controls]'
    ) as HTMLElement;
    if (expandBtn) fireEvent.click(expandBtn);
    expect(container.textContent).toContain('123');
  });

  it('should pass appointments to PatientsList', async () => {
    (getAllPatients as any).mockResolvedValue([makeMockPatient()]);
    (getUpcomingScheduledAppointments as any).mockResolvedValue([
      makeMockAppt()
    ]);
    const result = await PatientsPage();
    const { container } = render(result as any);
    // Expand the card to reveal the appointment badge
    const expandBtn = container.querySelector(
      'button[aria-controls]'
    ) as HTMLElement;
    if (expandBtn) fireEvent.click(expandBtn);
    // Appointment type badge should appear via PatientsList
    expect(container.textContent).toContain('Checkup');
  });

  it('shows "None" badge when patient has no appointments', async () => {
    (getAllPatients as any).mockResolvedValue([makeMockPatient()]);
    (getUpcomingScheduledAppointments as any).mockResolvedValue([]);
    const result = await PatientsPage();
    const { container } = render(result as any);
    // Expand the card to reveal the appointments section
    const expandBtn = container.querySelector(
      'button[aria-controls]'
    ) as HTMLElement;
    if (expandBtn) fireEvent.click(expandBtn);
    expect(container.textContent).toContain('None');
  });

  it('only shows appointments belonging to each patient', async () => {
    (getAllPatients as any).mockResolvedValue([
      makeMockPatient({ id: 'p1', firstname: 'Alice', lastname: 'A' }),
      makeMockPatient({ id: 'p2', firstname: 'Bob', lastname: 'B' })
    ]);
    (getUpcomingScheduledAppointments as any).mockResolvedValue([
      makeMockAppt({ id: 'a1', patient_id: 'p1', appointment_type: 'checkup' }),
      makeMockAppt({ id: 'a2', patient_id: 'p2', appointment_type: 'cleaning' })
    ]);
    const result = await PatientsPage();
    const { container } = render(result as any);
    // Expand first patient card and check their appointment
    const firstBtn = container.querySelector(
      'button[aria-controls]'
    ) as HTMLElement;
    if (firstBtn) fireEvent.click(firstBtn);
    expect(container.textContent).toContain('Checkup');
    // Expand second patient card (auto-collapses first) and check their appointment
    const secondBtn = container.querySelectorAll(
      'button[aria-controls]'
    )[1] as HTMLElement;
    if (secondBtn) fireEvent.click(secondBtn);
    expect(container.textContent).toContain('Cleaning');
  });

  it('passes the phone number through when a patient has one', async () => {
    (getAllPatients as any).mockResolvedValue([
      makeMockPatient({ phone: '(213) 555-0101' })
    ]);
    const result = await PatientsPage();
    const { container } = render(result as any);
    // Expand the card to reveal phone
    const expandBtn = container.querySelector(
      'button[aria-controls]'
    ) as HTMLElement;
    if (expandBtn) fireEvent.click(expandBtn);
    expect(container.textContent).toContain('(213) 555-0101');
  });

  it('shows em-dash in phone column when phone is null', async () => {
    (getAllPatients as any).mockResolvedValue([
      makeMockPatient({ phone: null })
    ]);
    const result = await PatientsPage();
    const { container } = render(result as any);
    // Expand the card to reveal phone section
    const expandBtn = container.querySelector(
      'button[aria-controls]'
    ) as HTMLElement;
    if (expandBtn) fireEvent.click(expandBtn);
    expect(container.textContent).toContain('—');
  });
});
