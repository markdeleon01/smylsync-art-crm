'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getWeekAppointments } from './actions';
import { APPOINTMENT_DURATIONS } from '@/lib/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUSINESS_START = 8; // 8 AM
const BUSINESS_END = 20; // 8 PM
const TOTAL_MINS = (BUSINESS_END - BUSINESS_START) * 60; // 720 min
const PX_PER_MIN = 1.6; // 48px per 30-min slot
const COLUMN_HEIGHT = TOTAL_MINS * PX_PER_MIN; // 1152px

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function getWeekSunday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDayNumber(date: Date): string {
  return date.getDate().toString();
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function minsFromBusinessStart(dt: Date): number {
  return (dt.getHours() - BUSINESS_START) * 60 + dt.getMinutes();
}

function formatTime(dt: Date): string {
  return dt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatAppointmentType(type: string): string {
  return type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Generate time-axis labels (every 30 min)
const TIME_LABELS = Array.from(
  { length: (BUSINESS_END - BUSINESS_START) * 2 },
  (_, i) => {
    const totalMins = i * 30;
    const hour = BUSINESS_START + Math.floor(totalMins / 60);
    const min = totalMins % 60;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return {
      label: `${displayHour}:${min.toString().padStart(2, '0')} ${period}`,
      top: totalMins * PX_PER_MIN
    };
  }
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppointmentRow {
  id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
  status: string;
  notes: string | null;
  firstname?: string;
  lastname?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SchedulesCalendar() {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    getWeekSunday(new Date())
  );
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<AppointmentRow | null>(null);
  const [bubblePos, setBubblePos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const fetchWeek = useCallback(async (monday: Date) => {
    setIsLoading(true);
    try {
      const data = await getWeekAppointments(monday.toISOString());
      setAppointments(data as AppointmentRow[]);
    } catch {
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeek(weekStart);
  }, [weekStart, fetchWeek]);

  const goToPrevWeek = () => setWeekStart((w) => addDays(w, -7));
  const goToNextWeek = () => setWeekStart((w) => addDays(w, 7));
  const goToCurrentWeek = () => setWeekStart(getWeekSunday(new Date()));

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

  // Auto-refresh when ART executes a mutating tool on the same page
  useEffect(() => {
    const handler = () => fetchWeek(weekStart);
    window.addEventListener('art:tools-executed', handler);
    return () => window.removeEventListener('art:tools-executed', handler);
  }, [weekStart, fetchWeek]);

  // Group appointments by day-of-week index (0=Sun … 6=Sat)
  const byDay: AppointmentRow[][] = [[], [], [], [], [], [], []];
  for (const appt of appointments) {
    const start = new Date(appt.start_time);
    const idx = start.getDay(); // 0=Sun, 1=Mon, … 6=Sat
    if (idx >= 0 && idx < 7) byDay[idx].push(appt);
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex flex-col gap-4">
      {/* Header row: nav + legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevWeek}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm min-w-[9rem] text-center">
            {formatMonth(weekStart)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextWeek}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToCurrentWeek}
            className="ml-1 text-xs"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchWeek(weekStart)}
            aria-label="Refresh"
            className="ml-1"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(TYPE_COLORS).map(([type, cls]) => (
            <span
              key={type}
              className={`inline-flex items-center px-2 py-0.5 rounded border font-medium ${cls}`}
            >
              {formatAppointmentType(type)}
            </span>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-auto bg-background">
        {/* Day header */}
        <div
          className="grid border-b"
          style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}
        >
          <div className="py-2 border-r" />
          {weekDays.map((d, i) => (
            <div
              key={i}
              className={`py-2 px-1 text-center border-r last:border-r-0 text-xs font-semibold ${isToday(d) ? 'text-orange-500' : 'text-muted-foreground'}`}
            >
              <span className="hidden sm:block">{DAY_NAMES[i]}</span>
              <span className="block sm:hidden">{DAY_NAMES_SHORT[i]}</span>
              <span
                className={`block text-base font-bold leading-tight ${
                  isToday(d)
                    ? 'bg-orange-500 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto'
                    : ''
                }`}
              >
                {formatDayNumber(d)}
              </span>
            </div>
          ))}
        </div>

        {/* Body: time axis + day columns */}
        <div
          className="relative grid"
          style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}
        >
          {/* Time labels column */}
          <div
            className="relative border-r select-none"
            style={{ height: COLUMN_HEIGHT }}
          >
            {TIME_LABELS.map(({ label, top }) => (
              <span
                key={label}
                className="absolute right-1 text-[10px] text-muted-foreground leading-none"
                style={{ top: top - 6 }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* 30-min grid lines (horizontal rules) */}
          {TIME_LABELS.map(({ top }) => (
            <div
              key={top}
              className="absolute left-14 right-0 border-t border-muted/50 pointer-events-none"
              style={{ top }}
            />
          ))}

          {/* Day columns */}
          {weekDays.map((d, dayIdx) => (
            <div
              key={dayIdx}
              className={`relative border-r last:border-r-0 ${isToday(d) ? 'bg-orange-50/30' : ''}`}
              style={{ height: COLUMN_HEIGHT }}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!isLoading &&
                byDay[dayIdx].map((appt) => {
                  const start = new Date(appt.start_time);
                  const end = new Date(appt.end_time);
                  const topPx = minsFromBusinessStart(start) * PX_PER_MIN;
                  const durationMins =
                    (end.getTime() - start.getTime()) / 60000;
                  const heightPx = Math.max(durationMins * PX_PER_MIN, 28);
                  const colorCls =
                    TYPE_COLORS[appt.appointment_type] ??
                    'bg-gray-100 border-gray-400 text-gray-800';

                  return (
                    <button
                      key={appt.id}
                      onClick={(e) => {
                        if (selected?.id === appt.id) {
                          setSelected(null);
                          setBubblePos(null);
                          return;
                        }
                        const BUBBLE_W = 300;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const spaceRight = window.innerWidth - rect.right;
                        const left =
                          spaceRight >= BUBBLE_W + 12
                            ? rect.right + 8
                            : Math.max(8, rect.left - BUBBLE_W - 8);
                        const top = Math.max(
                          8,
                          Math.min(rect.top, window.innerHeight - 480)
                        );
                        setSelected(appt);
                        setBubblePos({ left, top });
                      }}
                      className={`absolute left-0.5 right-0.5 rounded border-l-4 px-1 overflow-hidden text-left cursor-pointer hover:brightness-95 transition-all ${colorCls} ${selected?.id === appt.id ? 'ring-2 ring-offset-1 ring-gray-600' : ''}`}
                      style={{ top: topPx, height: heightPx }}
                    >
                      <p className="text-[10px] font-semibold truncate leading-tight">
                        {appt.firstname} {appt.lastname}
                      </p>
                      {heightPx > 36 && (
                        <p className="text-[9px] truncate leading-tight opacity-80">
                          {formatAppointmentType(appt.appointment_type)} ·{' '}
                          {formatTime(start)}
                        </p>
                      )}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

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
                {selected.firstname} {selected.lastname}
              </p>
              <p className="text-xs opacity-75 font-medium mt-0.5">
                {formatAppointmentType(selected.appointment_type)}
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
                  {formatTime(new Date(selected.start_time))}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  End
                </span>
                <span className="font-medium text-xs text-right">
                  {formatTime(new Date(selected.end_time))}
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

      {/* Stats bar */}
      {!isLoading && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3">
          <span>
            {appointments.length} appointment
            {appointments.length !== 1 ? 's' : ''} this week
          </span>
          <span>
            {appointments.filter((a) => a.status === 'scheduled').length}{' '}
            scheduled
          </span>
          <span>
            {appointments.filter((a) => a.status === 'completed').length}{' '}
            completed
          </span>
        </div>
      )}
    </div>
  );
}
