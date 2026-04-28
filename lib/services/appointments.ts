import { neon } from '@neondatabase/serverless';
import { APPOINTMENT_DURATIONS, SLOT_MINUTES } from '@/lib/types';
import {
    getBusinessHoursForDate,
    getClinicBusinessHours
} from '@/lib/clinic-hours';

const getDb = () => neon(process.env.POSTGRES_URL!);

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getAllAppointments = async () => {
    const sql = getDb();
    return sql`
        SELECT a.*, p.firstname, p.lastname, p.email
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        ORDER BY a.start_time ASC
    `;
};

export const getAppointmentById = async (id: string) => {
    const sql = getDb();
    const data = await sql`
        SELECT a.*, p.firstname, p.lastname, p.email
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.id = ${id}
    `;
    return data[0];
};

export const getAppointmentsByPatientId = async (patientId: string) => {
    const sql = getDb();
    return sql`
        SELECT a.*, p.firstname, p.lastname, p.email
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.patient_id = ${patientId}
        ORDER BY a.start_time ASC
    `;
};

export const getAppointmentsByDateRange = async (start: string, end: string) => {
    const sql = getDb();
    return sql`
        SELECT a.*, p.firstname, p.lastname, p.email
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.start_time >= ${start}::timestamptz
          AND a.start_time < ${end}::timestamptz
          AND a.status != 'cancelled'
        ORDER BY a.start_time ASC
    `;
};

export const getUpcomingScheduledAppointments = async () => {
    const sql = getDb();
    return sql`
        SELECT id, patient_id, start_time, end_time, appointment_type, status, notes
        FROM appointments
        WHERE status = 'scheduled'
          AND start_time >= NOW()
        ORDER BY start_time ASC
    `;
};

export const getAppointmentsOnDate = async (date: string) => {
    const sql = getDb();
    return sql`
        SELECT a.*, p.firstname, p.lastname, p.email
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.start_time::date = ${date}::date
          AND a.status != 'cancelled'
        ORDER BY a.start_time ASC
    `;
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const bookAppointment = async (
    patientId: string,
    startTime: string,
    appointmentType: string,
    notes?: string
) => {
    const sql = getDb();
    const durationMins = APPOINTMENT_DURATIONS[appointmentType] ?? 30;
    // Store startTime as wall time (no timezone conversion)
    // Accepts 'YYYY-MM-DDTHH:mm' or ISO string, but always stores as local wall time
    let startWall: string;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startTime)) {
        // Already wall time string
        startWall = startTime + ':00'; // add seconds for SQL timestamp
    } else if (/Z$|[+-]\d{2}:?\d{2}$/.test(startTime)) {
        // ISO string with Z or offset: convert to clinic wall time
        const d = new Date(startTime);
        const tz = process.env.CLINIC_TIMEZONE || 'Asia/Manila';
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour12: false
        }).formatToParts(d);
        const get = (type: string) => parts.find((p) => p.type === type)?.value;
        startWall = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
    } else {
        // ISO string without offset: treat as wall time
        startWall = startTime.length === 16 ? startTime + ':00' : startTime;
    }
    // Calculate end time as wall time string
    const [datePart, timePart] = startWall.split('T');
    const [h, m, s] = timePart.split(':').map(Number);
    const endDate = new Date(`${datePart}T${timePart}`);
    endDate.setSeconds(endDate.getSeconds() + durationMins * 60);
    const endWall = `${endDate.getFullYear().toString().padStart(4, '0')}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}T${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:${endDate.getSeconds().toString().padStart(2, '0')}`;
    const id = crypto.randomUUID();
    const data = await sql`
        INSERT INTO appointments (id, patient_id, start_time, end_time, appointment_type, status, notes)
        VALUES (${id}, ${patientId}, ${startWall}, ${endWall},
                ${appointmentType}, 'scheduled', ${notes ?? null})
        RETURNING *
    `;
    return data[0];
};

export const rebookAppointment = async (id: string, newStartTime: string) => {
    const sql = getDb();
    const current = await getAppointmentById(id);
    if (!current) throw new Error(`Appointment ${id} not found`);
    const durationMins = APPOINTMENT_DURATIONS[current.appointment_type as string] ?? 30;
    const start = new Date(newStartTime);
    const end = new Date(start.getTime() + durationMins * 60 * 1000);
    const data = await sql`
        UPDATE appointments
        SET start_time  = ${start.toISOString()},
            end_time    = ${end.toISOString()},
            status      = 'scheduled',
            updated_at  = NOW()
        WHERE id = ${id}
        RETURNING *
    `;
    return data[0];
};

