'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { APPOINTMENT_DURATIONS } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PatientRow {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
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
    year: 'numeric'
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
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
  const [selected, setSelected] = useState<ApptRow | null>(null);
  const [bubblePos, setBubblePos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      {patients.length > 0 ? (
        <div className="space-y-4">
          {patients.map((patient) => {
            const appts = byPatient.get(patient.id) ?? [];
            return (
              <Card
                key={patient.id}
                className="shadow-md hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                          ID
                        </p>
                        <p className="text-lg font-medium text-gray-900">
                          {patient.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                          Name
                        </p>
                        <p className="text-lg font-medium text-gray-900">
                          {patient.firstname} {patient.lastname}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                          Email
                        </p>
                        <p className="text-lg font-medium text-gray-900 break-all">
                          {patient.email}
                        </p>
                      </div>
                    </div>

                    {/* Upcoming appointment badges */}
                    <div className="flex flex-col gap-1.5 items-end shrink-0 pt-1">
                      {appts.length === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded border border-gray-300 bg-gray-100 text-gray-500 text-xs font-medium whitespace-nowrap">
                          No upcoming appointments
                        </span>
                      ) : (
                        appts.map((appt) => {
                          const colorCls =
                            TYPE_COLORS[appt.appointment_type] ??
                            'bg-gray-100 border-gray-400 text-gray-800';
                          return (
                            <button
                              key={appt.id}
                              onClick={(e) => handleBadgeClick(e, appt)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium whitespace-nowrap cursor-pointer hover:brightness-95 transition-all ${colorCls} ${selected?.id === appt.id ? 'ring-2 ring-offset-1 ring-gray-600' : ''}`}
                            >
                              {formatType(appt.appointment_type)}
                              <span className="opacity-70">
                                · {formatDate(appt.start_time)}{' '}
                                {formatTime(appt.start_time)}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No patients found.</p>
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
                <span className="font-mono text-[10px] text-muted-foreground truncate">
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
