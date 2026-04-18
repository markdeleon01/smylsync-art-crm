import { Fragment } from 'react/jsx-runtime';
import { getAllPatients } from '@/lib/services/patients';
import { getUpcomingScheduledAppointments } from '@/lib/services/appointments';
import { PatientsList, type PatientRow, type ApptRow } from './patients-list';

export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
  let patients: PatientRow[] = [];
  let appointments: ApptRow[] = [];

  try {
    const rawPatients = await getAllPatients();
    patients = rawPatients.map((p) => ({
      id: p.id as string,
      firstname: p.firstname as string,
      lastname: p.lastname as string,
      email: p.email as string,
      phone: (p.phone as string | null) ?? null
    }));
  } catch (err) {
    console.error('[PatientsPage] Failed to fetch patients:', err);
    patients = [];
  }

  try {
    const rawAppts = await getUpcomingScheduledAppointments();
    appointments = rawAppts.map((a) => ({
      id: a.id as string,
      patient_id: a.patient_id as string,
      appointment_type: a.appointment_type as string,
      start_time: a.start_time as string,
      end_time: a.end_time as string,
      status: a.status as string,
      notes: (a.notes as string | null) ?? null
    }));
  } catch (err) {
    console.error('[PatientsPage] Failed to fetch appointments:', err);
    appointments = [];
  }

  return (
    <Fragment>
      <div>
        <PatientsList patients={patients} appointments={appointments} />
      </div>
    </Fragment>
  );
}
