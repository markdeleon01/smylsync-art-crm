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
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">View all patients.</p>
        </div>

        {patients && patients.length > 0 ? (
          <div className="space-y-4">
            {patients.map((patient) => (
              <Card
                key={patient.id}
                className="shadow-md hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
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
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No patients found.</p>
          </div>
        )}
      </div>
    </Fragment>
  );
}
