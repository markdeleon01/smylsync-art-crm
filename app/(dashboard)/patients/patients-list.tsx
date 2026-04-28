'use client';

import { useState, useRef, useEffect } from 'react';
import { APPOINTMENT_DURATIONS } from '@/lib/types';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PatientRow {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
}

export interface ApptRow {
  id: string;
  patient_id: string;
  appointment_type: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Constants (mirrored from calendar.tsx)
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<string, string> = {
  consultation: 'bg-blue-100 border-blue-400 text-blue-800',
  checkup: 'bg-green-100 border-green-400 text-green-800',
  'x-ray': 'bg-purple-100 border-purple-400 text-purple-800',
  cleaning: 'bg-teal-100 border-teal-400 text-teal-800',
  filling: 'bg-amber-100 border-amber-400 text-amber-800',
  extraction: 'bg-orange-100 border-orange-400 text-orange-800',
  crown: 'bg-red-100 border-red-400 text-red-800',
  'root-canal': 'bg-rose-100 border-rose-400 text-rose-800',
  whitening: 'bg-sky-100 border-sky-400 text-sky-800'
};

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-green-200 text-green-800',
  completed: 'bg-gray-200 text-gray-700',
  cancelled: 'bg-red-200 text-red-700',
  rebooked: 'bg-yellow-200 text-yellow-800'
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatType(type: string) {
  return type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila'
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila'
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  patients: PatientRow[];
  appointments: ApptRow[];
}

export function PatientsList({ patients, appointments }: Props) {
  type SortCol = 'id' | 'firstname' | 'lastname' | 'email' | 'phone';
  type ViewMode = 'grid' | 'list';
  const [selected, setSelected] = useState<ApptRow | null>(null);
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(
    null
  );
  const [bubblePos, setBubblePos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortCol, setSortCol] = useState<SortCol>('lastname');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  // Guard: prevent the save effect from overwriting localStorage with initial
  // defaults before the load effect has had a chance to hydrate state from
  // localStorage. Effects run top-to-bottom, so placing save BEFORE load
  // means on the initial render save sees hasLoaded=false and skips. The load
  // effect then reads the persisted values, updates state, and sets
  // hasLoaded=true. The resulting re-render runs the save effect with the
  // correct loaded values. A fresh ref is created on every mount, which also
  // makes this safe under React StrictMode's double-invoke behaviour.
  const hasLoaded = useRef(false);

  // Save — listed FIRST so it runs before the load effect on initial render
  useEffect(() => {
    if (!hasLoaded.current) return;
    sessionStorage.setItem('patients-sort-col', sortCol);
    sessionStorage.setItem('patients-sort-dir', sortDir);
    sessionStorage.setItem('patients-view-mode', viewMode);
  }, [sortCol, sortDir, viewMode]);

  // Load — listed SECOND; sets hasLoaded=true at the end.
  // The cleanup resets hasLoaded to false so that when React StrictMode
  // simulates unmount→remount, the save effect (which runs before this load
  // effect on the remount) sees hasLoaded=false and skips writing the reset
  // initial state values to localStorage before we have a chance to hydrate
  // from localStorage again.
  useEffect(() => {
    const savedCol = sessionStorage.getItem('patients-sort-col');
    const savedDir = sessionStorage.getItem('patients-sort-dir');
    if (savedCol) setSortCol(savedCol as SortCol);
    if (savedDir === 'asc' || savedDir === 'desc') setSortDir(savedDir);
    const savedSearch = sessionStorage.getItem('patients-search');
    if (savedSearch) {
      setInputValue(savedSearch);
      setQuery(savedSearch);
    }
    const savedViewMode = sessionStorage.getItem('patients-view-mode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }
    hasLoaded.current = true;
    return () => {
      hasLoaded.current = false;
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem('patients-search', query);
  }, [query]);

  function handleColSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  // Filter patients by ID, first name, last name, email, or phone
  const q = query.trim().toLowerCase();
  const filteredPatients = q
    ? patients.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.firstname.toLowerCase().includes(q) ||
          p.lastname.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.phone ?? '').toLowerCase().includes(q)
      )
    : patients;

  const visiblePatients = [...filteredPatients].sort((a, b) => {
    let cmp = 0;
    switch (sortCol) {
      case 'id':
        cmp = a.id.localeCompare(b.id);
        break;
      case 'firstname':
        cmp = a.firstname.localeCompare(b.firstname);
        break;
      case 'lastname':
        cmp = a.lastname.localeCompare(b.lastname);
        break;
      case 'email':
        cmp = a.email.localeCompare(b.email);
        break;
      case 'phone':
        cmp = (a.phone ?? '').localeCompare(b.phone ?? '');
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Group appointments by patient_id
  const byPatient = new Map<string, ApptRow[]>();
  for (const appt of appointments) {
    if (!byPatient.has(appt.patient_id)) byPatient.set(appt.patient_id, []);
    byPatient.get(appt.patient_id)!.push(appt);
  }

  // Close bubble on Escape or outside-click
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelected(null);
        setBubblePos(null);
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        setSelected(null);
        setBubblePos(null);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [selected]);

  function handleBadgeClick(
    e: React.MouseEvent<HTMLButtonElement>,
    appt: ApptRow
  ) {
    if (selected?.id === appt.id) {
      setSelected(null);
      setBubblePos(null);
      return;
    }
    const BUBBLE_W = 300;
    const BUBBLE_H = 420;
    const GAP = 12;
    const spaceRight = window.innerWidth - e.clientX;
    const left =
      spaceRight >= BUBBLE_W + GAP
        ? e.clientX + GAP
        : Math.max(8, e.clientX - BUBBLE_W - GAP);
    const top = Math.max(8, Math.min(e.clientY, window.innerHeight - BUBBLE_H));
    setSelected(appt);
    setBubblePos({ left, top });
  }

  function renderAppointmentBadges(appts: ApptRow[]) {
    if (appts.length === 0) {
      return (
        <span className="inline-flex items-center rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-gray-500">
          None
        </span>
      );
    }

    return appts.map((appt) => {
      const colorCls =
        TYPE_COLORS[appt.appointment_type] ??
        'bg-gray-100 border-gray-400 text-gray-800';
      return (
        <button
          key={appt.id}
          type="button"
          onClick={(e) => handleBadgeClick(e, appt)}
          className={`inline-flex cursor-pointer items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all hover:brightness-95 ${colorCls} ${selected?.id === appt.id ? 'ring-2 ring-offset-1 ring-gray-600' : ''}`}
        >
          {formatType(appt.appointment_type)}
          <span className="opacity-70">
            · {formatDate(appt.start_time)} {formatTime(appt.start_time)}
          </span>
        </button>
      );
    });
  }

  return (
    <>
      {/* Heading and controls */}
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">
            Browse all patient records. Ask ART to add, update, or remove a
            patient, or to look up a patient by name, email, or ID.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div
            className="inline-flex rounded-md border border-gray-200 bg-white p-1"
            role="tablist"
            aria-label="Patient view mode"
          >
            {(['list', 'grid'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={viewMode === mode}
                aria-label={`Show patients in ${mode} view`}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                  viewMode === mode
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(inputValue);
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (e.target.value === '') setQuery('');
              }}
              placeholder="Search by ID, name, email, or phone…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-[274px]"
              aria-label="Search patients"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-700 sm:w-auto"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {(
                  [
                    { col: 'id', label: 'ID' },
                    { col: 'firstname', label: 'First Name' },
                    { col: 'lastname', label: 'Last Name' },
                    { col: 'email', label: 'Email' },
                    { col: 'phone', label: 'Phone' }
                  ] as {
                    col: 'id' | 'firstname' | 'lastname' | 'email' | 'phone';
                    label: string;
                  }[]
                ).map(({ col, label }) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left whitespace-nowrap"
                  >
                    <button
                      type="button"
                      onClick={() => handleColSort(col)}
                      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-600 transition-colors select-none hover:text-gray-900"
                      aria-label={`Sort by ${label}`}
                    >
                      {label}
                      <span className="w-3 text-center text-[10px] leading-none">
                        {sortCol === col ? (
                          sortDir === 'asc' ? (
                            '▲'
                          ) : (
                            '▼'
                          )
                        ) : (
                          <span className="opacity-30">⇅</span>
                        )}
                      </span>
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 whitespace-nowrap">
                  Upcoming Appointments
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visiblePatients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-lg text-gray-500"
                  >
                    {q
                      ? `No patients found matching "${query}".`
                      : 'No patients found.'}
                  </td>
                </tr>
              ) : (
                visiblePatients.map((patient) => {
                  const appts = byPatient.get(patient.id) ?? [];
                  return (
                    <tr
                      key={patient.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap align-top">
                        {patient.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap align-top">
                        {patient.firstname}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap align-top">
                        {patient.lastname}
                      </td>
                      <td className="px-4 py-3 text-gray-700 break-all align-top">
                        {patient.email}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap align-top">
                        {patient.phone ?? (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {renderAppointmentBadges(appts)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : visiblePatients.length === 0 ? (
        <div className="rounded-md border px-4 py-12 text-center text-lg text-gray-500">
          {q ? `No patients found matching "${query}".` : 'No patients found.'}
        </div>
      ) : (
        <div className="space-y-3">
          {visiblePatients.map((patient) => {
            const appts = byPatient.get(patient.id) ?? [];
            const isExpanded = expandedPatientId === patient.id;

            return (
              <article
                key={patient.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedPatientId((current) =>
                      current === patient.id ? null : patient.id
                    )
                  }
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
                  aria-expanded={isExpanded}
                  aria-controls={`patient-card-${patient.id}`}
                >
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {patient.lastname}, {patient.firstname}
                    </p>
                    <p className="text-sm text-gray-500">
                      Click to {isExpanded ? 'collapse' : 'expand'} details
                    </p>
                  </div>
                  <span
                    className="min-w-6 text-center text-2xl font-medium leading-none text-gray-500"
                    aria-hidden="true"
                  >
                    {isExpanded ? '-' : '+'}
                  </span>
                </button>

                {isExpanded && (
                  <div
                    id={`patient-card-${patient.id}`}
                    className="border-t border-gray-100 bg-gray-50 px-5 py-4"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Patient ID
                        </p>
                        <p className="font-mono text-sm text-gray-700">
                          {patient.id}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Email
                        </p>
                        <p className="text-sm text-gray-700 break-all">
                          {patient.email}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Phone
                        </p>
                        <p className="text-sm text-gray-700">
                          {patient.phone ?? '—'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Upcoming Appointments
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {renderAppointmentBadges(appts)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Appointment detail bubble */}
      {selected && bubblePos && (
        <div
          ref={bubbleRef}
          className="fixed z-50 w-[288px] rounded-xl border bg-white shadow-2xl text-sm"
          style={{ top: bubblePos.top, left: bubblePos.left }}
        >
          {/* Colour header strip */}
          <div
            className={`rounded-t-xl px-4 py-3 border-b flex items-start justify-between gap-2 ${
              TYPE_COLORS[selected.appointment_type] ??
              'bg-gray-100 border-gray-300 text-gray-800'
            }`}
          >
            <div>
              <p className="font-bold text-base leading-tight">
                {formatType(selected.appointment_type)}
              </p>
              <p className="text-xs opacity-75 font-medium mt-0.5">
                {formatDate(selected.start_time)} ·{' '}
                {formatTime(selected.start_time)}
              </p>
            </div>
            <button
              onClick={() => {
                setSelected(null);
                setBubblePos(null);
              }}
              className="shrink-0 opacity-60 hover:opacity-100 text-lg leading-none mt-0.5"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-2.5">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Status
              </span>
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                  STATUS_BADGE[selected.status] ?? 'bg-gray-100'
                }`}
              >
                {selected.status.charAt(0).toUpperCase() +
                  selected.status.slice(1)}
              </span>
            </div>

            <hr className="border-muted" />

            {/* Time */}
            <div className="space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Start
                </span>
                <span className="font-medium text-xs text-right">
                  {new Date(selected.start_time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}{' '}
                  {formatTime(selected.start_time)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  End
                </span>
                <span className="font-medium text-xs text-right">
                  {formatTime(selected.end_time)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Duration
                </span>
                <span className="font-medium text-xs">
                  {APPOINTMENT_DURATIONS[selected.appointment_type] ?? 30} min
                </span>
              </div>
            </div>

            {selected.notes && (
              <>
                <hr className="border-muted" />
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    Notes
                  </span>
                  <p className="mt-1 text-xs">{selected.notes}</p>
                </div>
              </>
            )}

            <hr className="border-muted" />

            {/* IDs */}
            <div className="space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Patient
                </span>
                <span className="font-mono text-[10px] text-muted-foreground truncate">
                  {selected.patient_id}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Appt ID
                </span>
                <span className="font-mono text-[10px] text-muted-foreground break-all max-w-[180px]">
                  {selected.id}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground italic pt-1">
              Ask ART to rebook or cancel this appointment.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
