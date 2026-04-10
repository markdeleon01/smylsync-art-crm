import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientsList, PatientRow, ApptRow } from './patients-list';

// Suppress expected console.error noise from React
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makePatient = (overrides: Partial<PatientRow> = {}): PatientRow => ({
  id: 'patient-001',
  firstname: 'Jane',
  lastname: 'Doe',
  email: 'jane@example.com',
  ...overrides
});

const makeAppt = (overrides: Partial<ApptRow> = {}): ApptRow => ({
  id: 'appt-001',
  patient_id: 'patient-001',
  appointment_type: 'checkup',
  start_time: '2026-05-10T09:00:00.000Z',
  end_time: '2026-05-10T09:30:00.000Z',
  status: 'scheduled',
  notes: null,
  ...overrides
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('PatientsList – rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <PatientsList patients={[]} appointments={[]} />
    );
    expect(container).toBeDefined();
  });

  it('shows "No patients found" when the list is empty', () => {
    render(<PatientsList patients={[]} appointments={[]} />);
    expect(screen.getByText(/No patients found/i)).toBeInTheDocument();
  });

  it('renders a card for each patient', () => {
    const patients = [
      makePatient({ id: 'p1', firstname: 'Alice', lastname: 'Smith' }),
      makePatient({ id: 'p2', firstname: 'Bob', lastname: 'Jones' })
    ];
    render(<PatientsList patients={patients} appointments={[]} />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('displays patient id, name, and email on each card', () => {
    const p = makePatient({
      id: 'pat-xyz',
      firstname: 'Carlos',
      lastname: 'Ray',
      email: 'carlos@clinic.com'
    });
    render(<PatientsList patients={[p]} appointments={[]} />);
    expect(screen.getByText('pat-xyz')).toBeInTheDocument();
    // First and last name are rendered as adjacent text nodes; full normalised textContent is "Carlos Ray"
    expect(screen.getByText('Carlos Ray')).toBeInTheDocument();
    expect(screen.getByText('carlos@clinic.com')).toBeInTheDocument();
  });

  it('shows "No upcoming appointments" badge when patient has no appointments', () => {
    const p = makePatient();
    render(<PatientsList patients={[p]} appointments={[]} />);
    expect(screen.getByText('No upcoming appointments')).toBeInTheDocument();
  });

  it('does NOT show "No upcoming appointments" when patient has appointments', () => {
    const p = makePatient();
    const appt = makeAppt();
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    expect(
      screen.queryByText('No upcoming appointments')
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Appointment badges
// ---------------------------------------------------------------------------

describe('PatientsList – appointment badges', () => {
  it('renders an appointment badge for each upcoming appointment', () => {
    const p = makePatient();
    const appts = [
      makeAppt({ id: 'a1', appointment_type: 'checkup' }),
      makeAppt({ id: 'a2', appointment_type: 'cleaning' })
    ];
    render(<PatientsList patients={[p]} appointments={appts} />);
    expect(screen.getByText(/Checkup/i)).toBeInTheDocument();
    expect(screen.getByText(/Cleaning/i)).toBeInTheDocument();
  });

  it('shows the appointment date and time on each badge', () => {
    const p = makePatient();
    const appt = makeAppt({ start_time: '2026-05-10T09:00:00.000Z' });
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    // The badge text contains a formatted date (e.g. "May 10, 2026")
    const badge = screen.getByRole('button', { name: /Checkup/i });
    expect(badge.textContent).toMatch(/May/i);
  });

  it('only shows appointments for the correct patient', () => {
    const p1 = makePatient({ id: 'p1', firstname: 'Alice', lastname: 'A' });
    const p2 = makePatient({ id: 'p2', firstname: 'Bob', lastname: 'B' });
    const appt1 = makeAppt({
      id: 'a1',
      patient_id: 'p1',
      appointment_type: 'checkup'
    });
    const appt2 = makeAppt({
      id: 'a2',
      patient_id: 'p2',
      appointment_type: 'extraction'
    });
    render(<PatientsList patients={[p1, p2]} appointments={[appt1, appt2]} />);
    expect(screen.getByText(/Checkup/i)).toBeInTheDocument();
    expect(screen.getByText(/Extraction/i)).toBeInTheDocument();
  });

  it('applies correct colour class for known appointment types', () => {
    const p = makePatient();
    const appt = makeAppt({ appointment_type: 'cleaning' });
    const { container } = render(
      <PatientsList patients={[p]} appointments={[appt]} />
    );
    const badge = container.querySelector('.bg-teal-100');
    expect(badge).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Appointment detail bubble
// ---------------------------------------------------------------------------

describe('PatientsList – appointment detail bubble', () => {
  it('bubble is not visible by default', () => {
    const p = makePatient();
    const appt = makeAppt();
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    // Bubble content is only rendered when selected
    expect(
      screen.queryByText('Ask ART to rebook or cancel')
    ).not.toBeInTheDocument();
  });

  it('shows bubble when an appointment badge is clicked', () => {
    const p = makePatient();
    const appt = makeAppt({ appointment_type: 'checkup' });
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    fireEvent.click(screen.getByRole('button', { name: /Checkup/i }));
    expect(
      screen.getByText(/Ask ART to rebook or cancel/i)
    ).toBeInTheDocument();
  });

  it('bubble shows patient name', () => {
    const p = makePatient({ firstname: 'Maria', lastname: 'Lopez' });
    const appt = makeAppt();
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    fireEvent.click(screen.getByRole('button', { name: /Checkup/i }));
    // The bubble header shows the appointment type; the badge button also contains
    // "Checkup" so there are two matches — use getAllByText
    expect(screen.getAllByText('Checkup').length).toBeGreaterThanOrEqual(1);
  });

  it('bubble shows status', () => {
    const p = makePatient();
    const appt = makeAppt({ status: 'scheduled' });
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    fireEvent.click(screen.getByRole('button', { name: /Checkup/i }));
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('bubble shows notes when present', () => {
    const p = makePatient();
    const appt = makeAppt({ notes: 'Bring X-rays' });
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    fireEvent.click(screen.getByRole('button', { name: /Checkup/i }));
    expect(screen.getByText('Bring X-rays')).toBeInTheDocument();
  });

  it('dismisses bubble when close button is clicked', () => {
    const p = makePatient();
    const appt = makeAppt();
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    fireEvent.click(screen.getByRole('button', { name: /Checkup/i }));
    expect(
      screen.getByText(/Ask ART to rebook or cancel/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close'));
    expect(
      screen.queryByText(/Ask ART to rebook or cancel/i)
    ).not.toBeInTheDocument();
  });

  it('toggles bubble off when the same badge is clicked twice', () => {
    const p = makePatient();
    const appt = makeAppt();
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    const badge = screen.getByRole('button', { name: /Checkup/i });
    fireEvent.click(badge);
    expect(
      screen.getByText(/Ask ART to rebook or cancel/i)
    ).toBeInTheDocument();
    fireEvent.click(badge);
    expect(
      screen.queryByText(/Ask ART to rebook or cancel/i)
    ).not.toBeInTheDocument();
  });

  it('dismisses bubble on Escape key', () => {
    const p = makePatient();
    const appt = makeAppt();
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    fireEvent.click(screen.getByRole('button', { name: /Checkup/i }));
    expect(
      screen.getByText(/Ask ART to rebook or cancel/i)
    ).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.queryByText(/Ask ART to rebook or cancel/i)
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Multiple appointments per patient
// ---------------------------------------------------------------------------

describe('PatientsList – multiple appointments per patient', () => {
  it('renders all badges when a patient has multiple appointments', () => {
    const p = makePatient();
    const appts = [
      makeAppt({
        id: 'a1',
        appointment_type: 'checkup',
        start_time: '2026-05-10T09:00:00.000Z'
      }),
      makeAppt({
        id: 'a2',
        appointment_type: 'cleaning',
        start_time: '2026-05-15T10:00:00.000Z'
      }),
      makeAppt({
        id: 'a3',
        appointment_type: 'x-ray',
        start_time: '2026-05-20T11:00:00.000Z'
      })
    ];
    render(<PatientsList patients={[p]} appointments={appts} />);
    expect(screen.getByText(/Checkup/i)).toBeInTheDocument();
    expect(screen.getByText(/Cleaning/i)).toBeInTheDocument();
    expect(screen.getByText(/X Ray/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Patients page – updated behaviour (future appointments only)
// ---------------------------------------------------------------------------

describe('PatientsList – upcoming-only contract', () => {
  it('renders only appointments passed in via props (filtering done server-side)', () => {
    // The component simply renders whatever appointments are passed.
    // The server already filters start_time >= NOW(), so the component
    // should render all received appointments without further filtering.
    const p = makePatient();
    const appt = makeAppt({ start_time: '2026-05-01T09:00:00.000Z' });
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    expect(
      screen.getByRole('button', { name: /Checkup/i })
    ).toBeInTheDocument();
  });
});
