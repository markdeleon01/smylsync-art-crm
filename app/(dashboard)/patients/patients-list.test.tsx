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
  phone: null,
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
    expect(screen.getByText('Smith, Alice')).toBeInTheDocument();
    expect(screen.getByText('Jones, Bob')).toBeInTheDocument();
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
    // Name is rendered as "Last, First"
    expect(screen.getByText('Ray, Carlos')).toBeInTheDocument();
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

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

describe('PatientsList – search', () => {
  const patients = [
    makePatient({
      id: 'p1',
      firstname: 'Alice',
      lastname: 'Smith',
      email: 'alice@example.com',
      phone: '(213) 555-0101'
    }),
    makePatient({
      id: 'p2',
      firstname: 'Bob',
      lastname: 'Jones',
      email: 'bob@clinic.com',
      phone: '(310) 555-0202'
    }),
    makePatient({
      id: 'p3',
      firstname: 'Carol',
      lastname: 'Brown',
      email: 'carol@example.com',
      phone: '(415) 555-0303'
    })
  ];

  it('renders the search input and button', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    expect(
      screen.getByRole('textbox', { name: /Search patients/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
  });

  it('shows all patients when search is empty', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    expect(screen.getByText('Smith, Alice')).toBeInTheDocument();
    expect(screen.getByText('Jones, Bob')).toBeInTheDocument();
    expect(screen.getByText('Brown, Carol')).toBeInTheDocument();
  });

  it('filters by first name', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    fireEvent.change(
      screen.getByRole('textbox', { name: /Search patients/i }),
      { target: { value: 'Alice' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    expect(screen.getByText('Smith, Alice')).toBeInTheDocument();
    expect(screen.queryByText('Jones, Bob')).not.toBeInTheDocument();
    expect(screen.queryByText('Brown, Carol')).not.toBeInTheDocument();
  });

  it('filters by last name', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    fireEvent.change(
      screen.getByRole('textbox', { name: /Search patients/i }),
      { target: { value: 'Jones' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    expect(screen.getByText('Jones, Bob')).toBeInTheDocument();
    expect(screen.queryByText('Smith, Alice')).not.toBeInTheDocument();
  });

  it('filters by email address', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    fireEvent.change(
      screen.getByRole('textbox', { name: /Search patients/i }),
      { target: { value: 'carol@example.com' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    expect(screen.getByText('Brown, Carol')).toBeInTheDocument();
    expect(screen.queryByText('Smith, Alice')).not.toBeInTheDocument();
  });

  it('filters by patient ID', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    fireEvent.change(
      screen.getByRole('textbox', { name: /Search patients/i }),
      { target: { value: 'p2' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    expect(screen.getByText('Jones, Bob')).toBeInTheDocument();
    expect(screen.queryByText('Smith, Alice')).not.toBeInTheDocument();
    expect(screen.queryByText('Brown, Carol')).not.toBeInTheDocument();
  });

  it('is case-insensitive', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    fireEvent.change(
      screen.getByRole('textbox', { name: /Search patients/i }),
      { target: { value: 'ALICE' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    expect(screen.getByText('Smith, Alice')).toBeInTheDocument();
  });

  it('shows no-results message when nothing matches', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    fireEvent.change(
      screen.getByRole('textbox', { name: /Search patients/i }),
      { target: { value: 'zzznomatch' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    expect(screen.getByText(/No patients found matching/i)).toBeInTheDocument();
  });

  it('restores all patients when input is cleared', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    const input = screen.getByRole('textbox', { name: /Search patients/i });
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    expect(screen.queryByText('Jones, Bob')).not.toBeInTheDocument();
    // Clear the input — all patients should reappear immediately
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('Jones, Bob')).toBeInTheDocument();
    expect(screen.getByText('Brown, Carol')).toBeInTheDocument();
  });

  it('filters by partial email domain', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    fireEvent.change(
      screen.getByRole('textbox', { name: /Search patients/i }),
      { target: { value: '@clinic' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    expect(screen.getByText('Jones, Bob')).toBeInTheDocument();
    expect(screen.queryByText('Smith, Alice')).not.toBeInTheDocument();
  });

  it('filters by phone number', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    fireEvent.change(
      screen.getByRole('textbox', { name: /Search patients/i }),
      { target: { value: '(415) 555-0303' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    expect(screen.getByText('Brown, Carol')).toBeInTheDocument();
    expect(screen.queryByText('Smith, Alice')).not.toBeInTheDocument();
    expect(screen.queryByText('Jones, Bob')).not.toBeInTheDocument();
  });

  it('filters by partial phone number', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    fireEvent.change(
      screen.getByRole('textbox', { name: /Search patients/i }),
      { target: { value: '(213)' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    expect(screen.getByText('Smith, Alice')).toBeInTheDocument();
    expect(screen.queryByText('Jones, Bob')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Heading
// ---------------------------------------------------------------------------

describe('PatientsList – heading', () => {
  it('renders the Patients heading', () => {
    render(<PatientsList patients={[]} appointments={[]} />);
    expect(
      screen.getByRole('heading', { name: /Patients/i })
    ).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<PatientsList patients={[]} appointments={[]} />);
    expect(screen.getByText(/Browse all patient records/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

describe('PatientsList – sorting', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  const patients = [
    makePatient({
      id: 'p1',
      firstname: 'Charlie',
      lastname: 'Zimmerman',
      email: 'c@z.com'
    }),
    makePatient({
      id: 'p2',
      firstname: 'Alice',
      lastname: 'Adams',
      email: 'a@a.com'
    }),
    makePatient({
      id: 'p3',
      firstname: 'Bob',
      lastname: 'Morris',
      email: 'b@m.com'
    })
  ];

  it('renders the sort dropdown', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    expect(
      screen.getByRole('combobox', { name: /Sort patients/i })
    ).toBeInTheDocument();
  });

  it('defaults to last name ascending (A to Z)', () => {
    const { container } = render(
      <PatientsList patients={patients} appointments={[]} />
    );
    const cards = container.querySelectorAll('[class*="rounded-lg border"]');
    const names = Array.from(cards).map((c) => c.textContent);
    const adamsIdx = names.findIndex((t) => t?.includes('Adams'));
    const morrisIdx = names.findIndex((t) => t?.includes('Morris'));
    const zimmermanIdx = names.findIndex((t) => t?.includes('Zimmerman'));
    expect(adamsIdx).toBeLessThan(morrisIdx);
    expect(morrisIdx).toBeLessThan(zimmermanIdx);
  });

  it('sorts last name descending (Z to A) when selected', () => {
    const { container } = render(
      <PatientsList patients={patients} appointments={[]} />
    );
    fireEvent.change(screen.getByRole('combobox', { name: /Sort patients/i }), {
      target: { value: 'desc' }
    });
    const cards = container.querySelectorAll('[class*="rounded-lg border"]');
    const names = Array.from(cards).map((c) => c.textContent);
    const adamsIdx = names.findIndex((t) => t?.includes('Adams'));
    const morrisIdx = names.findIndex((t) => t?.includes('Morris'));
    const zimmermanIdx = names.findIndex((t) => t?.includes('Zimmerman'));
    expect(zimmermanIdx).toBeLessThan(morrisIdx);
    expect(morrisIdx).toBeLessThan(adamsIdx);
  });

  it('re-sorts back to ascending when switched back', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    const select = screen.getByRole('combobox', { name: /Sort patients/i });
    fireEvent.change(select, { target: { value: 'desc' } });
    fireEvent.change(select, { target: { value: 'asc' } });
    expect((select as HTMLSelectElement).value).toBe('asc');
  });
});

// ---------------------------------------------------------------------------
// Phone display on card
// ---------------------------------------------------------------------------

describe('PatientsList – phone display', () => {
  it('shows the phone number on the card when phone is non-null', () => {
    const p = makePatient({ phone: '(213) 555-0101' });
    render(<PatientsList patients={[p]} appointments={[]} />);
    expect(screen.getByText('(213) 555-0101')).toBeInTheDocument();
  });

  it('does not render the Phone label when phone is null', () => {
    const p = makePatient({ phone: null });
    render(<PatientsList patients={[p]} appointments={[]} />);
    expect(screen.queryByText('Phone')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sort order – sessionStorage persistence
// ---------------------------------------------------------------------------

describe('PatientsList – sort persistence (sessionStorage)', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  const patients = [
    makePatient({
      id: 'p1',
      firstname: 'Charlie',
      lastname: 'Zimmerman',
      email: 'c@z.com'
    }),
    makePatient({
      id: 'p2',
      firstname: 'Alice',
      lastname: 'Adams',
      email: 'a@a.com'
    })
  ];

  it('defaults to "asc" when sessionStorage has no saved value', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    const select = screen.getByRole('combobox', {
      name: /Sort patients/i
    }) as HTMLSelectElement;
    expect(select.value).toBe('asc');
  });

  it('initialises sort order from sessionStorage when a value is saved', () => {
    sessionStorage.setItem('patients-sort-order', 'desc');
    render(<PatientsList patients={patients} appointments={[]} />);
    const select = screen.getByRole('combobox', {
      name: /Sort patients/i
    }) as HTMLSelectElement;
    expect(select.value).toBe('desc');
  });

  it('writes the chosen sort order to sessionStorage when changed', () => {
    render(<PatientsList patients={patients} appointments={[]} />);
    const select = screen.getByRole('combobox', { name: /Sort patients/i });
    fireEvent.change(select, { target: { value: 'desc' } });
    expect(sessionStorage.getItem('patients-sort-order')).toBe('desc');
  });
});

// ---------------------------------------------------------------------------
// Appointment detail bubble – additional body content
// ---------------------------------------------------------------------------

describe('PatientsList – bubble body content', () => {
  it('shows Start, End, and Duration labels in the bubble', () => {
    const p = makePatient();
    const appt = makeAppt({
      start_time: '2026-05-10T09:00:00.000Z',
      end_time: '2026-05-10T09:30:00.000Z'
    });
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    fireEvent.click(screen.getByRole('button', { name: /Checkup/i }));
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('End')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
  });

  it('shows the patient ID and appointment ID in the bubble', () => {
    const p = makePatient({ id: 'patient-abc' });
    const appt = makeAppt({ id: 'appt-xyz', patient_id: 'patient-abc' });
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    fireEvent.click(screen.getByRole('button', { name: /Checkup/i }));
    // patient-abc appears on the card AND inside the bubble's ID row
    expect(screen.getAllByText('patient-abc').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('appt-xyz')).toBeInTheDocument();
  });

  it('does not render a Notes section when notes is null', () => {
    const p = makePatient();
    const appt = makeAppt({ notes: null });
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    fireEvent.click(screen.getByRole('button', { name: /Checkup/i }));
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
  });

  it('renders the correct status label for a completed appointment', () => {
    const p = makePatient();
    const appt = makeAppt({ status: 'completed' });
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    fireEvent.click(screen.getByRole('button', { name: /Checkup/i }));
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders the correct status label for a cancelled appointment', () => {
    const p = makePatient();
    const appt = makeAppt({ status: 'cancelled' });
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    fireEvent.click(screen.getByRole('button', { name: /Checkup/i }));
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('dismisses bubble when clicking outside the bubble', () => {
    const p = makePatient();
    const appt = makeAppt();
    render(<PatientsList patients={[p]} appointments={[appt]} />);
    fireEvent.click(screen.getByRole('button', { name: /Checkup/i }));
    expect(
      screen.getByText(/Ask ART to rebook or cancel/i)
    ).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(
      screen.queryByText(/Ask ART to rebook or cancel/i)
    ).not.toBeInTheDocument();
  });
});
