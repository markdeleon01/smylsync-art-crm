import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Fragment } from 'react/jsx-runtime';
import { getAllPatients } from '@/lib/services/patients';

export default async function PatientsPage() {
  const patients = await getAllPatients();

  return (
    <Fragment>
      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
          <CardDescription>View all patients.</CardDescription>
        </CardHeader>

        {patients && patients.length > 0 ? (
          patients.map((patient) => (
            <CardContent key={patient.id} className="space-y-4">
              <div className="border-b pb-4 last:border-b-0">
                <div>
                  <div className="mb-2">
                    <span className="font-bold">ID:</span>
                    <span className="ml-2">{patient.id}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-bold">Name:</span>
                    <span className="ml-2">
                      {patient.firstname} {patient.lastname}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold">Email:</span>
                    <span className="ml-2">{patient.email}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          ))
        ) : (
          <p className="text-gray-500">No patients found.</p>
        )}
      </Card>
    </Fragment>
  );
}