export const cancelAppointment = async (id: string) => {
    const sql = getDb();
    const data = await sql`
        UPDATE appointments
        SET status     = 'cancelled',
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
    `;
    return data[0];
};

export const completeAppointment = async (id: string) => {
    const sql = getDb();
    const appt = await getAppointmentById(id);
    if (!appt) throw new Error(`Appointment ${id} not found`);

    // Backfill patient's last_visit_date
    const visitDate = new Date(appt.start_time as string).toISOString().split('T')[0];
    await sql`
        UPDATE patients
        SET last_visit_date = ${visitDate}::date
        WHERE id = ${appt.patient_id}
    `;

    const data = await sql`
        UPDATE appointments
        SET status     = 'completed',
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
    `;
    return data[0];
};

// ---------------------------------------------------------------------------
// Reminder helpers
// ---------------------------------------------------------------------------

/**
 * Returns all scheduled appointments that start between 23 and 25 hours from
 * now and have not yet had a reminder email sent. The 2-hour window ensures
 * an hourly cron never misses or double-fires.
 */
export const getAppointmentsDueForReminder = async () => {
    const sql = getDb();
    return sql`
        SELECT a.*, p.firstname, p.lastname, p.email
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.status = 'scheduled'
          AND a.reminder_sent = FALSE
          AND a.start_time > NOW() + INTERVAL '23 hours'
          AND a.start_time <= NOW() + INTERVAL '25 hours'
        ORDER BY a.start_time ASC
    `;
};

/** Mark a single appointment's reminder as sent. */
export const markReminderSent = async (id: string) => {
    const sql = getDb();
    await sql`
        UPDATE appointments
        SET reminder_sent = TRUE,
            updated_at    = NOW()
        WHERE id = ${id}
    `;
};

// ---------------------------------------------------------------------------
// Availability helpers
// ---------------------------------------------------------------------------

/**
 * Converts a wall-clock time (minutes since midnight) on a calendar date to a UTC
 * Date, interpreting the wall clock in the clinic's configured timezone.
 * Works correctly for fixed-offset zones (e.g. Asia/Manila UTC+8) and DST zones.
 */
function wallClockToUTC(dateStr: string, wallMinutes: number): Date {
    const tz = process.env.CLINIC_TIMEZONE ?? 'UTC';
    const [y, m, d] = dateStr.split('-').map(Number);
    const h = Math.floor(wallMinutes / 60);
    const min = wallMinutes % 60;
    // Naively treat wall-clock as UTC, then correct using the Intl offset
    const guess = new Date(Date.UTC(y, m - 1, d, h, min, 0, 0));
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    }).formatToParts(guess);
    const get = (type: string) => {
        const v = parts.find((p) => p.type === type)?.value ?? '0';
        return parseInt(v === '24' ? '0' : v, 10);
    };
    const clinicMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    return new Date(guess.getTime() - (clinicMs - guess.getTime()));
}

