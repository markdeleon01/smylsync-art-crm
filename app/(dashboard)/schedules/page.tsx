import { SchedulesCalendar } from './calendar';
import {
  getClinicBusinessHours,
  getOrderedBusinessHours
} from '@/lib/clinic-hours';

export const dynamic = 'force-dynamic';

export default function SchedulesPage() {
  const businessHours = getClinicBusinessHours();
  const orderedBusinessHours = getOrderedBusinessHours(businessHours);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
        <p className="text-gray-600">
          View and manage dental appointments. Ask ART to book, rebook, cancel,
          or auto-fill the calendar.
        </p>
      </div>

      <SchedulesCalendar businessHours={businessHours} />
    </div>
  );
}
