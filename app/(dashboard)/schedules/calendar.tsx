'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getWeekAppointments,
  getMonthAppointments,
  getDayAppointments
} from './actions';
import { APPOINTMENT_DURATIONS } from '@/lib/types';
import {
  getBusinessHoursBounds,
  getBusinessHoursForDate,
  type ClinicBusinessHours
} from '@/lib/clinic-hours';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PX_PER_MIN = 1.0;
const SLOT_INTERVAL_MINUTES = 15;
const LABEL_INTERVAL_MINUTES = 30;

const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];
const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon, …
  d.setDate(d.getDate() - ((day + 6) % 7)); // roll back to Monday
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

function formatDayFull(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function minsFromBusinessStart(dt: Date, businessStartMinutes: number): number {
  return dt.getHours() * 60 + dt.getMinutes() - businessStartMinutes;
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

function formatMinutesLabel(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const min = totalMinutes % 60;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
}

function buildTimeLabels(startMinutes: number, endMinutes: number) {
  const totalMinutes = endMinutes - startMinutes;
  return Array.from(
    { length: Math.floor(totalMinutes / LABEL_INTERVAL_MINUTES) + 1 },
    (_, i) => {
      const minutes = startMinutes + i * LABEL_INTERVAL_MINUTES;
      return {
        label: formatMinutesLabel(minutes),
        top: (minutes - startMinutes) * PX_PER_MIN
      };
    }
  );
}

function buildSlotLines(startMinutes: number, endMinutes: number) {
  const totalMinutes = endMinutes - startMinutes;
  return Array.from(
    { length: Math.floor(totalMinutes / SLOT_INTERVAL_MINUTES) + 1 },
    (_, i) => {
      const minutes = startMinutes + i * SLOT_INTERVAL_MINUTES;
      return {
        key: minutes,
        top: (minutes - startMinutes) * PX_PER_MIN
      };
    }
  );
}

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
// Shared bubble component
// ---------------------------------------------------------------------------

interface BubbleProps {
  appt: AppointmentRow;
  pos: { left: number; top: number };
  bubbleRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

function AppointmentBubble({ appt, pos, bubbleRef, onClose }: BubbleProps) {
  return (
    <div
      ref={bubbleRef}
      className="fixed z-50 w-[288px] rounded-xl border bg-white shadow-2xl text-sm"
      style={{ top: pos.top, left: pos.left }}
    >
      <div
        className={`rounded-t-xl px-4 py-3 border-b flex items-start justify-between gap-2 ${
          TYPE_COLORS[appt.appointment_type] ??
          'bg-gray-100 border-gray-300 text-gray-800'
        }`}
      >
        <div>
          <p className="font-bold text-base leading-tight">
            {appt.firstname} {appt.lastname}
          </p>
          <p className="text-xs opacity-75 font-medium mt-0.5">
            {formatAppointmentType(appt.appointment_type)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 opacity-60 hover:opacity-100 text-lg leading-none mt-0.5"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            Status
          </span>
          <span
            className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${STATUS_BADGE[appt.status] ?? 'bg-gray-100'}`}
          >
            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
          </span>
        </div>
        <hr className="border-muted" />
        <div className="space-y-1">
          <div className="flex justify-between gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Start
            </span>
            <span className="font-medium text-xs text-right">
              {new Date(appt.start_time).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}{' '}
              {formatTime(new Date(appt.start_time))}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              End
            </span>
            <span className="font-medium text-xs text-right">
              {formatTime(new Date(appt.end_time))}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Duration
            </span>
            <span className="font-medium text-xs">
              {APPOINTMENT_DURATIONS[appt.appointment_type] ?? 30} min
            </span>
          </div>
        </div>
        {appt.notes && (
          <>
            <hr className="border-muted" />
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Notes
              </span>
              <p className="mt-1 text-xs">{appt.notes}</p>
            </div>
          </>
        )}
        <hr className="border-muted" />
        <div className="space-y-1">
          <div className="flex justify-between gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Patient
            </span>
            <span className="font-mono text-[10px] text-muted-foreground truncate">
              {appt.patient_id}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Appt ID
            </span>
            <span className="font-mono text-[10px] text-muted-foreground truncate">
              {appt.id}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground italic pt-1">
          Ask ART to rebook or cancel this appointment.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Month view helpers
// ---------------------------------------------------------------------------

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// Build the grid of dates for a month view (fills out to complete Sun-Sat weeks)
function buildMonthGrid(monthStart: Date): Date[] {
  // Find the Sunday on or before the 1st
  const firstDay = new Date(monthStart);
  firstDay.setDate(firstDay.getDate() - firstDay.getDay());
  // Find the last day of the month
  const lastOfMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0
  );
  // Find the Saturday on or after the last day
  const lastDay = new Date(lastOfMonth);
  const daysToSat = (6 - lastDay.getDay() + 7) % 7;
  lastDay.setDate(lastDay.getDate() + daysToSat);

  const days: Date[] = [];
  const cur = new Date(firstDay);
  while (cur <= lastDay) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// ---------------------------------------------------------------------------
// Month view component
// ---------------------------------------------------------------------------

interface MonthViewProps {
  monthStart: Date;
  appointments: AppointmentRow[];
  isLoading: boolean;
}

function MonthView({ monthStart, appointments, isLoading }: MonthViewProps) {
  const [selected, setSelected] = useState<AppointmentRow | null>(null);
  const [bubblePos, setBubblePos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(null);
    setBubblePos(null);
  }, [monthStart]);

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

  function handleApptClick(
    e: React.MouseEvent<HTMLButtonElement>,
    appt: AppointmentRow
  ) {
    if (selected?.id === appt.id) {
      setSelected(null);
      setBubblePos(null);
      return;
    }
    const BUBBLE_W = 300;
    const BUBBLE_H = 480;
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

  const grid = buildMonthGrid(monthStart);
  const today = new Date();

  // Group appointments by ISO date string (YYYY-MM-DD)
  const byDate = new Map<string, AppointmentRow[]>();
  for (const appt of appointments) {
    const key = new Date(appt.start_time).toLocaleDateString('sv'); // sv locale = YYYY-MM-DD
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(appt);
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-background">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b">
          {DAY_NAMES_SHORT.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="grid grid-cols-7">
          {grid.map((day, i) => {
            const key = day.toLocaleDateString('sv');
            const dayAppts = byDate.get(key) ?? [];
            const inMonth = isSameMonth(day, monthStart);
            const todayCell = isSameDay(day, today);
            const MAX_VISIBLE = 3;

            return (
              <div
                key={i}
                className={`min-h-[7rem] border-r border-b last-in-row:border-r-0 p-1 flex flex-col gap-0.5 ${
                  inMonth ? 'bg-background' : 'bg-muted/20'
                } ${todayCell ? 'bg-orange-50/40' : ''}`}
              >
                {/* Date number */}
                <div className="flex justify-end mb-0.5">
                  <span
                    className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                      todayCell
                        ? 'bg-orange-500 text-white'
                        : inMonth
                          ? 'text-gray-800'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Loading spinner */}
                {isLoading && i < 7 && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Appointment chips */}
                {!isLoading &&
                  dayAppts.slice(0, MAX_VISIBLE).map((appt) => {
                    const colorCls =
                      TYPE_COLORS[appt.appointment_type] ??
                      'bg-gray-100 border-gray-400 text-gray-800';
                    return (
                      <button
                        key={appt.id}
                        onClick={(e) => handleApptClick(e, appt)}
                        className={`w-full text-left truncate rounded px-1 py-0.5 text-[10px] font-medium border-l-2 leading-tight cursor-pointer hover:brightness-95 transition-all ${colorCls} ${selected?.id === appt.id ? 'ring-1 ring-gray-600 ring-offset-1' : ''}`}
                      >
                        {formatTime(new Date(appt.start_time))} {appt.firstname}{' '}
                        {appt.lastname}
                      </button>
                    );
                  })}

                {/* Overflow indicator */}
                {!isLoading && dayAppts.length > MAX_VISIBLE && (
                  <span className="text-[10px] text-muted-foreground pl-1">
                    +{dayAppts.length - MAX_VISIBLE} more
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selected && bubblePos && (
        <AppointmentBubble
          appt={selected}
          pos={bubblePos}
          bubbleRef={bubbleRef}
          onClose={() => {
            setSelected(null);
            setBubblePos(null);
          }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Day view component
// ---------------------------------------------------------------------------

interface DayViewProps {
  dayDate: Date;
  isClosed: boolean;
  appointments: AppointmentRow[];
  isLoading: boolean;
  nowTopPx: number | null;
  timeLabels: Array<{ label: string; top: number }>;
  slotLines: Array<{ key: number; top: number }>;
  columnHeight: number;
  businessStartMinutes: number;
}

function DayView({
  dayDate,
  isClosed,
  appointments,
  isLoading,
  nowTopPx,
  timeLabels,
  slotLines,
  columnHeight,
  businessStartMinutes
}: DayViewProps) {
  const [selected, setSelected] = useState<AppointmentRow | null>(null);
  const [bubblePos, setBubblePos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Reset bubble when the day changes
  useEffect(() => {
    setSelected(null);
    setBubblePos(null);
  }, [dayDate]);

  // Close on Escape / outside-click
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

  const todayHighlight = isToday(dayDate);
  const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNum = formatDayNumber(dayDate);

  return (
    <>
      <div className="border rounded-lg overflow-auto bg-background">
        {/* Column header */}
        <div
          className="grid border-b"
          style={{ gridTemplateColumns: '3.5rem 1fr' }}
        >
          <div className="py-2 border-r" />
          <div
            className={`py-3 px-4 flex items-center gap-3 ${todayHighlight ? 'text-orange-500' : 'text-muted-foreground'}`}
          >
            <div
              className={`text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full shrink-0 ${
                todayHighlight ? 'bg-orange-500 text-white' : 'text-gray-800'
              }`}
            >
              {dayNum}
            </div>
            <div>
              <span className="block text-sm font-semibold">{dayName}</span>
            </div>
          </div>
        </div>

        {/* Time axis + appointment column */}
        <div
          className="relative grid"
          style={{ gridTemplateColumns: '3.5rem 1fr' }}
        >
          {/* Time labels */}
          <div
            className="relative border-r select-none"
            style={{ height: columnHeight }}
          >
            {timeLabels.map(({ label, top }) => (
              <span
                key={label}
                className="absolute right-1 text-[10px] text-muted-foreground leading-none"
                style={{ top: top - 6 }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* 15-min grid lines */}
          {slotLines.map(({ key, top }) => (
            <div
              key={key}
              className="absolute left-14 right-0 border-t border-muted/50 pointer-events-none"
              style={{ top }}
            />
          ))}

          {/* Appointment column */}
          <div
            className={`relative ${todayHighlight ? 'bg-orange-50/30' : ''}`}
            style={{ height: columnHeight }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Current-time indicator */}
            {nowTopPx !== null && (
              <div
                className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                style={{ top: nowTopPx }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 -ml-1.5" />
                <div className="flex-1 border-t-2 border-red-500" />
              </div>
            )}

            {!isLoading && isClosed && appointments.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Clinic is closed for this day
              </div>
            )}

            {!isLoading && !isClosed && appointments.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                No appointments scheduled for this day
              </div>
            )}

            {!isLoading &&
              appointments.map((appt) => {
                const start = new Date(appt.start_time);
                const end = new Date(appt.end_time);
                const topPx =
                  minsFromBusinessStart(start, businessStartMinutes) *
                  PX_PER_MIN;
                const durationMins = (end.getTime() - start.getTime()) / 60000;
                const heightPx = Math.max(durationMins * PX_PER_MIN, 22);
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
                      const BUBBLE_H = 480;
                      const GAP = 12;
                      const spaceRight = window.innerWidth - e.clientX;
                      const left =
                        spaceRight >= BUBBLE_W + GAP
                          ? e.clientX + GAP
                          : Math.max(8, e.clientX - BUBBLE_W - GAP);
                      const top = Math.max(
                        8,
                        Math.min(e.clientY, window.innerHeight - BUBBLE_H)
                      );
                      setSelected(appt);
                      setBubblePos({ left, top });
                    }}
                    className={`absolute left-1 right-1 rounded border-l-4 px-2 overflow-hidden text-left cursor-pointer hover:brightness-95 transition-all ${colorCls} ${selected?.id === appt.id ? 'ring-2 ring-offset-1 ring-gray-600' : ''}`}
                    style={{ top: topPx, height: heightPx }}
                  >
                    <p className="text-xs font-semibold truncate leading-tight">
                      {appt.firstname} {appt.lastname}
                    </p>
                    <p className="text-[11px] truncate leading-tight opacity-80">
                      {formatAppointmentType(appt.appointment_type)} ·{' '}
                      {formatTime(start)}–{formatTime(end)}
                    </p>
                    {heightPx > 36 && appt.notes && (
                      <p className="text-[10px] truncate leading-tight opacity-60 mt-0.5">
                        {appt.notes}
                      </p>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {selected && bubblePos && (
        <AppointmentBubble
          appt={selected}
          pos={bubblePos}
          bubbleRef={bubbleRef}
          onClose={() => {
            setSelected(null);
            setBubblePos(null);
          }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main calendar component
// ---------------------------------------------------------------------------

interface SchedulesCalendarProps {
  businessHours: ClinicBusinessHours;
}

export function SchedulesCalendar({
  businessHours
}: SchedulesCalendarProps) {
  const [view, setView] = useState<'week' | 'month' | 'day'>('week');
  const hasLoaded = useRef(false);
  const { startMinutes: businessStartMinutes, endMinutes: businessEndMinutes } =
    getBusinessHoursBounds(businessHours);
  const totalMinutes = businessEndMinutes - businessStartMinutes;
  const columnHeight = totalMinutes * PX_PER_MIN;
  const timeLabels = buildTimeLabels(businessStartMinutes, businessEndMinutes);
  const slotLines = buildSlotLines(businessStartMinutes, businessEndMinutes);

  // --- Live current-time indicator ---
  const calcNowTopPx = (): number | null => {
    const now = new Date();
    const todaysHours = getBusinessHoursForDate(now, businessHours);
    if (!todaysHours) return null;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (
      nowMinutes < todaysHours.startMinutes ||
      nowMinutes > todaysHours.endMinutes
    ) {
      return null;
    }

    return (nowMinutes - businessStartMinutes) * PX_PER_MIN;
  };
  const [nowTopPx, setNowTopPx] = useState<number | null>(calcNowTopPx);
  useEffect(() => {
    const id = setInterval(() => setNowTopPx(calcNowTopPx()), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Full-page overlay: stays true until the first week fetch resolves,
  // ensuring the spinner seamlessly covers the gap after route navigation.
  const [initialLoading, setInitialLoading] = useState(true);
  const hasInitiallyLoaded = useRef(false);

  // --- Week state ---
  const [weekStart, setWeekStart] = useState<Date>(() =>
    getWeekMonday(new Date())
  );
  const [weekAppointments, setWeekAppointments] = useState<AppointmentRow[]>(
    []
  );
  const [weekLoading, setWeekLoading] = useState(true);

  // --- Month state ---
  const [monthStart, setMonthStart] = useState<Date>(() =>
    getMonthStart(new Date())
  );
  const [monthAppointments, setMonthAppointments] = useState<AppointmentRow[]>(
    []
  );
  const [monthLoading, setMonthLoading] = useState(true);

  // --- Day state ---
  const [dayDate, setDayDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dayAppointments, setDayAppointments] = useState<AppointmentRow[]>([]);
  const [dayLoading, setDayLoading] = useState(true);

  // Shared bubble (week view only — month view manages its own)
  const [selected, setSelected] = useState<AppointmentRow | null>(null);
  const [bubblePos, setBubblePos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // --- Fetch functions ---
  const fetchWeek = useCallback(async (sunday: Date) => {
    setWeekLoading(true);
    try {
      const data = await getWeekAppointments(sunday.toISOString());
      setWeekAppointments(data as AppointmentRow[]);
    } catch {
      setWeekAppointments([]);
    } finally {
      setWeekLoading(false);
      if (!hasInitiallyLoaded.current) {
        hasInitiallyLoaded.current = true;
        setInitialLoading(false);
      }
    }
  }, []);

  const fetchMonth = useCallback(async (start: Date) => {
    setMonthLoading(true);
    try {
      const data = await getMonthAppointments(start.toISOString());
      setMonthAppointments(data as AppointmentRow[]);
    } catch {
      setMonthAppointments([]);
    } finally {
      setMonthLoading(false);
    }
  }, []);

  const fetchDay = useCallback(async (date: Date) => {
    setDayLoading(true);
    try {
      const data = await getDayAppointments(date.toISOString());
      setDayAppointments(data as AppointmentRow[]);
    } catch {
      setDayAppointments([]);
    } finally {
      setDayLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeek(weekStart);
  }, [weekStart, fetchWeek]);
  useEffect(() => {
    fetchMonth(monthStart);
  }, [monthStart, fetchMonth]);
  useEffect(() => {
    fetchDay(dayDate);
  }, [dayDate, fetchDay]);

  // Auto-refresh on ART tool execution
  useEffect(() => {
    const handler = () => {
      if (view === 'week') fetchWeek(weekStart);
      else if (view === 'month') fetchMonth(monthStart);
      else fetchDay(dayDate);
    };
    window.addEventListener('art:tools-executed', handler);
    return () => window.removeEventListener('art:tools-executed', handler);
  }, [view, weekStart, monthStart, dayDate, fetchWeek, fetchMonth, fetchDay]);

  // Close week bubble on Escape / outside click
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

  // --- Navigation ---
  const goToPrev = () => {
    if (view === 'week') setWeekStart((w) => addDays(w, -7));
    else if (view === 'month') setMonthStart((m) => addMonths(m, -1));
    else setDayDate((d) => addDays(d, -1));
  };
  const goToNext = () => {
    if (view === 'week') setWeekStart((w) => addDays(w, 7));
    else if (view === 'month') setMonthStart((m) => addMonths(m, 1));
    else setDayDate((d) => addDays(d, 1));
  };
  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDayDate(today);
    setWeekStart(getWeekMonday(new Date()));
    setMonthStart(getMonthStart(new Date()));
    setView('day');
  };
  const refresh = () => {
    if (view === 'week') fetchWeek(weekStart);
    else if (view === 'month') fetchMonth(monthStart);
    else fetchDay(dayDate);
  };

  // --- Week view derived data ---
  // --- Type filter (multi-select) ---
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // Persist view + filters to sessionStorage (cleared on sign-out)
  // Save effect listed FIRST — skips until load has hydrated state
  useEffect(() => {
    if (!hasLoaded.current) return;
    sessionStorage.setItem('schedules-view', view);
    sessionStorage.setItem(
      'schedules-filters',
      JSON.stringify(Array.from(activeFilters))
    );
  }, [view, activeFilters]);

  // Load effect listed SECOND — restores saved values, then sets hasLoaded=true.
  // Cleanup resets the flag so StrictMode's unmount→remount is handled correctly.
  useEffect(() => {
    const savedView = sessionStorage.getItem('schedules-view');
    if (savedView === 'day' || savedView === 'week' || savedView === 'month') {
      setView(savedView);
    }
    const savedFilters = sessionStorage.getItem('schedules-filters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        if (Array.isArray(parsed)) setActiveFilters(new Set(parsed));
      } catch {
        // ignore malformed value
      }
    }
    hasLoaded.current = true;
    return () => {
      hasLoaded.current = false;
    };
  }, []);

  const toggleFilter = (type: string) =>
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  const filterAppts = (list: AppointmentRow[]) =>
    activeFilters.size > 0
      ? list.filter((a) => activeFilters.has(a.appointment_type))
      : list;

  const filteredWeekAppointments = filterAppts(weekAppointments);
  const filteredMonthAppointments = filterAppts(monthAppointments);
  const filteredDayAppointments = filterAppts(dayAppointments);
  const dayBusinessHours = getBusinessHoursForDate(dayDate, businessHours);

  const byDay: AppointmentRow[][] = [[], [], [], [], [], [], []];
  for (const appt of filteredWeekAppointments) {
    // Convert JS getDay() (0=Sun … 6=Sat) to Mon-first offset (Mon=0 … Sun=6)
    const jsDay = new Date(appt.start_time).getDay();
    const idx = (jsDay + 6) % 7;
    if (idx >= 0 && idx < 7) byDay[idx].push(appt);
  }
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const titleLabel =
    view === 'week'
      ? formatMonth(weekStart)
      : view === 'month'
        ? formatMonthYear(monthStart)
        : formatDayFull(dayDate);
  const isLoading =
    view === 'week'
      ? weekLoading
      : view === 'month'
        ? monthLoading
        : dayLoading;
  const appointments =
    view === 'week'
      ? filteredWeekAppointments
      : view === 'month'
        ? filteredMonthAppointments
        : filteredDayAppointments;

  return (
    <div className="flex flex-col gap-4">
      {/* Full-page spinner overlay — visible until the initial week fetch resolves */}
      {initialLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
              <div
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin"
                style={{ borderTopColor: '#FFA500' }}
              />
            </div>
            <p className="text-lg font-semibold text-gray-800">Loading...</p>
          </div>
        </div>
      )}

      {/* Header: nav + view toggle + legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrev}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm min-w-[9rem] text-center">
            {titleLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="ml-1 text-xs"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            aria-label="Refresh"
            className="ml-1"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* View toggle */}
          <div className="ml-2 flex rounded-md border overflow-hidden text-xs">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 font-medium transition-colors ${view === 'day' ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-muted'}`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 font-medium transition-colors border-l ${view === 'week' ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-muted'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 font-medium transition-colors border-l ${view === 'month' ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-muted'}`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Legend / filter */}
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(TYPE_COLORS).map(([type, cls]) => {
            const isActive = activeFilters.has(type);
            const isDimmed = activeFilters.size > 0 && !isActive;
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-medium transition-opacity ${
                  isDimmed ? 'opacity-30' : 'opacity-100'
                } ${cls} ${isActive ? 'ring-2 ring-offset-1 ring-gray-500' : ''}`}
              >
                {formatAppointmentType(type)}
                {isActive && (
                  <span className="ml-0.5 opacity-70 text-[10px] leading-none">
                    ✕
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- DAY VIEW ---- */}
      {view === 'day' && (
        <DayView
          dayDate={dayDate}
          isClosed={dayBusinessHours === null}
          appointments={filteredDayAppointments}
          isLoading={dayLoading}
          nowTopPx={isToday(dayDate) ? nowTopPx : null}
          timeLabels={timeLabels}
          slotLines={slotLines}
          columnHeight={columnHeight}
          businessStartMinutes={businessStartMinutes}
        />
      )}

      {/* ---- MONTH VIEW ---- */}
      {view === 'month' && (
        <MonthView
          monthStart={monthStart}
          appointments={filteredMonthAppointments}
          isLoading={monthLoading}
        />
      )}

      {/* ---- WEEK VIEW ---- */}
      {view === 'week' && (
        <>
          <div
            data-testid="week-view"
            className="border rounded-lg overflow-auto bg-background"
          >
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
              {/* Time labels */}
              <div
                className="relative border-r select-none"
                style={{ height: columnHeight }}
              >
                {timeLabels.map(({ label, top }) => (
                  <span
                    key={label}
                    className="absolute right-1 text-[10px] text-muted-foreground leading-none"
                    style={{ top: top - 6 }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* 15-min grid lines */}
              {slotLines.map(({ key, top }) => (
                <div
                  key={key}
                  className="absolute left-14 right-0 border-t border-muted/50 pointer-events-none"
                  style={{ top }}
                />
              ))}

              {/* Day columns */}
              {weekDays.map((d, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`relative border-r last:border-r-0 ${isToday(d) ? 'bg-orange-50/30' : ''}`}
                  style={{ height: columnHeight }}
                >
                  {/* Current-time indicator (today's column only) */}
                  {isToday(d) && nowTopPx !== null && (
                    <div
                      className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                      style={{ top: nowTopPx }}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 -ml-1" />
                      <div className="flex-1 border-t-2 border-red-500" />
                    </div>
                  )}
                  {weekLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {!weekLoading &&
                    byDay[dayIdx].map((appt) => {
                      const start = new Date(appt.start_time);
                      const end = new Date(appt.end_time);
                      const topPx =
                        minsFromBusinessStart(start, businessStartMinutes) *
                        PX_PER_MIN;
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
                            const BUBBLE_H = 480;
                            const GAP = 12;
                            const spaceRight = window.innerWidth - e.clientX;
                            const left =
                              spaceRight >= BUBBLE_W + GAP
                                ? e.clientX + GAP
                                : Math.max(8, e.clientX - BUBBLE_W - GAP);
                            const top = Math.max(
                              8,
                              Math.min(e.clientY, window.innerHeight - BUBBLE_H)
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
                          {heightPx > 24 && (
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

          {/* Week appointment detail bubble */}
          {selected && bubblePos && (
            <AppointmentBubble
              appt={selected}
              pos={bubblePos}
              bubbleRef={bubbleRef}
              onClose={() => {
                setSelected(null);
                setBubblePos(null);
              }}
            />
          )}
        </>
      )}

      {/* Stats bar */}
      {!isLoading && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3">
          <span>
            {appointments.length} appointment
            {appointments.length !== 1 ? 's' : ''}{' '}
            {view === 'week'
              ? 'this week'
              : view === 'month'
                ? 'this month'
                : 'today'}
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