/** Generate every 30-min slot boundary for a calendar day in the clinic's timezone */
function generateDaySlots(dateStr: string): string[] {
    // Returns wall time slot strings: 'YYYY-MM-DDTHH:mm:ss'
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateForDow = new Date(y, m - 1, d);
    const businessHours = getBusinessHoursForDate(dateForDow, getClinicBusinessHours());
    if (!businessHours) return [];

    const slots: string[] = [];
    let h = Math.floor(businessHours.startMinutes / 60);
    let min = businessHours.startMinutes % 60;
    let endMins = businessHours.endMinutes;
    while ((h * 60 + min) < endMins) {
        const slot = `${dateStr}T${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
        slots.push(slot);
        min += SLOT_MINUTES;
        if (min >= 60) {
            h += 1;
            min = min % 60;
        }
    }
    return slots;
}

/**
 * Returns ISO timestamp strings for every open slot on the given date.
 * A slot is open when no existing appointment overlaps its [start, start+duration) window.
 */
export const getAvailableSlots = async (
    date: string,
    appointmentType = 'checkup'
) => {
    const sql = getDb();
    // Query all appointments for the day (wall time)
    const existing = await sql`
        SELECT start_time, end_time
        FROM appointments
        WHERE start_time::date = ${date}::date
          AND status != 'cancelled'
    `;

    const durationMins = APPOINTMENT_DURATIONS[appointmentType] ?? 30;
    const slots = generateDaySlots(date);
    const available: string[] = [];
    for (const slot of slots) {
        // slot is wall time string 'YYYY-MM-DDTHH:mm:ss'
        const slotStart = new Date(slot);
        const slotEnd = new Date(slotStart.getTime() + durationMins * 60 * 1000);

        const hasConflict = existing.some((appt) => {
            const apptStart = new Date(appt.start_time as string);
            const apptEnd = new Date(appt.end_time as string);
            return apptStart < slotEnd && apptEnd > slotStart;
        });

        if (!hasConflict) {
            available.push(slot);
        }
    }
    return available;
};

// ---------------------------------------------------------------------------
// Autofill
// ---------------------------------------------------------------------------

/**
 * Automatically books patients who are overdue for a recall appointment
 * into the earliest available slots, packing from the start of each day
 * to minimise calendar gaps.
 */
export const autofillSchedule = async (
    weeksAhead = 4,
    maxBookings = 20
) => {
    const sql = getDb();

    // Patients overdue for recall with no upcoming scheduled appointment
    const overdue = await sql`
        SELECT p.*,
               (p.last_visit_date + (p.recall_interval_months * interval '1 month')) AS recall_due_date
        FROM patients p
        WHERE p.last_visit_date IS NOT NULL
          AND (p.last_visit_date + (p.recall_interval_months * interval '1 month')) <= NOW() + interval '7 days'
          AND p.id NOT IN (
              SELECT DISTINCT patient_id FROM appointments
              WHERE status = 'scheduled' AND start_time > NOW()
          )
        ORDER BY (p.last_visit_date + (p.recall_interval_months * interval '1 month')) ASC
        LIMIT ${maxBookings}
    `;

    // Patients who have never been seen and have no future appointment
    const remaining = maxBookings - overdue.length;
    const neverSeen = remaining > 0
        ? await sql`
            SELECT p.*, NULL::date AS recall_due_date
            FROM patients p
            WHERE p.last_visit_date IS NULL
              AND p.id NOT IN (
                  SELECT DISTINCT patient_id FROM appointments
                  WHERE status = 'scheduled' AND start_time > NOW()
              )
            LIMIT ${remaining}
          `
        : [];

    const patientsToBook = [...overdue, ...neverSeen].slice(0, maxBookings);

    if (patientsToBook.length === 0) {
        return {
            booked: [] as { patientId: string; patientName: string; appointmentId: string; scheduledAt: string }[],
            message: 'No patients are currently due for scheduling.'
        };
    }

    // Build list of working days in the window
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const workDays: Date[] = [];
    for (let i = 0; i <= weeksAhead * 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dow = d.getDay();
        if (dow >= 1 && dow <= 5) workDays.push(d);
    }

    const appointmentType = 'cleaning'; // default for auto-fill
    const booked: { patientId: string; patientName: string; appointmentId: string; scheduledAt: string }[] = [];

    for (const patient of patientsToBook) {
        if (booked.length >= maxBookings) break;
        let bookedForPatient = false;

        for (const day of workDays) {
            if (bookedForPatient) break;
            const dateStr = day.toISOString().split('T')[0];
            const slots = await getAvailableSlots(dateStr, appointmentType);

            if (slots.length > 0) {
                // Pick the first slot on the day to pack the schedule from the front
                try {
                    const appt = await bookAppointment(
                        patient.id as string,
                        slots[0],
                        appointmentType
                    );
                    booked.push({
                        patientId: patient.id as string,
                        patientName: `${patient.firstname} ${patient.lastname}`,
                        appointmentId: appt.id as string,
                        scheduledAt: slots[0]
                    });
                    bookedForPatient = true;
                } catch {
                    // Slot was taken by a concurrent write – try next slot
                    continue;
                }
            }
        }
    }

    return {
        booked,
        message: `Successfully scheduled ${booked.length} appointment(s).`
    };
};
