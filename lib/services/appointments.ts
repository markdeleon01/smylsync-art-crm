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
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMins * 60 * 1000);
    const id = crypto.randomUUID();
    const data = await sql`
        INSERT INTO appointments (id, patient_id, start_time, end_time, appointment_type, status, notes)
        VALUES (${id}, ${patientId}, ${start.toISOString()}, ${end.toISOString()},
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

/** Generate every 30-min slot boundary for a calendar day */
function generateDaySlots(date: Date): Date[] {
    const slots: Date[] = [];
    const businessHours = getBusinessHoursForDate(date, getClinicBusinessHours());
    if (!businessHours) return slots;

    const current = new Date(date);
    current.setHours(0, businessHours.startMinutes, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(0, businessHours.endMinutes, 0, 0);
    while (current < dayEnd) {
        slots.push(new Date(current));
        current.setMinutes(current.getMinutes() + SLOT_MINUTES);
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
    const dateObj = new Date(date);
    const dayStart = new Date(dateObj);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateObj);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await sql`
        SELECT start_time, end_time
        FROM appointments
        WHERE start_time >= ${dayStart.toISOString()}::timestamptz
          AND start_time <  ${dayEnd.toISOString()}::timestamptz
          AND status != 'cancelled'
    `;

    const durationMins = APPOINTMENT_DURATIONS[appointmentType] ?? 30;
    const slots = generateDaySlots(dateObj);
    const businessHours = getBusinessHoursForDate(dateObj, getClinicBusinessHours());
    if (!businessHours) return [];

    const businessEnd = new Date(dateObj);
    businessEnd.setHours(0, businessHours.endMinutes, 0, 0);

    const available: string[] = [];
    for (const slot of slots) {
        const slotEnd = new Date(slot.getTime() + durationMins * 60 * 1000);
        if (slotEnd > businessEnd) continue;

        const hasConflict = existing.some((appt) => {
            const apptStart = new Date(appt.start_time as string);
            const apptEnd = new Date(appt.end_time as string);
            return apptStart < slotEnd && apptEnd > slot;
        });

        if (!hasConflict) {
            available.push(slot.toISOString());
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
