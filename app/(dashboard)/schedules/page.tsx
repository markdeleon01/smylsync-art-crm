import { SchedulesCalendar } from './calendar';

export const dynamic = 'force-dynamic';

export default function SchedulesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
        <p className="text-gray-600">
          View and manage dental appointments. Ask ART to book, rebook, cancel,
          or auto-fill the calendar.
        </p>
      </div>

      <SchedulesCalendar />
    </div>
  );
}
