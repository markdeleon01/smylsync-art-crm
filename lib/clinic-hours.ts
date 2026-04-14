const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const;

export type ClinicDayKey = (typeof DAY_KEYS)[number];

export interface DailyBusinessHours {
  startMinutes: number;
  endMinutes: number;
  label: string;
}

export type ClinicBusinessHours = Record<
  ClinicDayKey,
  DailyBusinessHours | null
>;

const DEFAULT_DAY_RANGE = '08:00-17:00';

const DAY_LABELS: Record<ClinicDayKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

function formatMinutes(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 =
    hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;

  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function parseTimeSegment(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function buildDailyHours(value: string): DailyBusinessHours | null {
  if (/^\s*(closed|off)\s*$/i.test(value)) return null;

  const [startText, endText] = value.split('-');
  if (!startText || !endText) return null;

  const startMinutes = parseTimeSegment(startText);
  const endMinutes = parseTimeSegment(endText);

  if (
    startMinutes === null ||
    endMinutes === null ||
    startMinutes >= endMinutes
  ) {
    return null;
  }

  return {
    startMinutes,
    endMinutes,
    label: `${formatMinutes(startMinutes)} - ${formatMinutes(endMinutes)}`
  };
}

function getConfiguredDayHours(day: ClinicDayKey): DailyBusinessHours | null {
  const envName = `CLINIC_HOURS_${day.toUpperCase()}`;
  const configuredValue = process.env[envName]?.trim();

  if (!configuredValue || configuredValue.length === 0) {
    return buildDailyHours(DEFAULT_DAY_RANGE);
  }

  if (/^\s*(closed|off)\s*$/i.test(configuredValue)) {
    return null;
  }

  return (
    buildDailyHours(configuredValue) ?? buildDailyHours(DEFAULT_DAY_RANGE)
  );
}

export function getClinicBusinessHours(): ClinicBusinessHours {
  return DAY_KEYS.reduce((hours, day) => {
    hours[day] = getConfiguredDayHours(day);
    return hours;
  }, {} as ClinicBusinessHours);
}

export function getBusinessHoursForDate(
  date: Date,
  businessHours: ClinicBusinessHours
): DailyBusinessHours | null {
  const jsDay = date.getDay();
  const dayKey = DAY_KEYS[(jsDay + 6) % 7];
  return businessHours[dayKey];
}

export function getBusinessHoursBounds(businessHours: ClinicBusinessHours): {
  startMinutes: number;
  endMinutes: number;
} {
  const openDays = Object.values(businessHours).filter(
    (value): value is DailyBusinessHours => value !== null
  );

  if (openDays.length === 0) {
    return { startMinutes: 8 * 60, endMinutes: 17 * 60 };
  }

  return {
    startMinutes: Math.min(...openDays.map((value) => value.startMinutes)),
    endMinutes: Math.max(...openDays.map((value) => value.endMinutes))
  };
}

export function getOrderedBusinessHours(
  businessHours: ClinicBusinessHours
): Array<{ day: ClinicDayKey; label: string; hoursLabel: string }> {
  return DAY_KEYS.map((day) => ({
    day,
    label: DAY_LABELS[day],
    hoursLabel: businessHours[day]?.label ?? 'Closed'
  }));
}
