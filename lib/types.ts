export interface Patient {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    recall_interval_months?: number;
    last_visit_date?: string | null;
}

export interface Appointment {
    id: string;
    patient_id: string;
    start_time: string;
    end_time: string;
    appointment_type: string;
    status: 'scheduled' | 'cancelled' | 'completed' | 'rebooked';
    notes: string | null;
    created_at: string;
    updated_at: string;
    // joined from patients
    firstname?: string;
    lastname?: string;
    email?: string;
}

export const APPOINTMENT_TYPES = [
    'consultation',
    'checkup',
    'x-ray',
    'cleaning',
    'filling',
    'extraction',
    'crown',
    'root-canal',
    'whitening'
] as const;

export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

/** Duration in minutes for each appointment type */
export const APPOINTMENT_DURATIONS: Record<string, number> = {
    consultation: 30,
    checkup: 30,
    'x-ray': 30,
    cleaning: 60,
    filling: 60,
    whitening: 60,
    extraction: 90,
    crown: 120,
    'root-canal': 120
};

export const BUSINESS_HOURS = { start: 8, end: 17 }; // 8 AM – 5 PM
export const SLOT_MINUTES = 30;
