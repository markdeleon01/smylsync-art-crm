import { Fragment } from 'react/jsx-runtime';
import { getAllPatients } from '@/lib/services/patients';
import { getUpcomingScheduledAppointments } from '@/lib/services/appointments';
import { PatientsList, type PatientRow, type ApptRow } from './patients-list';

export default async function PatientsPage() {
  let patients: PatientRow[] = [];
  let appointments: ApptRow[] = [];

  try {
    const [rawPatients, rawAppts] = await Promise.all([
      getAllPatients(),
      getUpcomingScheduledAppointments()
    ]);
    patients = rawPatients.map((p) => ({
      id: p.id as string,
      firstname: p.firstname as string,
      lastname: p.lastname as string,
      email: p.email as string
    }));
    appointments = rawAppts.map((a) => ({
      id: a.id as string,
      patient_id: a.patient_id as string,
      appointment_type: a.appointment_type as string,
      start_time: a.start_time as string,
      end_time: a.end_time as string,
      status: a.status as string,
      notes: (a.notes as string | null) ?? null
    }));
  } catch {
    patients = [];
    appointments = [];
  }

  return (
    <Fragment>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">
            Browse all patient records. Ask ART to add, update, or remove a
            patient, or to look up a patient by name, email, or ID.
          </p>
        </div>

        <PatientsList patients={patients} appointments={appointments} />
      </div>
    </Fragment>
  );
}
